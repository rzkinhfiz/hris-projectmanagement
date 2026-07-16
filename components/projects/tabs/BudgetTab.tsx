"use client";

import React, { useState, useEffect } from "react";
import type { Project, ProjectBudget } from "@/types";
import { getProjectBudgets, createProjectBudget, updateProjectBudget } from "@/services/budgetService";
import { Plus, Loader2, CheckCircle2, Clock, Check, FileCheck2, Tag, ShoppingCart, Edit2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BudgetTabProps {
  project: Project;
}

export function BudgetTab({ project }: BudgetTabProps) {
  const { profile } = useAuth();
  const [budgets, setBudgets] = useState<ProjectBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form states
  const [category, setCategory] = useState<ProjectBudget['category']>("Personnel");
  const [itemName, setItemName] = useState("");
  const [plannedAmount, setPlannedAmount] = useState("");
  const [actualAmount, setActualAmount] = useState("0");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [status, setStatus] = useState<ProjectBudget['status']>("Planned");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editId, setEditId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<ProjectBudget['category']>("Personnel");
  const [editItemName, setEditItemName] = useState("");
  const [editPlannedAmount, setEditPlannedAmount] = useState("");
  const [editActualAmount, setEditActualAmount] = useState("");
  const [editPurchaseDate, setEditPurchaseDate] = useState("");
  const [editStatus, setEditStatus] = useState<ProjectBudget['status']>("Planned");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const canManageProjectOps = ['administrator', 'pmo', 'project_manager'].includes(profile?.role || '');

  useEffect(() => {
    fetchBudgets();
  }, [project.id]);

  const fetchBudgets = async () => {
    setLoading(true);
    const { data } = await getProjectBudgets(project.id);
    setBudgets(data || []);
    setLoading(false);
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !plannedAmount) return;
    
    setIsSubmitting(true);

    const { data, error } = await createProjectBudget({
      project_id: project.id,
      category,
      item_name: itemName,
      planned_amount: parseFloat(plannedAmount),
      actual_amount: parseFloat(actualAmount) || 0,
      purchase_date: purchaseDate || null,
      status,
    }, { performerId: profile?.id || "" });

    if (!error && data) {
      setBudgets([data, ...budgets]);
      setShowForm(false);
      setItemName("");
      setPlannedAmount("");
      setActualAmount("0");
      setPurchaseDate("");
      setStatus("Planned");
    } else {
      alert(error?.message || "Failed to add budget item");
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = (item: ProjectBudget) => {
    setEditId(item.id);
    setEditCategory(item.category);
    setEditItemName(item.item_name);
    setEditPlannedAmount((item.planned_amount || 0).toString());
    setEditActualAmount((item.actual_amount || 0).toString());
    setEditPurchaseDate(item.purchase_date ? new Date(item.purchase_date).toISOString().split('T')[0] : "");
    setEditStatus(item.status);
  };

  const handleSaveEdit = async (item: ProjectBudget) => {
    setIsSavingEdit(true);
    const updates: Partial<ProjectBudget> = {};
    if (editCategory !== item.category) updates.category = editCategory;
    if (editItemName !== item.item_name) updates.item_name = editItemName;
    if (parseFloat(editPlannedAmount) !== item.planned_amount) updates.planned_amount = parseFloat(editPlannedAmount);
    if (parseFloat(editActualAmount) !== item.actual_amount) updates.actual_amount = parseFloat(editActualAmount);
    if (editPurchaseDate !== item.purchase_date) updates.purchase_date = editPurchaseDate || null;
    if (editStatus !== item.status) updates.status = editStatus;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await updateProjectBudget(item.id, updates, { performerId: profile?.id || "" });
      if (!error && data) {
        setBudgets(budgets.map(b => b.id === item.id ? data : b));
      } else {
        alert(error?.message || "Failed to update item.");
      }
    }
    setEditId(null);
    setIsSavingEdit(false);
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "Disbursed": return "bg-emerald-100 text-emerald-700";
      case "Approved": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  const totalPlanned = budgets.reduce((sum, b) => sum + (b.planned_amount || 0), 0);
  const totalActual = budgets.reduce((sum, b) => sum + (b.actual_amount || 0), 0);
  const remainingBudget = totalPlanned - totalActual;

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Budgeting & Expenses</h3>
          <p className="text-sm text-slate-500">Track and manage project disbursements</p>
        </div>
        
        {canManageProjectOps && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
          >
            <Plus size={16} /> Add Item
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Planned</p>
          <h4 className="text-xl font-bold text-slate-800">Rp {totalPlanned.toLocaleString()}</h4>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Actual</p>
          <h4 className="text-xl font-bold text-slate-800">Rp {totalActual.toLocaleString()}</h4>
        </div>
        <div className={`border rounded-2xl p-4 ${remainingBudget < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${remainingBudget < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
             Variance (Remaining)
          </p>
          <h4 className={`text-xl font-bold ${remainingBudget < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            Rp {remainingBudget.toLocaleString()}
          </h4>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreateBudget} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-700">New Budget Item</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Cancel</button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as any)} className={`w-full rounded-2xl border border-gray-200 p-3 text-sm transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${!category ? 'text-gray-600 font-medium' : 'text-gray-900 font-semibold'}`}>
                <option value="Personnel">Personnel</option>
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
                <option value="Operational">Operational</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
              <input type="text" required value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" placeholder="e.g. Server License AWS" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Planned Amount (Rp)</label>
              <input type="number" required value={plannedAmount} onChange={(e) => setPlannedAmount(e.target.value)} className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual Amount (Rp)</label>
              <input type="number" value={actualAmount} onChange={(e) => setActualAmount(e.target.value)} className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Date (Optional)</label>
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-700 font-medium focus:text-gray-900 focus:border-amber-500 transition focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={`w-full rounded-2xl border border-gray-200 p-3 text-sm transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${!status ? 'text-gray-600 font-medium' : 'text-gray-900 font-semibold'}`}>
                <option value="Planned">Planned</option>
                <option value="Approved">Approved</option>
                <option value="Disbursed">Disbursed</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save Item
            </button>
          </div>
        </form>
      )}

      {budgets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
          <ShoppingCart size={48} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-slate-600 font-medium">No Budget Items</h4>
          <p className="text-slate-400 text-sm mt-1">Start adding planned and actual expenses.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item Name</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Planned (Rp)</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actual (Rp)</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                {canManageProjectOps && <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budgets.map((item) => {
                if (editId === item.id) {
                  return (
                    <tr key={item.id} className="bg-slate-50 border-y-2 border-[var(--color-brand-orange)] shadow-inner">
                      <td className="py-4 px-4">
                        <input type="text" value={editItemName} onChange={(e) => setEditItemName(e.target.value)} className="w-full bg-white border border-slate-200 rounded text-sm px-2 py-1 outline-none focus:border-[var(--color-brand-orange)]" />
                      </td>
                      <td className="py-4 px-4">
                        <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as any)} className="w-full rounded border border-gray-200 p-1 text-sm text-gray-900 focus:border-amber-500 outline-none">
                          <option value="Personnel">Personnel</option>
                          <option value="Software">Software</option>
                          <option value="Hardware">Hardware</option>
                          <option value="Operational">Operational</option>
                          <option value="Vendor">Vendor</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <input type="number" value={editPlannedAmount} onChange={(e) => setEditPlannedAmount(e.target.value)} className="w-24 bg-white border border-slate-200 rounded text-sm px-2 py-1 outline-none text-right focus:border-[var(--color-brand-orange)]" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <input type="number" value={editActualAmount} onChange={(e) => setEditActualAmount(e.target.value)} className="w-24 bg-white border border-slate-200 rounded text-sm px-2 py-1 outline-none text-right focus:border-[var(--color-brand-orange)]" />
                      </td>
                      <td className="py-4 px-4">
                        <input type="date" value={editPurchaseDate} onChange={(e) => setEditPurchaseDate(e.target.value)} className="w-full rounded border border-gray-200 p-1 text-sm text-gray-700 focus:border-amber-500 outline-none" />
                      </td>
                      <td className="py-4 px-4">
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="w-full rounded border border-gray-200 p-1 text-sm text-gray-900 focus:border-amber-500 outline-none">
                          <option value="Planned">Planned</option>
                          <option value="Approved">Approved</option>
                          <option value="Disbursed">Disbursed</option>
                        </select>
                      </td>
                      <td className="py-4 px-4" colSpan={1}>
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setEditId(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-white shadow-sm border border-slate-200"><X size={14}/></button>
                          <button onClick={() => handleSaveEdit(item)} disabled={isSavingEdit} className="p-1 text-white bg-[var(--color-brand-orange)] hover:bg-orange-600 rounded shadow-sm disabled:opacity-50"><Check size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-4 text-sm font-semibold text-slate-800">{item.item_name}</td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                       <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">
                         <Tag size={10} /> {item.category}
                       </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-700 text-right">{(item.planned_amount || 0).toLocaleString()}</td>
                    <td className="py-4 px-4 text-sm font-bold text-slate-800 text-right">
                      {(item.actual_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500">
                      {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', day: 'numeric' }) : "-"}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                        {item.status === 'Disbursed' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                        {item.status}
                      </span>
                    </td>
                    {canManageProjectOps && (
                      <td className="py-4 px-4 text-right">
                        <button onClick={() => handleStartEdit(item)} className="text-slate-400 hover:text-[var(--color-brand-orange)] transition">
                          <Edit2 size={14} />
                        </button>
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
