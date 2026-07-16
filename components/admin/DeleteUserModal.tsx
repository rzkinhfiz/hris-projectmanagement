"use client";

import React, { useEffect, useState } from "react";
import { X, AlertTriangle, UserMinus, ArrowRightLeft } from "lucide-react";
import type { Profile } from "@/types";
import { 
  adminDeleteUser, 
  checkUserActiveAssignments, 
  adminTransferAndDeactivateUser 
} from "@/services/adminService";

interface DeleteUserModalProps {
  user: Profile;
  allProfiles: Profile[];
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteUserModal({ user, allProfiles, onClose, onSuccess }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [activeProjects, setActiveProjects] = useState<{ id: string; name: string }[]>([]);
  const [activeTasks, setActiveTasks] = useState<{ id: string; name: string }[]>([]);
  const [transferTargetId, setTransferTargetId] = useState<string>("");

  useEffect(() => {
    async function checkAssignments() {
      const res = await checkUserActiveAssignments(user.id);
      if (res.success) {
        setActiveProjects(res.activeProjects || []);
        setActiveTasks(res.activeTasks || []);
      } else {
        setErrorMsg(res.error || "Failed to check user assignments.");
      }
      setLoading(false);
    }
    checkAssignments();
  }, [user.id]);

  const needsTransfer = activeProjects.length > 0 || activeTasks.length > 0;
  
  // Potential targets: active users with similar roles (excluding the user themselves)
  const transferTargets = allProfiles.filter(p => 
    p.id !== user.id && 
    p.status !== 'INACTIVE'
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      if (needsTransfer) {
        if (!transferTargetId) {
          setErrorMsg("Please select a user to transfer responsibilities to.");
          setSubmitting(false);
          return;
        }
        const res = await adminTransferAndDeactivateUser(user.id, transferTargetId);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await adminDeleteUser(user.id);
        if (!res.success) throw new Error(res.error);
      }
      onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || "An error occurred.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#fcfbfa] w-full max-w-lg rounded-[2rem] shadow-xl border border-slate-100 flex flex-col my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/50 rounded-t-[2rem]">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Deactivate User</h2>
            <p className="text-sm text-slate-500 mt-1">Review user offboarding requirements.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-200">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-orange)]"></div>
            </div>
          ) : (
            <>
              {needsTransfer ? (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4">
                    <div className="mt-0.5 text-amber-500">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-800 text-base mb-1">Transfer Responsibilities Required</h4>
                      <p className="text-sm text-amber-700">
                        User ini masih memegang <strong>{activeProjects.length} Proyek</strong> dan <strong>{activeTasks.length} Tugas Aktif</strong>. Anda harus mengalihkan tanggung jawab tersebut sebelum menonaktifkan akun.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Transfer semua tanggung jawab ke:
                    </label>
                    <select 
                      value={transferTargetId}
                      onChange={e => setTransferTargetId(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition shadow-sm"
                    >
                      <option value="">-- Pilih User Pengganti --</option>
                      {transferTargets.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.full_name} ({t.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <UserMinus size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">No active assignments found.</h4>
                  <p className="text-sm text-slate-500 mt-2">
                    Are you sure you want to deactivate <strong>{user.full_name}</strong>? They will no longer be able to log in.
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-8">
                <button 
                  type="button" 
                  onClick={onClose}
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={submitting || (needsTransfer && !transferTargetId)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2 text-white ${
                    needsTransfer ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600'
                  } disabled:opacity-50`}
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : needsTransfer ? (
                    <ArrowRightLeft size={16} />
                  ) : (
                    <UserMinus size={16} />
                  )}
                  {needsTransfer ? "Transfer & Deactivate" : "Deactivate User"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
