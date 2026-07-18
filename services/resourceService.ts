import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { ResourceAllocation, Profile } from "../types";

export interface ResourceAllocationWithProfile extends ResourceAllocation {
  profile: Profile | null;
}

export async function getResourceAllocations(projectId: string): Promise<{ data: ResourceAllocationWithProfile[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("project_resource_allocations")
    .select("*, profile:profiles(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const allocations = (data as any[])?.map((item) => {
    return {
      ...item,
      profile: item.profile ? (Array.isArray(item.profile) ? item.profile[0] : item.profile) : null,
    };
  }) ?? [];

  return { data: allocations, error };
}

export async function getAllResourceAllocations(): Promise<{ data: ResourceAllocation[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("project_resource_allocations")
    .select("*");

  return { data: data ?? [], error };
}

export async function getAllAssignmentsWithDetails(): Promise<{ data: any[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("project_resource_allocations")
    .select(`
      *,
      profile:profiles(id, full_name, role, email),
      project:projects!inner(id, name, pm_id)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Map to format correctly
  const formattedData = (data as any[])?.map(item => ({
    ...item,
    profile: item.profile ? (Array.isArray(item.profile) ? item.profile[0] : item.profile) : null,
    project: item.project ? (Array.isArray(item.project) ? item.project[0] : item.project) : null,
  })) ?? [];

  return { data: formattedData, error };
}

export async function getTeamMembers(): Promise<{ data: Profile[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["project_team", "project_manager", "pmo", "administrator"])
    .order("full_name", { ascending: true });

  return { data: data ?? [], error };
}

export async function createResourceAllocation(
  allocation: Omit<ResourceAllocation, "id" | "created_at" | "updated_at">,
  auditContext?: { performerId: string }
): Promise<{ data: ResourceAllocation | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("project_resource_allocations")
    .insert([allocation])
    .select("*")
    .single();

  if (!error && data && auditContext) {
    const { logProjectActivity } = await import("./auditService");
    await logProjectActivity({
      project_id: data.project_id,
      actor_id: auditContext.performerId,
      module: "RESOURCE_LOAD",
      action_type: "CREATE",
      item_label: `Penugasan ${data.functional_role}`,
      new_data: data
    });
  }

  return {
    data: (data as ResourceAllocation | null) ?? null,
    error,
  };
}

export async function updateResourceAllocation(
  id: string,
  updates: Partial<Omit<ResourceAllocation, "id" | "created_at" | "updated_at">>,
  auditContext?: { performerId: string }
): Promise<{ data: ResourceAllocation | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data: oldData } = await supabase.from("project_resource_allocations").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("project_resource_allocations")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (!error && oldData && data && auditContext) {
    const { logProjectActivity } = await import("./auditService");
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
        project_id: data.project_id,
        actor_id: auditContext.performerId,
        module: "RESOURCE_LOAD",
        action_type: "UPDATE",
        item_label: `Penugasan ${data.functional_role}`,
        old_data: changedOldData,
        new_data: changedNewData
      });
    }
  }

  return {
    data: (data as ResourceAllocation | null) ?? null,
    error,
  };
}

export async function getActiveFunctionalRoles(): Promise<{ data: import("../types").FunctionalRole[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("functional_roles")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return {
    data: (data as import("../types").FunctionalRole[]) ?? [],
    error,
  };
}

export async function getAllFunctionalRoles(): Promise<{ data: import("../types").FunctionalRole[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("functional_roles")
    .select("*")
    .order("name", { ascending: true });

  return {
    data: (data as import("../types").FunctionalRole[]) ?? [],
    error,
  };
}

export async function createFunctionalRole(
  payload: { name: string; department?: string; default_hourly_rate?: number }
): Promise<{ data: import("../types").FunctionalRole | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("functional_roles")
    .insert([payload])
    .select("*")
    .single();

  return {
    data: (data as import("../types").FunctionalRole | null) ?? null,
    error,
  };
}
