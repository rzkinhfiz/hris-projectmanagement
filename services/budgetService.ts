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
  budget: Omit<ProjectBudget, "id" | "created_at" | "updated_at">
): Promise<{ data: ProjectBudget | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("project_budgets")
    .insert([budget])
    .select("*")
    .single();

  return {
    data: (data as ProjectBudget | null) ?? null,
    error,
  };
}
