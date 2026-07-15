import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../utils/supabase/client";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Create the browser client which properly hooks into Next.js cookies
  supabaseClient = createClient();
  return supabaseClient;
}

export const supabase = getSupabaseClient();
