"use client";

import React, { useState } from "react";
import { AlertTriangle, Clock, ArrowRight, Loader2 } from "lucide-react";
import { TimeLog } from "@/types";

interface AcceptRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  timeLog: TimeLog;
}

export default function AcceptRevisionModal({ isOpen, onClose, onConfirm, timeLog }: AcceptRevisionModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !timeLog) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#fcfbfa] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Verifikasi Perubahan Jam Kerja</h3>
            <p className="text-sm font-semibold text-slate-500">Konfirmasi kesepakatan jam kerja (Counter-Offer)</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Detail */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project</div>
              <div className="text-sm font-bold text-slate-700">{timeLog.project?.name || "Unknown Project"}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Task</div>
              <div className="text-sm font-bold text-slate-700 truncate">{timeLog.task?.name || "Unknown Task"}</div>
            </div>
          </div>

          {/* Visual Diff Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Jam Awal (Ditolak)</span>
              <div className="text-xl font-black text-slate-400 line-through decoration-rose-400 decoration-2">{timeLog.hours}h</div>
            </div>
            
            <div className="text-slate-300 flex flex-col items-center">
              <ArrowRight size={24} className="text-amber-400" />
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Usulan Baru (PM)</span>
              <div className="text-3xl font-black text-emerald-600">{timeLog.proposed_hours}h</div>
            </div>
          </div>

          {/* Notes */}
          {timeLog.negotiation_notes && (
            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="text-lg">💬</span> Catatan dari PM:
              </div>
              <p className="text-sm font-medium text-amber-900/80 italic leading-relaxed">
                "{timeLog.negotiation_notes}"
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
            <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-rose-800/80 leading-relaxed">
              Dengan menyetujui, jam kerja ini akan otomatis berstatus <span className="text-emerald-600 bg-emerald-100 px-1 py-0.5 rounded">APPROVED</span> dan perhitungan progres tugas akan diperbarui secara permanen ke dalam sistem.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--color-brand-orange)] hover:bg-orange-600 transition shadow-md shadow-orange-200 disabled:opacity-70"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "✅ Setujui & Kunci Jam Kerja"}
          </button>
        </div>

      </div>
    </div>
  );
}
