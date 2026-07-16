import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { GovernanceWarning } from "../types";

export interface AuditLog {
  id: string;
  entity: string;
  entity_id: string | null;
  action: string;
  performed_by: string | null;
  details: Record<string, string | number | boolean | null> | null;
  created_at: string;
}

export type AuditLogInput = Omit<AuditLog, "id" | "created_at">;

function createServiceError(message: string): PostgrestError {
  return {
    message,
    code: "500",
    details: "",
    hint: "",
    toJSON: () => ({ message, code: "500", details: "", hint: "" }),
    name: "ServiceError",
  } as PostgrestError;
}

export async function createAuditLog(log: AuditLogInput): Promise<{ data: AuditLog | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      data: null,
      error: createServiceError("Supabase client is unavailable."),
    };
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      entity: log.entity,
      entity_id: log.entity_id,
      action: log.action,
      performed_by: log.performed_by,
      details: log.details ? JSON.stringify(log.details) : null,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return {
    data: data as AuditLog | null,
    error: null,
  };
}

export async function resolveWarningAudit(
  warning: GovernanceWarning,
  performerId: string,
): Promise<{ data: AuditLog | null; error: PostgrestError | null }> {
  return createAuditLog({
    entity: "Warning",
    entity_id: warning.id,
    action: "RESOLVE_WARNING",
    performed_by: performerId,
    details: {
      warning_code: warning.warning_code,
      project_id: warning.project_id,
      level: warning.level,
    },
  });
}

import type { CreateProjectActivityPayload, ProjectActivityLog } from "../types";

export async function logProjectActivity(payload: CreateProjectActivityPayload) {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: createServiceError("Supabase client is unavailable.") };
  
  const { data, error } = await supabase
    .from("project_activity_logs")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Failed to log project activity:", error);
  }
  return { data, error };
}

export async function getProjectActivityLogs(projectId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: createServiceError("Supabase client is unavailable.") };
  
  const { data, error } = await supabase
    .from("project_activity_logs")
    .select(`
      *,
      actor:profiles!actor_id(*)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return { data: data as ProjectActivityLog[] | null, error };
}
