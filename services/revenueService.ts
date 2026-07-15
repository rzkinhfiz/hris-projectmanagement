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
    .select("invoice_status")
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
  const { createAuditLog } = await import("./auditService");
  await createAuditLog({
    entity: "InvoicingTerm",
    entity_id: id,
    action: "UPDATE_TERM",
    performed_by: auditContext.performedBy,
    details: {
      reason: auditContext.reason,
      old_values: JSON.stringify(auditContext.oldValues),
      new_values: JSON.stringify(updates),
    },
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
