import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { Profile } from "../types";
import { createAuditLog } from "./auditService";

export async function updateUserProfile(
  userId: string,
  userEmail: string,
  data: Partial<Profile>
): Promise<{ data: Profile | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      data: null,
      error: { message: "Supabase client is unavailable.", code: "500", details: "", hint: "", name: "ServiceError" } as any,
    };
  }

  // Strict validation: Pick ONLY full_name, avatar_url, and phone_number.
  // Explicitly ignore role, email, etc.
  const safeData: Partial<Profile> = {};
  if ('full_name' in data) safeData.full_name = data.full_name;
  if ('avatar_url' in data) safeData.avatar_url = data.avatar_url;
  if ('phone_number' in data) safeData.phone_number = data.phone_number;

  // Update profile
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(safeData)
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  // Audit Trail
  await createAuditLog({
    entity: "User Profile",
    entity_id: userId,
    action: "UPDATE_PROFILE",
    performed_by: userId,
    details: {
      description: `User ${userEmail} memperbarui informasi profil mereka.`,
      updated_fields: Object.keys(safeData).join(', ')
    }
  });

  return { data: updatedProfile as Profile, error: null };
}
