import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import type { InvoicingTerm } from "../types";

export async function getInvoicingTerms(projectId: string): Promise<{ data: InvoicingTerm[]; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("project_invoicing_terms")
    .select("*")
    .eq("project_id", projectId)
    .order("term_number", { ascending: true });

  return {
    data: (data as InvoicingTerm[] | null) ?? [],
    error,
  };
}

export async function createInvoicingTerm(term: Omit<InvoicingTerm, "id" | "created_at" | "updated_at">): Promise<{ data: InvoicingTerm | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from("project_invoicing_terms")
    .insert([term])
    .select("*")
    .single();

  return {
    data: (data as InvoicingTerm | null) ?? null,
    error,
  };
}

export async function updateInvoicingTerm(
  id: string,
  updates: Partial<InvoicingTerm>,
  auditContext: { performedBy: string; performedByRole?: string; reason: string; oldValues: Partial<InvoicingTerm> }
): Promise<{ data: InvoicingTerm | null; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: null };

  // First, verify status is still unbilled
  const { data: currentTerm, error: fetchError } = await supabase
    .from("project_invoicing_terms")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !currentTerm) {
    return { data: null, error: fetchError };
  }

  if (currentTerm.invoice_status !== "unbilled") {
    if (auditContext.performedByRole === "administrator") {
      auditContext.reason = `[ADMIN_OVERRIDE] ${auditContext.reason}`;
    } else {
      // Cannot update locked term
      return { data: null, error: { message: "Cannot modify locked term", code: "403" } as any };
    }
  }

  // Record audit log
  const { logProjectActivity } = await import("./auditService");
  await logProjectActivity({
    project_id: currentTerm.project_id || id, // actually id is term id, wait. I need project_id.
    actor_id: auditContext.performedBy,
    module: "TERMS_REVENUE",
    action_type: "UPDATE",
    item_label: `Termin ${currentTerm.term_number || 'Update'}`,
    old_data: auditContext.oldValues,
    new_data: updates,
  });

  const { data, error } = await supabase
    .from("project_invoicing_terms")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  return {
    data: (data as InvoicingTerm | null) ?? null,
    error,
  };
}
