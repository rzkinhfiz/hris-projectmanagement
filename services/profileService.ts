import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { Profile } from "../types";

export async function getProjectManagers(): Promise<{ data: Profile[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "project_manager")
    .order("full_name", { ascending: true });

  return {
    data: (data as Profile[] | null) ?? [],
    error,
  };
}
