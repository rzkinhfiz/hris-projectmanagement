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
  item: Omit<ProjectIssueAndAction, "id" | "created_at" | "updated_at">,
  auditContext?: { performerId: string }
): Promise<{ data: ProjectIssueAndAction | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("project_issues_and_actions")
    .insert([item])
    .select("*")
    .single();

  if (!error && data && auditContext) {
    const { logProjectActivity } = await import("./auditService");
    await logProjectActivity({
      project_id: data.project_id,
      actor_id: auditContext.performerId,
      module: "RAID_LOG",
      action_type: "CREATE",
      item_label: data.title,
      new_data: data
    });
  }

  return {
    data: (data as ProjectIssueAndAction | null) ?? null,
    error,
  };
}

export async function updateRaidItem(
  id: string,
  updates: Partial<Omit<ProjectIssueAndAction, "id" | "created_at" | "updated_at">>,
  auditContext?: { performerId: string }
): Promise<{ data: ProjectIssueAndAction | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data: oldData } = await supabase.from("project_issues_and_actions").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("project_issues_and_actions")
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
        module: "RAID_LOG",
        action_type: "UPDATE",
        item_label: data.title,
        old_data: changedOldData,
        new_data: changedNewData
      });
    }
  }

  return {
    data: (data as ProjectIssueAndAction | null) ?? null,
    error,
  };
}
