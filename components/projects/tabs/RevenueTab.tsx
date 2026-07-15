"use client";

import React, { useState, useEffect } from "react";
import type { Project, InvoicingTerm } from "@/types";
import { getInvoicingTerms, createInvoicingTerm, updateInvoicingTerm } from "@/services/revenueService";
import { Plus, Loader2, CheckCircle2, Clock, Check, FileCheck2, Edit2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RevenueTabProps {
  project: Project;
}

export function RevenueTab({ project }: RevenueTabProps) {
  const { profile } = useAuth();
  const [terms, setTerms] = useState<InvoicingTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form states
  const [termNumber, setTermNumber] = useState(1);
  const [billingCondition, setBillingCondition] = useState("");
  const [termPercentage, setTermPercentage] = useState("");
  const [targetMonth, setTargetMonth] = useState("");
  const [picFinance, setPicFinance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editTermId, setEditTermId] = useState<string | null>(null);
  const [editCondition, setEditCondition] = useState("");
  const [editPercentage, setEditPercentage] = useState("");
  const [editTargetMonth, setEditTargetMonth] = useState("");
  const [editReason, setEditReason] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const isPMO = profile?.role === "pmo" || profile?.role === "administrator" || profile?.role === "project_manager";
  const isOnlyPM = profile?.role === "project_manager";
  const isStrictPMO = profile?.role === "pmo" || profile?.role === "administrator";

  useEffect(() => {
    fetchTerms();
  }, [project.id]);

  const fetchTerms = async () => {
    setLoading(true);
    const { data } = await getInvoicingTerms(project.id);
    setTerms(data || []);
    // Auto increment term number for new entry
    if (data && data.length > 0) {
      setTermNumber(Math.max(...data.map(t => t.term_number)) + 1);
    }
    setLoading(false);
  };

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingCondition || !termPercentage || !targetMonth) return;
    
    setIsSubmitting(true);
    const percentage = parseFloat(termPercentage) / 100;
    const contractValue = project.contract_value_excl_tax || 0;
    const targetAmount = contractValue * percentage;

    const { data, error } = await createInvoicingTerm({
      project_id: project.id,
      term_number: termNumber,
      billing_condition: billingCondition,
      term_percentage: percentage,
      target_invoice_amount: targetAmount,
      target_month: targetMonth,
      invoice_status: "unbilled",
      bast_date: null,
      pic_finance: picFinance || null,
    });

    if (!error && data) {
      setTerms([...terms, data]);
      setShowForm(false);
      setTermNumber(termNumber + 1);
      setBillingCondition("");
      setTermPercentage("");
      setTargetMonth("");
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = (term: InvoicingTerm) => {
    setEditTermId(term.id);
    setEditCondition(term.billing_condition || "");
    setEditPercentage(term.term_percentage ? (term.term_percentage * 100).toString() : "");
    setEditTargetMonth(term.target_month ? new Date(term.target_month).toISOString().split('T')[0] : "");
    setEditReason("");
  };

  const handleSaveEdit = async (term: InvoicingTerm) => {
    if (!editReason) {
      alert("Please provide a reason for the change for audit purposes.");
      return;
    }
    setIsSavingEdit(true);
    const updates: Partial<InvoicingTerm> = {};
    if (editCondition !== term.billing_condition) updates.billing_condition = editCondition;
    if (editTargetMonth !== term.target_month) updates.target_month = editTargetMonth;
    
    // Only PMO can edit percentage
    if (isStrictPMO && parseFloat(editPercentage) / 100 !== term.term_percentage) {
      const p = parseFloat(editPercentage) / 100;
      updates.term_percentage = p;
      updates.target_invoice_amount = (project.contract_value_excl_tax || 0) * p;
    }

    if (Object.keys(updates).length > 0) {
      const { data, error } = await updateInvoicingTerm(term.id, updates, {
        performedBy: profile?.id || "unknown",
        performedByRole: profile?.role || "user",
        reason: editReason,
        oldValues: term,
      });
      if (!error && data) {
        setTerms(terms.map((t) => (t.id === term.id ? data : t)));
      } else {
        alert(error?.message || "Failed to update term.");
      }
    }
    setEditTermId(null);
    setIsSavingEdit(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-700";
      case "invoiced": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  const totalPercentage = terms.reduce((sum, t) => sum + (t.term_percentage || 0), 0) * 100;
  const remainingPercentage = Math.max(0, 100 - totalPercentage);

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Invoicing Terms & Revenue</h3>
          <p className="text-sm text-slate-500">Contract Value: Rp {(project.contract_value_excl_tax || 0).toLocaleString()}</p>
        </div>
        
        {isPMO && !showForm && remainingPercentage > 0 && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
          >
            <Plus size={16} /> Add Term
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreateTerm} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-700">New Invoicing Term (Term {termNumber})</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Cancel</button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing Condition / Milestone</label>
              <input type="text" required value={billingCondition} onChange={(e) => setBillingCondition(e.target.value)} className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" placeholder="e.g. Kick Off & Requirements Gathering" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Percentage (%)</label>
              <div className="relative">
                <input type="number" min="1" max={remainingPercentage} required value={termPercentage} onChange={(e) => setTermPercentage(e.target.value)} className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" placeholder={`Max ${remainingPercentage}%`} />
                <span className="absolute right-4 top-2 text-slate-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Month</label>
              <input type="date" required value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PIC Finance (Optional)</label>
              <input type="text" value={picFinance} onChange={(e) => setPicFinance(e.target.value)} className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" placeholder="Name of finance PIC" />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save Term
            </button>
          </div>
        </form>
      )}

      {terms.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
          <FileCheck2 size={48} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-slate-600 font-medium">No Invoicing Terms</h4>
          <p className="text-slate-400 text-sm mt-1">Add terms to track revenue milestones.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Term</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Condition</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">%</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount (Rp)</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Target</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                {isPMO && <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terms.map((term) => {
                if (editTermId === term.id) {
                  return (
                    <tr key={term.id} className="bg-slate-50 border-y-2 border-[var(--color-brand-orange)] shadow-inner">
                      <td className="py-4 px-4 text-sm font-semibold text-slate-800">Term {term.term_number}</td>
                      <td className="py-4 px-4">
                        <input type="text" value={editCondition} onChange={(e) => setEditCondition(e.target.value)} className="w-full bg-white border border-slate-200 rounded text-sm px-2 py-1 outline-none focus:border-[var(--color-brand-orange)]" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        {isStrictPMO ? (
                          <input type="number" value={editPercentage} onChange={(e) => setEditPercentage(e.target.value)} className="w-16 bg-white border border-slate-200 rounded text-sm px-2 py-1 outline-none text-right focus:border-[var(--color-brand-orange)]" />
                        ) : (
                          <span className="text-sm font-medium text-slate-700">{(term.term_percentage * 100).toFixed(0)}%</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-[var(--color-brand-orange)] text-right">
                         {(term.target_invoice_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <input type="date" value={editTargetMonth} onChange={(e) => setEditTargetMonth(e.target.value)} className="w-full bg-white border border-slate-200 rounded text-sm px-2 py-1 outline-none focus:border-[var(--color-brand-orange)]" />
                      </td>
                      <td className="py-4 px-4" colSpan={2}>
                        <div className="flex flex-col gap-2">
                           <input type="text" placeholder="Reason for update (Audit Trail)" required value={editReason} onChange={(e) => setEditReason(e.target.value)} className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-amber-300 rounded text-xs px-2 py-1 outline-none focus:border-amber-400" />
                           <div className="flex items-center gap-2 justify-end">
                             <button onClick={() => setEditTermId(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-white shadow-sm border border-slate-200"><X size={14}/></button>
                             <button onClick={() => handleSaveEdit(term)} disabled={isSavingEdit || !editReason} className="p-1 text-white bg-[var(--color-brand-orange)] hover:bg-orange-600 rounded shadow-sm disabled:opacity-50"><Check size={14}/></button>
                           </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={term.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-4 text-sm font-semibold text-slate-800">Term {term.term_number}</td>
                    <td className="py-4 px-4 text-sm text-slate-600">{term.billing_condition}</td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-700 text-right">{(term.term_percentage * 100).toFixed(0)}%</td>
                    <td className="py-4 px-4 text-sm font-bold text-[var(--color-brand-orange)] text-right">
                      {(term.target_invoice_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500">
                      {term.target_month ? new Date(term.target_month).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : "-"}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${getStatusStyle(term.invoice_status)}`}>
                        {term.invoice_status === 'paid' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                        {term.invoice_status}
                      </span>
                    </td>
                    {isPMO && (
                      <td className="py-4 px-4 text-right">
                        {term.invoice_status === "unbilled" ? (
                          <button onClick={() => handleStartEdit(term)} className="text-slate-400 hover:text-[var(--color-brand-orange)] transition">
                            <Edit2 size={14} />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">Locked</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
