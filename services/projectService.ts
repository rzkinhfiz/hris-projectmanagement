import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { Project } from "../types";

export async function getProjects(): Promise<{ data: Project[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return {
    data: (data as Project[] | null) ?? [],
    error,
  };
}

export async function getProjectDetails(projectId: string): Promise<{ data: Project | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  return {
    data: (data as Project | null) ?? null,
    error,
  };
}

export async function getProjectById(id: string): Promise<{ data: Project | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  return {
    data: (data as Project | null) ?? null,
    error,
  };
}

import type { CreateProjectPayload } from "../types";

export async function createProject(
  payload: CreateProjectPayload,
  auditContext: { performerId: string; performerRole: string }
): Promise<{ data: Project | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  // Validation: Role check
  if (auditContext.performerRole !== "pmo" && auditContext.performerRole !== "project_manager" && auditContext.performerRole !== "administrator") {
    return { data: null, error: { message: "Unauthorized. Only PMO, Project Manager, or Administrator can create projects.", code: "403" } as any };
  }

  // Validation: Contract value >= 0
  if (payload.contract_value_excl_tax < 0) {
    return { data: null, error: { message: "Contract value cannot be negative.", code: "400" } as any };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert([{
      ...payload,
      status: payload.status || "draft",
    }])
    .select("*")
    .single();

  if (!error && data) {
    const { createAuditLog } = await import("./auditService");
    await createAuditLog({
      entity: "Project",
      entity_id: data.id,
      action: "CREATE_PROJECT",
      performed_by: auditContext.performerId,
      details: {
        reason: `Proyek baru ${payload.name} dibuat dengan Nilai Kontrak Rp${payload.contract_value_excl_tax}`,
      }
    });
  }

  return {
    data: (data as Project | null) ?? null,
    error,
  };
}

export async function deleteProject(
  id: string,
  auditContext: { performerId: string; performerRole: string }
): Promise<{ error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: null };

  if (auditContext.performerRole !== "administrator") {
    return { error: { message: "Unauthorized. Only Administrator can delete projects.", code: "403" } as any };
  }

  const { createAuditLog } = await import("./auditService");
  await createAuditLog({
    entity: "Project",
    entity_id: id,
    action: "DELETE_PROJECT",
    performed_by: auditContext.performerId,
    details: {
      reason: `[ADMIN_OVERRIDE] Project permanently deleted by administrator.`,
    }
  });

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  return { error };
}
