import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { Project } from "../types";

export async function getProjects(userId?: string, role?: string): Promise<{ data: Project[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: [], error: null };
  }

  // If role is project_team, we must fetch projects where they are in resource allocations
  if (role === 'project_team' && userId) {
    // 1. Get project IDs from project_resource_allocations
    const { data: allocations, error: allocError } = await supabase
      .from('project_resource_allocations')
      .select('project_id')
      .eq('user_id', userId);

    if (allocError) return { data: [], error: allocError };

    const allocatedProjectIds = allocations?.map(a => a.project_id) || [];

    // 2. Query projects where they are either PM or allocated
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .or(`pm_id.eq.${userId},id.in.(${allocatedProjectIds.length > 0 ? allocatedProjectIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
      .order("created_at", { ascending: false });

    return { data: (data as Project[] | null) ?? [], error };
  }

  // Default behavior (pmo, admin, or fallback relying on RLS)
  let query = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
    
  if (role === 'project_manager' && userId) {
    query = query.eq('pm_id', userId);
  }

  const { data, error } = await query;

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
  if ((payload.contract_value_excl_tax ?? 0) < 0) {
    return { data: null, error: { message: "Contract value cannot be negative.", code: "400" } as any };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert([{
      ...payload,
      contract_value_excl_tax: payload.contract_value_excl_tax ?? 0,
      status: payload.status || "Draft",
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

export async function updateProjectLegalStatus(
  projectId: string,
  updates: {
    spk_status?: import("@/types").LegalStatus;
    nda_status?: import("@/types").LegalStatus;
    spk_document_url?: string;
    nda_document_url?: string;
  },
  auditContext: { performerId: string; performerRole: string }
): Promise<{ data: Project | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: { message: 'No client' } as any };

  if (auditContext.performerRole !== 'administrator' && auditContext.performerRole !== 'pmo') {
    return { data: null, error: { message: "Unauthorized. Only PMO or Administrator can update legal status.", code: "403" } as any };
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select("*")
    .maybeSingle();

  if (!error) {
    const { createAuditLog } = await import("./auditService");
    await createAuditLog({
      entity: "Project Compliance",
      entity_id: projectId,
      action: "UPDATE_LEGAL_STATUS",
      performed_by: auditContext.performerId,
      details: {
        description: `Project legal status and compliance documents updated.`,
        updated_fields: Object.keys(updates).join(', ')
      }
    });
  }

  return { data: (data as Project | null) ?? null, error };
}

export async function updateProjectMetadata(
  projectId: string,
  updates: Partial<import("@/types").ProjectMetadataPayload>,
  auditContext: { performerId: string; performerRole: string; userEmail: string }
): Promise<{ data: Project | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: { message: 'No client' } as any };

  if (auditContext.performerRole !== 'administrator' && auditContext.performerRole !== 'pmo') {
    return { data: null, error: { message: "Unauthorized: Only PMO and Administrator can edit core project metadata.", code: "403" } as any };
  }

  // Get current project to record the old state for the audit log
  const { data: oldData } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select("*")
    .maybeSingle();

  if (!error && oldData && data) {
    const { logProjectActivity } = await import("./auditService");
    
    // Extract only changed fields for cleaner diff
    const changedOldData: Record<string, unknown> = {};
    const changedNewData: Record<string, unknown> = {};
    
    for (const key of Object.keys(updates)) {
      if ((oldData as any)[key] !== (updates as any)[key]) {
        changedOldData[key] = (oldData as any)[key];
        changedNewData[key] = (updates as any)[key];
      }
    }

    if (Object.keys(changedNewData).length > 0) {
      await logProjectActivity({
        project_id: projectId,
        actor_id: auditContext.performerId,
        module: "METADATA",
        action_type: "UPDATE",
        item_label: `Metadata Proyek`,
        old_data: changedOldData,
        new_data: changedNewData,
      });
    }
  }

  return { data: (data as Project | null) ?? null, error };
}
