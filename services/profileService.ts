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
    .in("role", ["project_manager", "pmo"])
    .order("full_name", { ascending: true });

  return {
    data: (data as Profile[] | null) ?? [],
    error,
  };
}

export async function getAllProfiles(): Promise<{ data: Profile[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  return {
    data: (data as Profile[] | null) ?? [],
    error,
  };
}
