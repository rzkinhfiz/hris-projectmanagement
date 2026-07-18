import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";

/**
 * Removes a member from a project with Smart Removal Logic:
 * A) Check if time logs exist for the user on this project.
 * B) If NO logs: Hard Delete the allocation.
 * C) If YES logs: Soft Remove (set is_active = false, end_date = CURRENT_DATE).
 * 
 * @param allocationId The ID of the project_resource_allocations row
 * @param projectId The ID of the project
 * @param userId The ID of the user being removed
 */
export async function removeMemberFromProject(
  allocationId: string,
  projectId: string,
  userId: string,
  auditContext?: { performerId: string }
): Promise<{ success: boolean; error: PostgrestError | Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: new Error("Supabase client not initialized") };

  // Step A: Query time_logs
  const { count: logCount, error: logError } = await supabase
    .from("time_logs")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("profile_id", userId);

  if (logError) {
    return { success: false, error: logError };
  }

  // Fetch allocation data for audit
  const { data: allocData } = await supabase
    .from("project_resource_allocations")
    .select("*")
    .eq("id", allocationId)
    .single();

  let actionType = "DELETE";
  let error: PostgrestError | null = null;

  if (logCount === 0) {
    // Step B: Hard Delete
    const { error: delError } = await supabase
      .from("project_resource_allocations")
      .delete()
      .eq("id", allocationId);
    error = delError;
  } else {
    // Step C: Soft Remove / Offboarding
    actionType = "UPDATE"; // Technically an offboarding update
    const { error: updError } = await supabase
      .from("project_resource_allocations")
      .update({
        is_active: false,
        end_date: new Date().toISOString()
      })
      .eq("id", allocationId);
    error = updError;
  }

  if (!error && allocData && auditContext) {
    const { logProjectActivity } = await import("./auditService");
    await logProjectActivity({
      project_id: projectId,
      actor_id: auditContext.performerId,
      module: "RESOURCE_LOAD",
      action_type: actionType as any,
      item_label: `Offboard ${allocData.functional_role}`,
      old_data: allocData,
      new_data: logCount === 0 ? null : { is_active: false, end_date: new Date().toISOString() }
    });
  }

  return {
    success: !error,
    error,
  };
}
