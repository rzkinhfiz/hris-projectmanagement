import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { ProjectBudget } from "../types";

export async function getProjectBudgets(projectId: string): Promise<{ data: ProjectBudget[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("project_budgets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return {
    data: (data as ProjectBudget[] | null) ?? [],
    error,
  };
}

export async function createProjectBudget(
  budget: Omit<ProjectBudget, "id" | "created_at" | "updated_at">,
  auditContext?: { performerId: string }
): Promise<{ data: ProjectBudget | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("project_budgets")
    .insert([budget])
    .select("*")
    .single();

  if (!error && data && auditContext) {
    const { logProjectActivity } = await import("./auditService");
    await logProjectActivity({
      project_id: data.project_id,
      actor_id: auditContext.performerId,
      module: "BUDGET",
      action_type: "CREATE",
      item_label: data.item_name,
      new_data: data
    });
  }

  return {
    data: (data as ProjectBudget | null) ?? null,
    error,
  };
}

export async function updateProjectBudget(
  id: string,
  updates: Partial<Omit<ProjectBudget, "id" | "created_at" | "updated_at">>,
  auditContext?: { performerId: string }
): Promise<{ data: ProjectBudget | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data: oldData } = await supabase.from("project_budgets").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("project_budgets")
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
        module: "BUDGET",
        action_type: "UPDATE",
        item_label: data.item_name,
        old_data: changedOldData,
        new_data: changedNewData
      });
    }
  }

  return {
    data: (data as ProjectBudget | null) ?? null,
    error,
  };
}
