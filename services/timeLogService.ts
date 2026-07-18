import { getSupabaseClient } from "../lib/supabaseClient";
import type { TimeLog, TimeLogPayload, TimeLogStatus } from "../types";
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { logProjectActivity } from './auditService';

export async function getMyWeeklyLogs(profileId: string, startDate: Date, endDate: Date) {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: new Error("Supabase client not initialized") };

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('time_logs')
    .select(`
      *,
      project:projects(name, code),
      task:tasks(name)
    `)
    .eq('profile_id', profileId)
    .gte('log_date', startStr)
    .lte('log_date', endStr)
    .order('log_date', { ascending: true });

  return { data: (data as unknown as TimeLog[]) || [], error };
}

export async function getAssignedTasksForDateRange(profileId: string, startDate: Date, endDate: Date) {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: new Error("Supabase client not initialized") };

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      name,
      project_id,
      planned_start,
      planned_end,
      estimated_hours,
      projects!inner(name)
    `)
    .eq('owner_id', profileId)
    .in('status', ['TODO', 'IN_PROGRESS', 'REVIEW'])
    .lte('planned_start', endStr)
    .gte('planned_end', startStr);

  return { data: data || [], error };
}

export async function getTeamTimeLogs(profileId: string, role: string, filters?: import('@/types').TeamTimeLogFilters) {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: new Error("Supabase client not initialized") };

  let query = supabase
    .from('time_logs')
    .select(`
      *,
      project:projects!inner(name, code, pm_id),
      task:tasks(name, estimated_hours, actual_hours, progress, planned_start, planned_end),
      profile:profiles!profile_id(full_name, role, status)
    `);

  // Apply PM filtering if applicable
  if (role === 'project_manager') {
    query = query.eq('projects.pm_id', profileId);
  }

  // Apply filters
  if (filters) {
    if (filters.status && filters.status !== 'ALL') {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }
    
    if (filters.userId) {
      query = query.eq('profile_id', filters.userId);
    }
    
    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    
    if (filters.startDate) {
      query = query.gte('log_date', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('log_date', filters.endDate);
    }
  }

  const { data, error } = await query.order('log_date', { ascending: false });
  if (error) {
    console.error("getTeamTimeLogs error:", error);
  }
  return { data: (data as unknown as TimeLog[]) || [], error };
}

export async function saveTimeLogEntry(profileId: string, payload: TimeLogPayload) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase client not initialized") };

  // Format explicitly as string 'YYYY-MM-DD'
  const logDateStr = payload.log_date;

  // Upsert pattern based on user, project, task, and date
  const { data: existing, error: findError } = await supabase
    .from('time_logs')
    .select('id, status')
    .eq('profile_id', profileId)
    .eq('project_id', payload.project_id)
    .eq('task_id', payload.task_id)
    .eq('log_date', logDateStr)
    .maybeSingle();

  if (findError) return { error: findError };

  if (existing) {
    if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED' && existing.status !== 'REVISION_REQUESTED') {
      return { error: new Error("Cannot edit a submitted or approved log") };
    }
    const { error } = await supabase
      .from('time_logs')
      .update({
        hours: payload.hours,
        status: payload.status || 'DRAFT',
        proposed_hours: null, // clear proposed_hours on edit
        negotiation_notes: null, // clear notes on edit
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
      
    if (!error && payload.task_id) {
      const { data: taskData } = await supabase.from('tasks').select('status').eq('id', payload.task_id).single();
      if (taskData?.status === 'TODO') {
        await supabase.from('tasks').update({ status: 'IN_PROGRESS', updated_at: new Date().toISOString() }).eq('id', payload.task_id);
      }
    }
    
    return { error };
  } else {
    const { error } = await supabase
      .from('time_logs')
      .insert({
        profile_id: profileId,
        project_id: payload.project_id,
        task_id: payload.task_id,
        log_date: logDateStr,
        hours: payload.hours,
        status: payload.status || 'DRAFT'
      });
      
    if (!error && payload.task_id) {
      const { data: taskData } = await supabase.from('tasks').select('status').eq('id', payload.task_id).single();
      if (taskData?.status === 'TODO') {
        await supabase.from('tasks').update({ status: 'IN_PROGRESS', updated_at: new Date().toISOString() }).eq('id', payload.task_id);
      }
    }
    
    return { error };
  }
}

export async function submitWeeklyTimesheet(profileId: string, logIds: string[]) {
  const supabase = getSupabaseClient();
  if (!supabase || logIds.length === 0) return { error: null };

  const { error } = await supabase
    .from('time_logs')
    .update({ 
      status: 'SUBMITTED',
      updated_at: new Date().toISOString()
    })
    .in('id', logIds)
    .eq('profile_id', profileId)
    .in('status', ['DRAFT', 'REJECTED', 'REVISION_REQUESTED']);

  return { error };
}

export async function approveOrRejectTimeLog(
  logId: string, 
  status: 'APPROVED' | 'REJECTED', 
  rejectionReason: string | null, 
  taskId: string,
  performer?: { id: string, name: string, role: string }
) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase client not initialized") };

  let is_executive_override = false;
  let approved_by = performer?.id || null;

  // Check for executive override
  if (performer && (performer.role === 'pmo' || performer.role === 'administrator') && status === 'APPROVED') {
    const { data: logData } = await supabase
      .from('time_logs')
      .select('project_id, projects!inner(pm_id)')
      .eq('id', logId)
      .maybeSingle();
      
    if (logData && logData.projects && (logData.projects as any).pm_id !== performer.id) {
      is_executive_override = true;
      
      // Log audit
      await logProjectActivity({
        project_id: logData.project_id,
        actor_id: performer.id,
        module: 'TIME_LOG',
        action_type: 'APPROVE',
        item_label: `[EXECUTIVE OVERRIDE] Approved by PMO Executive (${performer.name}) on behalf of Assigned PM.`,
      });
    }
  }

  const { error } = await supabase
    .from('time_logs')
    .update({ 
      status, 
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString(),
      ...(status === 'APPROVED' ? { approved_by, is_executive_override } : {})
    })
    .eq('id', logId);

  if (error) return { error };

  // Dynamic Recalculation Rule
  if (status === 'APPROVED') {
    const { data: sums, error: sumError } = await supabase
      .from('time_logs')
      .select('hours')
      .eq('task_id', taskId)
      .eq('status', 'APPROVED');

    if (sumError) {
      console.error("Failed to sum time logs for task:", sumError);
      return { error: sumError };
    }

    const totalHours = sums.reduce((acc, log) => acc + Number(log.hours), 0);

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ actual_hours: totalHours })
      .eq('id', taskId);

    if (updateError) {
      console.error("Failed to update task actual_hours:", updateError);
      return { error: updateError };
    }
  }

  return { error: null };
}

export async function requestTimeLogRevision(logId: string, proposedHours: number, notes: string, reviewerId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase client not initialized") };

  const { error } = await supabase
    .from('time_logs')
    .update({ 
      status: 'REVISION_REQUESTED',
      proposed_hours: proposedHours,
      negotiation_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', logId);

  // We could call logProjectActivity here if we fetched the log first to get project_id
  // but for now, we just return the error.
  return { error };
}

export async function acceptProposedRevision(logId: string, userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase client not initialized") };

  // Fetch the log to get proposed_hours and task_id
  const { data: log, error: fetchError } = await supabase
    .from('time_logs')
    .select('proposed_hours, task_id')
    .eq('id', logId)
    .single();

  if (fetchError || !log) return { error: fetchError || new Error("Log not found") };
  if (log.proposed_hours === null) return { error: new Error("No proposed hours found") };

  // Update the log
  const { error: updateError } = await supabase
    .from('time_logs')
    .update({
      hours: log.proposed_hours,
      proposed_hours: null,
      negotiation_notes: null,
      status: 'APPROVED',
      updated_at: new Date().toISOString()
    })
    .eq('id', logId)
    .eq('profile_id', userId); // Ensure the user owns it

  if (updateError) return { error: updateError };

  // Trigger Dynamic Recalculation
  const { data: sums, error: sumError } = await supabase
    .from('time_logs')
    .select('hours')
    .eq('task_id', log.task_id)
    .eq('status', 'APPROVED');

  if (sumError) return { error: sumError };

  const totalHours = sums.reduce((acc, l) => acc + Number(l.hours), 0);

  const { error: taskError } = await supabase
    .from('tasks')
    .update({ actual_hours: totalHours })
    .eq('id', log.task_id);

  return { error: taskError };
}
