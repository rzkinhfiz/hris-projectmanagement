"use client";

import React, { useState, useEffect } from "react";
import type { Project, Profile } from "@/types";
import { getRaidItems, createRaidItem, updateRaidItem, RaidItemWithProfile } from "@/services/raidService";
import { getAllProfiles } from "@/services/profileService";
import { Plus, Loader2, AlertTriangle, Check, ShieldAlert, BookOpen, MessageSquare, CheckCircle2, Edit2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RaidTabProps {
  project: Project;
}

export function RaidTab({ project }: RaidTabProps) {
  const { profile } = useAuth();
  const canManageProjectOps = ['administrator', 'pmo', 'project_manager'].includes(profile?.role || '');
  const [items, setItems] = useState<RaidItemWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form states
  const [type, setType] = useState<"risk" | "issue" | "action_item" | "client_feedback">("risk");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "blocker">("medium");
  const [status, setStatus] = useState<"open" | "in_progress" | "closed">("open");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"risk" | "issue" | "action_item" | "client_feedback">("risk");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOwnerId, setEditOwnerId] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editSeverity, setEditSeverity] = useState<"low" | "medium" | "high" | "blocker">("medium");
  const [editStatus, setEditStatus] = useState<"open" | "in_progress" | "closed">("open");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, [project.id]);

  const fetchData = async () => {
    setLoading(true);
    const [raidRes, profRes] = await Promise.all([
      getRaidItems(project.id),
      getAllProfiles()
    ]);
    
    setItems(raidRes.data || []);
    setProfiles(profRes.data || []);
    setLoading(false);
  };

  const handleCreateRaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !ownerId || !dueDate) return;
    
    setIsSubmitting(true);

    const { data, error } = await createRaidItem({
      project_id: project.id,
      type,
      title,
      description,
      owner_id: ownerId,
      due_date: dueDate,
      severity,
      status,
    }, { performerId: profile?.id || "" });

    if (!error && data) {
      const ownerProfile = profiles.find(p => p.id === ownerId) || null;
      setItems([{ ...data, owner: ownerProfile }, ...items]);
      setShowForm(false);
      setTitle("");
      setDescription("");
      setOwnerId("");
      setDueDate("");
    } else {
      alert(error?.message || "Failed to add item");
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = (item: RaidItemWithProfile) => {
    setEditId(item.id);
    setEditType(item.type as any);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditOwnerId(item.owner_id);
    setEditDueDate(item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : "");
    setEditSeverity(item.severity as any);
    setEditStatus(item.status as any);
  };

  const handleSaveEdit = async (item: RaidItemWithProfile) => {
    setIsSavingEdit(true);
    const updates: Partial<RaidItemWithProfile> = {};
    if (editType !== item.type) updates.type = editType;
    if (editTitle !== item.title) updates.title = editTitle;
    if (editDescription !== item.description) updates.description = editDescription;
    if (editOwnerId !== item.owner_id) updates.owner_id = editOwnerId;
    if (editDueDate !== item.due_date) updates.due_date = editDueDate;
    if (editSeverity !== item.severity) updates.severity = editSeverity;
    if (editStatus !== item.status) updates.status = editStatus;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await updateRaidItem(item.id, updates, { performerId: profile?.id || "" });
      if (!error && data) {
        const ownerProfile = profiles.find(p => p.id === editOwnerId) || null;
        setItems(items.map(a => a.id === item.id ? { ...data, owner: ownerProfile } : a));
      } else {
        alert(error?.message || "Failed to update item.");
      }
    }
    setEditId(null);
    setIsSavingEdit(false);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  const getSeverityStyle = (s: string) => {
    switch (s) {
      case "blocker": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };
  
  const getTypeIcon = (t: string) => {
    switch(t) {
      case "risk": return <ShieldAlert size={16} className="text-rose-500" />;
      case "issue": return <AlertTriangle size={16} className="text-amber-500" />;
      case "action_item": return <CheckCircle2 size={16} className="text-blue-500" />;
      case "client_feedback": return <MessageSquare size={16} className="text-emerald-500" />;
      default: return <BookOpen size={16} />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-800">RAID Log & Client Feedback</h3>
          <p className="text-sm text-slate-500">Track Risks, Assumptions, Issues, and Dependencies</p>
        </div>
        
        {canManageProjectOps && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
          >
            <Plus size={16} /> Add Log Entry
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreateRaid} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-700">New RAID Entry</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Cancel</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className={`w-full rounded-2xl border border-gray-200 p-3 text-sm transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${!type ? 'text-gray-600 font-medium' : 'text-gray-900 font-semibold'}`}>
                <option value="risk">Risk</option>
                <option value="issue">Issue</option>
                <option value="action_item">Action Item</option>
                <option value="client_feedback">Client Feedback</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" placeholder="Short description of the item" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detailed Description</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)] resize-none" rows={3} placeholder="Provide full context, impact, and mitigation plan if applicable..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Owner / PIC</label>
              <select required value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={`w-full rounded-2xl border border-gray-200 p-3 text-sm transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${!ownerId ? 'text-gray-600 font-medium' : 'text-gray-900 font-semibold'}`}>
                <option value="">-- Assign To --</option>
                {profiles
                  .filter(p => p.status !== 'INACTIVE')
                  .map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
              <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-700 font-medium focus:text-gray-900 focus:border-amber-500 transition focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Severity & Status</label>
               <div className="flex gap-2">
                 <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className={`w-1/2 rounded-2xl border border-gray-200 p-3 text-sm transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${!severity ? 'text-gray-600 font-medium' : 'text-gray-900 font-semibold'}`}>
                   <option value="low">Low</option>
                   <option value="medium">Medium</option>
                   <option value="high">High</option>
                   <option value="blocker">Blocker</option>
                 </select>
                 <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={`w-1/2 rounded-2xl border border-gray-200 p-3 text-sm transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${!status ? 'text-gray-600 font-medium' : 'text-gray-900 font-semibold'}`}>
                   <option value="open">Open</option>
                   <option value="in_progress">In Progress</option>
                   <option value="closed">Closed</option>
                 </select>
               </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save Entry
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
          <AlertTriangle size={48} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-slate-600 font-medium">Log is Empty</h4>
          <p className="text-slate-400 text-sm mt-1">Record risks, issues, action items, or feedback here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map(item => (
            <div key={item.id} className="relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition group">
               {canManageProjectOps && editId !== item.id && (
                 <button onClick={() => handleStartEdit(item)} className="absolute top-4 right-4 text-slate-400 hover:text-[var(--color-brand-orange)] opacity-0 group-hover:opacity-100 transition">
                   <Edit2 size={16} />
                 </button>
               )}

               {editId === item.id ? (
                 <div className="space-y-4">
                   <div className="flex flex-col gap-2">
                     <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-[var(--color-brand-orange)]" />
                     <div className="flex gap-2">
                       <select value={editType} onChange={(e) => setEditType(e.target.value as any)} className="w-1/2 rounded border border-gray-200 p-1 text-sm focus:border-amber-500 outline-none">
                         <option value="risk">Risk</option>
                         <option value="issue">Issue</option>
                         <option value="action_item">Action Item</option>
                         <option value="client_feedback">Client Feedback</option>
                       </select>
                       <select value={editOwnerId} onChange={(e) => setEditOwnerId(e.target.value)} className="w-1/2 rounded border border-gray-200 p-1 text-sm focus:border-amber-500 outline-none">
                         {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                       </select>
                     </div>
                   </div>
                   
                   <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full text-sm bg-slate-50 p-3 rounded-xl border border-slate-200 resize-none outline-none focus:border-[var(--color-brand-orange)]" rows={3} />
                   
                   <div className="flex gap-2">
                     <select value={editSeverity} onChange={(e) => setEditSeverity(e.target.value as any)} className="flex-1 rounded border border-gray-200 p-1 text-sm focus:border-amber-500 outline-none">
                       <option value="low">Low</option>
                       <option value="medium">Medium</option>
                       <option value="high">High</option>
                       <option value="blocker">Blocker</option>
                     </select>
                     <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="flex-1 rounded border border-gray-200 p-1 text-sm focus:border-amber-500 outline-none">
                       <option value="open">Open</option>
                       <option value="in_progress">In Progress</option>
                       <option value="closed">Closed</option>
                     </select>
                     <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="flex-1 rounded border border-gray-200 p-1 text-sm focus:border-amber-500 outline-none" />
                   </div>
                   
                   <div className="flex items-center gap-2 justify-end pt-2 border-t">
                     <button onClick={() => setEditId(null)} className="p-1.5 text-slate-500 hover:text-slate-700 rounded bg-white shadow-sm border border-slate-200"><X size={14}/></button>
                     <button onClick={() => handleSaveEdit(item)} disabled={isSavingEdit} className="p-1.5 text-white bg-[var(--color-brand-orange)] hover:bg-orange-600 rounded shadow-sm disabled:opacity-50"><Check size={14}/></button>
                   </div>
                 </div>
               ) : (
                 <>
                   <div className="flex justify-between items-start mb-3 pr-6">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                          {getTypeIcon(item.type)}
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-800 text-lg leading-tight">{item.title}</h4>
                         <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                            {item.type.replace('_', ' ')}
                         </p>
                       </div>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                       <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${getSeverityStyle(item.severity)}`}>
                         {item.severity}
                       </span>
                       <span className={`text-xs font-bold uppercase tracking-wider ${item.status === 'closed' ? 'text-emerald-500' : 'text-slate-500'}`}>
                         Status: {item.status.replace('_', ' ')}
                       </span>
                     </div>
                   </div>
                   
                   <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl mb-4 leading-relaxed border border-slate-100">
                     {item.description}
                   </p>
                   
                   <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
                     <div className="flex items-center gap-2 text-slate-500">
                       <span className="font-semibold text-slate-700">PIC:</span>
                       <span className={item.owner?.status === 'INACTIVE' ? 'text-slate-500' : 'text-slate-800'}>
                         {item.owner?.full_name || "Unassigned"}
                         {item.owner?.status === 'INACTIVE' && <span className="ml-1 text-xs font-semibold text-slate-400">(Inactive)</span>}
                       </span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-500">
                       <span className="font-semibold text-slate-700">Due:</span>
                       {item.due_date ? new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'}) : "-"}
                     </div>
                   </div>
                 </>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
