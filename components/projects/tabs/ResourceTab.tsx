"use client";

import React, { useState, useEffect } from "react";
import type { Project, Profile } from "@/types";
import { getResourceAllocations, createResourceAllocation, updateResourceAllocation, ResourceAllocationWithProfile } from "@/services/resourceService";
import { getAllProfiles } from "@/services/profileService";
import { removeMemberFromProject } from "@/services/projectResourceService";
import { FunctionalRoleCombobox } from "@/components/resources/FunctionalRoleCombobox";
import { Plus, Loader2, Users, Check, UserCircle2, Edit2, X, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ResourceTabProps {
  project: Project;
}

export function ResourceTab({ project }: ResourceTabProps) {
  const { profile } = useAuth();
  const [allocations, setAllocations] = useState<ResourceAllocationWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form states
  const [selectedUserId, setSelectedUserId] = useState("");
  const [functionalRole, setFunctionalRole] = useState("");
  const [workloadShare, setWorkloadShare] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editId, setEditId] = useState<string | null>(null);
  const [editFunctionalRole, setEditFunctionalRole] = useState("");
  const [editWorkloadShare, setEditWorkloadShare] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Offboard states
  const [offboardingAlloc, setOffboardingAlloc] = useState<ResourceAllocationWithProfile | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const canManageProjectOps = ['administrator', 'pmo', 'project_manager'].includes(profile?.role || '');

  useEffect(() => {
    fetchData();
  }, [project.id]);

  const fetchData = async () => {
    setLoading(true);
    const [allocRes, profRes] = await Promise.all([
      getResourceAllocations(project.id),
      getAllProfiles()
    ]);
    
    setAllocations(allocRes.data || []);
    setProfiles(profRes.data || []);
    setLoading(false);
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !workloadShare) return;
    
    setIsSubmitting(true);

    const { data, error } = await createResourceAllocation({
      project_id: project.id,
      user_id: selectedUserId,
      functional_role: functionalRole,
      workload_share: workloadShare,
    }, { performerId: profile?.id || "" });

    if (!error && data) {
      const assignedProfile = profiles.find(p => p.id === selectedUserId) || null;
      setAllocations([...allocations, { ...data, profile: assignedProfile }]);
      setShowForm(false);
      setSelectedUserId("");
      setFunctionalRole("");
      setWorkloadShare("");
    } else {
      alert(error?.message || "Failed to assign resource");
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = (alloc: ResourceAllocationWithProfile) => {
    setEditId(alloc.id);
    setEditFunctionalRole(alloc.functional_role || "");
    setEditWorkloadShare(alloc.workload_share || "");
  };

  const handleSaveEdit = async (alloc: ResourceAllocationWithProfile) => {
    setIsSavingEdit(true);
    const updates: Partial<ResourceAllocationWithProfile> = {};
    if (editFunctionalRole !== alloc.functional_role) updates.functional_role = editFunctionalRole;
    if (editWorkloadShare !== alloc.workload_share) updates.workload_share = editWorkloadShare;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await updateResourceAllocation(alloc.id, updates, { performerId: profile?.id || "" });
      if (!error && data) {
        setAllocations(allocations.map(a => a.id === alloc.id ? { ...data, profile: alloc.profile } : a));
      } else {
        alert(error?.message || "Failed to update allocation.");
      }
    }
    setEditId(null);
    setIsSavingEdit(false);
  };

  const handleConfirmOffboard = async () => {
    if (!offboardingAlloc) return;
    setIsRemoving(true);
    const { success, error } = await removeMemberFromProject(
      offboardingAlloc.id, 
      project.id, 
      offboardingAlloc.user_id, 
      { performerId: profile?.id || "" }
    );
    
    if (success) {
      // Optimistic update: either remove completely or update is_active to false
      setAllocations(allocations.map(a => 
        a.id === offboardingAlloc.id ? { ...a, is_active: false } : a
      ));
      setOffboardingAlloc(null);
    } else {
      alert("Failed to offboard: " + (error?.message || "Unknown error"));
    }
    setIsRemoving(false);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Resource Loading Analysis</h3>
          <p className="text-sm text-slate-500">Monitor consultant workload and project assignments</p>
        </div>
        
        {canManageProjectOps && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
          >
            <Plus size={16} /> Assign Resource
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreateAllocation} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-700">New Resource Assignment</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Cancel</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Team Member</label>
              <select required value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className={`w-full rounded-2xl border border-gray-200 p-3 text-sm transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${!selectedUserId ? 'text-gray-600 font-medium' : 'text-gray-900 font-semibold'}`}>
                <option value="">-- Choose Profile --</option>
                {profiles
                  .filter(p => p.status !== 'INACTIVE')
                  .map(p => (
                  <option key={p.id} value={p.id} disabled={allocations.some(a => a.user_id === p.id)}>
                    {p.full_name} ({p.email}) {allocations.some(a => a.user_id === p.id) ? "- Already Assigned" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Functional Role</label>
              <FunctionalRoleCombobox 
                value={functionalRole}
                onChange={(roleId, roleData) => setFunctionalRole(roleData.name)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Workload Share / Deskripsi</label>
              <input type="text" required value={workloadShare} onChange={(e) => setWorkloadShare(e.target.value)} className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" placeholder="e.g. SME Asesmen 30%" />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Assign Profile
            </button>
          </div>
        </form>
      )}

      {allocations.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-slate-600 font-medium">No Resources Assigned</h4>
          <p className="text-slate-400 text-sm mt-1">Assign consultants to analyze workload distribution.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {allocations.filter(a => a.is_active !== false).map(alloc => (
             <div key={alloc.id} className="relative bg-white border border-slate-200 p-5 rounded-[1.5rem] shadow-sm hover:shadow-md transition group">
                {canManageProjectOps && editId !== alloc.id && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleStartEdit(alloc)} className="text-slate-400 hover:text-[var(--color-brand-orange)] transition p-1" title="Edit Allocation">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setOffboardingAlloc(alloc)} className="text-slate-400 hover:text-rose-600 transition p-1" title="Remove / Offboard Member">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                     <UserCircle2 size={24} />
                   </div>
                   <div>
                     <h4 className={`font-bold leading-tight pr-6 ${alloc.profile?.status === 'INACTIVE' ? 'text-slate-500' : 'text-slate-800'}`}>
                       {alloc.profile?.full_name || "Unknown"}
                       {alloc.profile?.status === 'INACTIVE' && <span className="ml-1 text-xs font-semibold text-slate-400">(Inactive)</span>}
                     </h4>
                     <p className="text-xs text-slate-500">{alloc.profile?.email || "No email"}</p>
                   </div>
                </div>
                
                {editId === alloc.id ? (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <div className="z-20 relative">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Functional Role</label>
                      <FunctionalRoleCombobox 
                        value={editFunctionalRole}
                        onChange={(roleId, roleData) => setEditFunctionalRole(roleData.name)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Workload</label>
                      <input type="text" value={editWorkloadShare} onChange={(e) => setEditWorkloadShare(e.target.value)} className="w-full bg-white border border-slate-200 rounded p-2 text-sm outline-none focus:border-[var(--color-brand-orange)]" />
                    </div>
                    <div className="flex items-center gap-2 justify-end pt-2">
                      <button onClick={() => setEditId(null)} className="p-1.5 text-slate-500 hover:text-slate-700 rounded bg-white shadow-sm border border-slate-200"><X size={14}/></button>
                      <button onClick={() => handleSaveEdit(alloc)} disabled={isSavingEdit} className="p-1.5 text-white bg-[var(--color-brand-orange)] hover:bg-orange-600 rounded shadow-sm disabled:opacity-50"><Check size={14}/></button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-amber-800 border border-amber-100">
                        {alloc.functional_role}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Workload Share</p>
                      <p className="text-sm font-medium text-slate-800">{alloc.workload_share}</p>
                    </div>
                  </div>
                )}
             </div>
           ))}
        </div>
      )}

      {/* Remove Member Modal */}
      {offboardingAlloc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 fade-in">
          <div className="bg-[#fcfbfa] w-full max-w-md rounded-[2rem] shadow-xl border border-rose-100 p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Offboard Anggota Proyek?</h3>
            <p className="text-sm font-semibold text-center text-slate-700 mb-4">
              {offboardingAlloc.profile?.full_name} ({offboardingAlloc.functional_role})
            </p>
            
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
              <p className="text-sm text-amber-800 text-center">
                Jika anggota ini sudah pernah mengisi jam kerja, sistem otomatis akan mengarsipkannya (Offboarding) agar riwayat biaya proyek tetap aman. Anggota tidak akan bisa lagi mengakses tugas di proyek ini.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setOffboardingAlloc(null)}
                disabled={isRemoving}
                className="flex-1 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ❌ Batal
              </button>
              <button 
                onClick={handleConfirmOffboard}
                disabled={isRemoving}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {isRemoving ? <Loader2 size={16} className="animate-spin" /> : null}
                🚨 Ya, Keluarkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
