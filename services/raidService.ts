import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { ProjectIssueAndAction, Profile } from "../types";

export interface RaidItemWithProfile extends ProjectIssueAndAction {
  owner: Profile | null;
}

export async function getRaidItems(projectId: string): Promise<{ data: RaidItemWithProfile[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("project_issues_and_actions")
    .select("*, owner:profiles(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const items = (data as any[])?.map((item) => ({
    ...item,
    owner: item.owner ? (Array.isArray(item.owner) ? item.owner[0] : item.owner) : null,
  })) ?? [];

  return { data: items, error };
}

export async function createRaidItem(
  item: Omit<ProjectIssueAndAction, "id" | "created_at" | "updated_at">
): Promise<{ data: ProjectIssueAndAction | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("project_issues_and_actions")
    .insert([item])
    .select("*")
    .single();

  return {
    data: (data as ProjectIssueAndAction | null) ?? null,
    error,
  };
}
