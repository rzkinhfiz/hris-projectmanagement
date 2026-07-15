"use client";

import React, { useState, useEffect } from "react";
import type { Project, Profile } from "@/types";
import { getRaidItems, createRaidItem, RaidItemWithProfile } from "@/services/raidService";
import { getAllProfiles } from "@/services/profileService";
import { Plus, Loader2, AlertTriangle, Check, ShieldAlert, BookOpen, MessageSquare, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RaidTabProps {
  project: Project;
}

export function RaidTab({ project }: RaidTabProps) {
  const { profile } = useAuth();
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
    });

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
        
        {!showForm && (
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
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]">
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
              <select required value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]">
                <option value="">-- Assign To --</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
              <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Severity & Status</label>
               <div className="flex gap-2">
                 <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className="w-1/2 bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]">
                   <option value="low">Low</option>
                   <option value="medium">Medium</option>
                   <option value="high">High</option>
                   <option value="blocker">Blocker</option>
                 </select>
                 <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-1/2 bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]">
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
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
               <div className="flex justify-between items-start mb-3">
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
                   {item.owner?.full_name || "Unassigned"}
                 </div>
                 <div className="flex items-center gap-2 text-slate-500">
                   <span className="font-semibold text-slate-700">Due:</span>
                   {new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
