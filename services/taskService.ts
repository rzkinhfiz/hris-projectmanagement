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
