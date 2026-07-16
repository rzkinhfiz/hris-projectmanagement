'use client';

import React, { useState } from 'react';
import type { Project, LegalStatus, Profile } from '@/types';
import { updateProjectLegalStatus } from '@/services/projectService';
import { FileText, Edit2, Link as LinkIcon, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { TooltipNote } from "@/components/TooltipNote";
import { useRouter } from 'next/navigation';

interface ProjectComplianceCardProps {
  project: Project;
  currentUser: { id: string; role: string | null };
}

export function ProjectComplianceCard({ project, currentUser }: ProjectComplianceCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    spk_status: project.spk_status || 'NOT_STARTED',
    nda_status: project.nda_status || 'NOT_STARTED',
    spk_document_url: project.spk_document_url || '',
    nda_document_url: project.nda_document_url || '',
  });

  const canEdit = currentUser.role === 'pmo' || currentUser.role === 'administrator';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_REVIEW': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'NOT_REQUIRED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'NOT_STARTED':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await updateProjectLegalStatus(
      project.id,
      {
        spk_status: formData.spk_status as LegalStatus,
        nda_status: formData.nda_status as LegalStatus,
        spk_document_url: formData.spk_document_url,
        nda_document_url: formData.nda_document_url,
      },
      { performerId: currentUser.id, performerRole: currentUser.role || '' }
    );

    setIsSubmitting(false);

    if (result.error) {
      setErrorMsg(result.error.message);
    } else {
      setIsEditing(false);
      router.refresh();
    }
  };

  const renderStatusBadge = (status: string) => (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider rounded-md border px-2.5 py-1 text-[10px] ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );

  return (
    <div className="bg-[#fcfbfa] rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle size={18} className="text-[var(--color-brand-orange)]" />
            Project Compliance
          </h3>
          <p className="text-xs text-slate-500 mt-1">Legal documents and requirements status</p>
        </div>
        {canEdit && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-full transition"
          >
            <Edit2 size={14} />
            Update Status
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {errorMsg && (
          <div className="p-4 mb-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-200">
            {errorMsg}
          </div>
        )}

        {/* SPK Section */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            Surat Perintah Kerja (SPK)
            <TooltipNote content="Status verifikasi dokumen legal dari PMO" position="right">
              <HelpCircle size={14} className="text-slate-400 cursor-help hover:text-[var(--color-brand-orange)] transition-colors" />
            </TooltipNote>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
              {isEditing ? (
                <select
                  name="spk_status"
                  value={formData.spk_status}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="SIGNED">Signed</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="NOT_REQUIRED">Not Required</option>
                </select>
              ) : (
                renderStatusBadge(project.spk_status || 'NOT_STARTED')
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Document URL</label>
              {isEditing ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon size={14} className="text-slate-400" />
                  </div>
                  <input
                    type="url"
                    name="spk_document_url"
                    value={formData.spk_document_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition"
                  />
                </div>
              ) : (
                project.spk_document_url ? (
                  <a href={project.spk_document_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    <LinkIcon size={14} /> View Document
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 italic">No document attached</span>
                )
              )}
            </div>
          </div>
        </div>

        {/* NDA Section */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            Non-Disclosure Agreement (NDA)
            <TooltipNote content="Status verifikasi dokumen legal dari PMO" position="right">
              <HelpCircle size={14} className="text-slate-400 cursor-help hover:text-[var(--color-brand-orange)] transition-colors" />
            </TooltipNote>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
              {isEditing ? (
                <select
                  name="nda_status"
                  value={formData.nda_status}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="SIGNED">Signed</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="NOT_REQUIRED">Not Required / Waived</option>
                </select>
              ) : (
                renderStatusBadge(project.nda_status || 'NOT_STARTED')
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Document URL</label>
              {isEditing ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon size={14} className="text-slate-400" />
                  </div>
                  <input
                    type="url"
                    name="nda_document_url"
                    value={formData.nda_document_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition"
                  />
                </div>
              ) : (
                project.nda_document_url ? (
                  <a href={project.nda_document_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    <LinkIcon size={14} /> View Document
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 italic">No document attached</span>
                )
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button 
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  spk_status: project.spk_status || 'NOT_STARTED',
                  nda_status: project.nda_status || 'NOT_STARTED',
                  spk_document_url: project.spk_document_url || '',
                  nda_document_url: project.nda_document_url || '',
                });
              }}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Save Compliance
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
