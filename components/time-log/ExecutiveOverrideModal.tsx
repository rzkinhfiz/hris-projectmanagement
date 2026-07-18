import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface ExecutiveOverrideModalProps {
  isOpen: boolean;
  projectName: string;
  pmName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ExecutiveOverrideModal({
  isOpen,
  projectName,
  pmName,
  onConfirm,
  onCancel,
  isSubmitting = false
}: ExecutiveOverrideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 fade-in">
      <div className="bg-[#fcfbfa] w-full max-w-md rounded-[2rem] shadow-xl border border-amber-200 p-6 animate-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4 mx-auto">
          <ShieldAlert size={24} />
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
          Konfirmasi Persetujuan Eksekutif
        </h3>
        <p className="text-xs font-bold text-center text-amber-600 uppercase tracking-wider mb-4">
          PMO Override
        </p>
        
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
          <p className="text-sm text-amber-800 text-center leading-relaxed font-medium">
            Anda bukan Project Manager resmi untuk proyek <span className="font-bold text-amber-900">{projectName}</span> 
            <br />
            (PM Resmi: <span className="font-bold text-amber-900">{pmName}</span>). 
            <br /><br />
            Apakah Anda yakin ingin mengambil alih wewenang persetujuan ini demi kelancaran operasional? Log audit intervensi akan dicatat.
          </p>
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-2"
          >
            <X size={16} /> Batal
          </button>
          <button 
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ShieldAlert size={16} />
            )}
            Ya, Setujui Sebagai PMO
          </button>
        </div>
      </div>
    </div>
  );
}
