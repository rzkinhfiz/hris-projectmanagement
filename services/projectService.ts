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
