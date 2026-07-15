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

export async function createResourceAllocation(allocation: Omit<ResourceAllocation, "id" | "created_at" | "updated_at">): Promise<{ data: ResourceAllocation | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("project_resource_allocations")
    .insert([allocation])
    .select("*")
    .single();

  return {
    data: (data as ResourceAllocation | null) ?? null,
    error,
  };
}
