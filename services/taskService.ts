import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { ProgressUpdate, Task, Workstream } from "../types";
import { createAuditLog } from "./auditService";

type ServiceError = Error | PostgrestError | { message: string; code: string; details: string; hint: string };

export interface TaskWithWorkstream extends Task {
  workstream: Workstream | null;
}

interface TaskWithWorkstreamRelation extends Task {
  workstreams?: Workstream | Workstream[] | null;
}

export async function getTasksByProject(projectId: string): Promise<{ data: TaskWithWorkstream[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*, workstreams(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error };
  }

  const tasks = (data as TaskWithWorkstreamRelation[] | null)?.map((item) => {
    const workstream = Array.isArray(item.workstreams)
      ? item.workstreams[0] ?? null
      : item.workstreams ?? null;

    return {
      ...item,
      workstream,
    } satisfies TaskWithWorkstream;
  }) ?? [];

  return { data: tasks, error: null };
}

export async function getAllTasks(): Promise<{ data: TaskWithWorkstream[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*, workstreams(*)")
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error };
  }

  const tasks = (data as TaskWithWorkstreamRelation[] | null)?.map((item) => {
    const workstream = Array.isArray(item.workstreams)
      ? item.workstreams[0] ?? null
      : item.workstreams ?? null;

    return {
      ...item,
      workstream,
    } satisfies TaskWithWorkstream;
  }) ?? [];

  return { data: tasks, error: null };
}

export async function updateTaskProgress(
  taskId: string,
  progress: number,
  note?: string,
): Promise<{ task: Task | null; progressUpdate: ProgressUpdate | null; error: ServiceError | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      task: null,
      progressUpdate: null,
      error: { message: "Supabase client is unavailable.", code: "500", details: "", hint: "" },
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user?.id) {
    return {
      task: null,
      progressUpdate: null,
      error: userError ?? { message: "User is not authenticated.", code: "401", details: "", hint: "" },
    };
  }

  const { data: taskData, error: taskError } = await supabase
    .from("tasks")
    .update({
      progress,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select("*")
    .maybeSingle();

  if (taskError || !taskData) {
    return {
      task: null,
      progressUpdate: null,
      error: taskError,
    };
  }

  const { data: progressUpdateData, error: progressUpdateError } = await supabase
    .from("progress_updates")
    .insert({
      task_id: taskId,
      project_id: taskData.project_id,
      updated_by: userData.user.id,
      progress,
      note: note ?? null,
    })
    .select("*")
    .maybeSingle();

  const auditLogResult = await createAuditLog({
    entity: "Task",
    entity_id: taskId,
    action: "UPDATE_PROGRESS",
    performed_by: userData.user.id,
    details: {
      task_id: taskId,
      progress,
      note: note ?? null,
      project_id: taskData.project_id,
    },
  });

  if (auditLogResult.error) {
    return {
      task: taskData as Task,
      progressUpdate: (progressUpdateData as ProgressUpdate | null) ?? null,
      error: progressUpdateError ?? auditLogResult.error,
    };
  }

  return {
    task: taskData as Task,
    progressUpdate: (progressUpdateData as ProgressUpdate | null) ?? null,
    error: progressUpdateError,
  };
}

export async function createTask(
  payload: import("../types").CreateTaskPayload
): Promise<{ data: Task | null; error: ServiceError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: { message: "Supabase client is unavailable.", code: "500", details: "", hint: "" } as any };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.id) return { data: null, error: userError as any };

  const insertPayload: any = {
    project_id: payload.project_id,
    name: payload.name,
    priority: payload.priority,
    status: "To Do",
    progress: 0,
    is_milestone: false,
    is_governance_readonly: false,
    estimated_hours: payload.estimated_hours || 0
  };

  if (payload.owner_id) insertPayload.owner_id = payload.owner_id;
  if (payload.planned_start) insertPayload.planned_start = payload.planned_start;
  if (payload.planned_end) insertPayload.planned_end = payload.planned_end;

  const { data, error } = await supabase
    .from("tasks")
    .insert(insertPayload)
    .select("*")
    .maybeSingle();

  if (error) return { data: null, error };

  await createAuditLog({
    entity: "Task",
    entity_id: data.id,
    action: "CREATE_TASK",
    performed_by: userData.user.id,
    details: { project_id: payload.project_id, name: payload.name }
  });

  return { data: data as Task, error: null };
}

export async function updateTaskStatus(
  taskId: string,
  updates: Partial<Task>,
  userId: string,
  note?: string
): Promise<{ data: Task | null; error: ServiceError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: { message: "Supabase client is unavailable.", code: "500", details: "", hint: "" } as any };

  const { data, error } = await supabase
    .from("tasks")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select("*")
    .maybeSingle();

  if (error) return { data: null, error };

  if (note && updates.progress !== undefined) {
    await supabase.from("progress_updates").insert({
      task_id: taskId,
      project_id: data.project_id,
      updated_by: userId,
      progress: updates.progress,
      note,
    });
  }

  await createAuditLog({
    entity: "Task",
    entity_id: taskId,
    action: "UPDATE_TASK",
    performed_by: userId,
    details: { updated_fields: Object.keys(updates).join(', '), note: note || null }
  });

  return { data: data as Task, error: null };
}

export async function deleteTask(
  taskId: string,
  userId: string
): Promise<{ error: ServiceError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: { message: "Supabase client is unavailable.", code: "500", details: "", hint: "" } as any };

  const { data: task, error: fetchErr } = await supabase.from("tasks").select("project_id").eq("id", taskId).maybeSingle();
  if (fetchErr) return { error: fetchErr };

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return { error };

  if (task) {
    await createAuditLog({
      entity: "Task",
      entity_id: taskId,
      action: "DELETE_TASK",
      performed_by: userId,
      details: { project_id: task.project_id }
    });
  }

  return { error: null };
}

