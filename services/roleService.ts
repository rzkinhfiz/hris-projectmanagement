import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { FunctionalRole } from "../types";

/**
 * Updates a functional role.
 * 
 * @param id The UUID of the functional role
 * @param updates Partial updates (e.g. name, department, default_hourly_rate)
 */
export async function updateFunctionalRole(
  id: string,
  updates: Partial<Omit<FunctionalRole, "id" | "created_at" | "updated_at">>
): Promise<{ data: FunctionalRole | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("functional_roles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  return {
    data: (data as FunctionalRole | null) ?? null,
    error,
  };
}

/**
 * Deactivates a functional role (Soft Delete).
 * It will set `is_active = false`.
 * Before calling this, ensure UI logic checks if the role is currently heavily used, or just let RLS/Database logic handle it.
 * 
 * @param id The UUID of the functional role
 */
export async function deactivateFunctionalRole(
  id: string
): Promise<{ success: boolean; error: PostgrestError | Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: new Error("Supabase client not initialized") };

  // First check if it's used in allocations
  const { count, error: countError } = await supabase
    .from("project_resource_allocations")
    .select("*", { count: 'exact', head: true })
    .eq("functional_role", id); // Note: functional_role currently stores the Name, not the ID. Wait!
    // Ah, wait. `FunctionalRoleCombobox` passes `roleData.name` to `setFunctionalRole`. So `functional_role` in `project_resource_allocations` is actually the `name`.
    
  // To correctly check if it's used, we must fetch the role first to get its name.
  const { data: role, error: roleError } = await supabase
    .from("functional_roles")
    .select("name")
    .eq("id", id)
    .single();
    
  if (roleError || !role) {
    return { success: false, error: roleError || new Error("Role not found") };
  }

  const { count: usageCount, error: usageCountError } = await supabase
    .from("project_resource_allocations")
    .select("*", { count: 'exact', head: true })
    .eq("functional_role", role.name);

  if (usageCountError) {
    return { success: false, error: usageCountError };
  }

  // Soft delete regardless of usage, because we want it to stop appearing in new dropdowns,
  // but existing allocations will keep their string names.
  const { error } = await supabase
    .from("functional_roles")
    .update({ is_active: false })
    .eq("id", id);

  return {
    success: !error,
    error,
  };
}
