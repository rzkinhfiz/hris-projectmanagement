"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Trash2, X, Check, Loader2, AlertTriangle } from "lucide-react";
import type { FunctionalRole } from "@/types";
import { getActiveFunctionalRoles } from "@/services/resourceService";
import { updateFunctionalRole, deactivateFunctionalRole } from "@/services/roleService";
import { useAuth } from "@/hooks/useAuth";

export function FunctionalRoleManager() {
  const [roles, setRoles] = useState<FunctionalRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ department: string; default_hourly_rate: number }>({ department: "", default_hourly_rate: 0 });
  const [isSaving, setIsSaving] = useState(false);

  // Archive State
  const [archivingRole, setArchivingRole] = useState<FunctionalRole | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    const { data } = await getActiveFunctionalRoles();
    setRoles(data || []);
    setLoading(false);
  };

  const handleStartEdit = (role: FunctionalRole) => {
    setEditingId(role.id);
    setEditData({
      department: role.department || "",
      default_hourly_rate: role.default_hourly_rate || 0
    });
  };

  const handleSaveEdit = async (id: string) => {
    setIsSaving(true);
    const { error } = await updateFunctionalRole(id, editData);
    if (error) {
      alert("Gagal memperbarui peran: " + error.message);
    } else {
      setRoles(roles.map(r => r.id === id ? { ...r, department: editData.department, default_hourly_rate: editData.default_hourly_rate } : r));
      setEditingId(null);
    }
    setIsSaving(false);
  };

  const handleConfirmArchive = async () => {
    if (!archivingRole) return;
    setIsArchiving(true);
    const { success, error } = await deactivateFunctionalRole(archivingRole.id);
    
    if (success) {
      setRoles(roles.filter(r => r.id !== archivingRole.id));
      setArchivingRole(null);
    } else {
      alert("Gagal mengarsipkan peran: " + (error?.message || "Unknown error"));
    }
    setIsArchiving(false);
  };

  const canManage = profile?.role === "administrator" || profile?.role === "pmo";

  if (!canManage) {
    return (
      <div className="bg-orange-50 text-amber-800 p-6 rounded-3xl text-center border border-orange-100">
        Anda tidak memiliki akses (PMO/Administrator) untuk mengelola peran.
      </div>
    );
  }

  return (
    <div className="bg-[#fcfbfa] p-8 rounded-3xl border border-stone-200 shadow-sm relative">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-stone-800">Master Functional Roles</h3>
        <p className="text-sm text-stone-500">Kelola daftar peran standar beserta tarif per jam (hourly rate) untuk kalkulasi biaya proyek.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-stone-400" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500">
                <th className="pb-3 px-4 font-bold">Role Name</th>
                <th className="pb-3 px-4 font-bold">Department</th>
                <th className="pb-3 px-4 font-bold">Default Hourly Rate</th>
                <th className="pb-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition">
                  <td className="py-4 px-4 font-semibold text-stone-800">
                    {role.name}
                  </td>
                  
                  <td className="py-4 px-4">
                    {editingId === role.id ? (
                      <input 
                        type="text"
                        value={editData.department}
                        onChange={(e) => setEditData({...editData, department: e.target.value})}
                        className="w-full text-sm border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-amber-400"
                        placeholder="e.g. Engineering"
                      />
                    ) : (
                      <span className="text-sm text-stone-600">{role.department || "-"}</span>
                    )}
                  </td>
                  
                  <td className="py-4 px-4">
                    {editingId === role.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 text-sm">Rp</span>
                        <input 
                          type="number"
                          value={editData.default_hourly_rate}
                          onChange={(e) => setEditData({...editData, default_hourly_rate: Number(e.target.value)})}
                          className="w-full text-sm border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-amber-400"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-stone-600 font-medium">Rp {role.default_hourly_rate.toLocaleString()}</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-right">
                    {editingId === role.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-stone-500 hover:text-stone-700 bg-white rounded shadow-sm border border-stone-200">
                          <X size={14} />
                        </button>
                        <button onClick={() => handleSaveEdit(role.id)} disabled={isSaving} className="p-1.5 text-white bg-amber-600 hover:bg-amber-700 rounded shadow-sm disabled:opacity-50">
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleStartEdit(role)} 
                          className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Edit Role"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setArchivingRole(role)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Archive/Remove Role"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Double Verification Archive Modal */}
      {archivingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="bg-[#fcfbfa] w-full max-w-md rounded-[2rem] shadow-xl border border-stone-200 p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-stone-800 text-center mb-2">Arsipkan Peran Ini?</h3>
            
            <p className="text-sm text-stone-600 text-center mb-6">
              Anda akan mengarsipkan peran <strong>"{archivingRole.name}"</strong>. 
              Peran ini tidak akan bisa dipilih lagi pada proyek baru, namun data alokasi lama akan tetap aman (Soft Delete).
            </p>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
              <button 
                onClick={() => setArchivingRole(null)}
                disabled={isArchiving}
                className="flex-1 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition"
              >
                Batal
              </button>
              <button 
                onClick={handleConfirmArchive}
                disabled={isArchiving}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {isArchiving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Ya, Arsipkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
