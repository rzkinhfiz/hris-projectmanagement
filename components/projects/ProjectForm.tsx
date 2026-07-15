"use client";

import React, { useState } from "react";
import type { Profile } from "../../types";

export interface ProjectFormData {
  code: string;
  name: string;
  client_name: string;
  description: string;
  pm_id: string;
  // Section 2 fields
  contract_value_excl_tax: number;
  sales_order_no: string;
  project_class: string;
  nda_status: "pending" | "done" | "not_required";
  spk_status: "pending" | "done";
  internal_drive_url: string;
  external_drive_url: string;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "on_hold" | "completed";
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  projectManagers: Profile[];
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isSubmitting: boolean;
  cancelHref?: string;
}

export function ProjectForm({ 
  initialData, 
  projectManagers, 
  onSubmit, 
  isSubmitting,
  cancelHref = "/dashboard"
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    code: initialData?.code || "",
    name: initialData?.name || "",
    client_name: initialData?.client_name || "",
    description: initialData?.description || "",
    pm_id: initialData?.pm_id || "",
    contract_value_excl_tax: initialData?.contract_value_excl_tax || 0,
    sales_order_no: initialData?.sales_order_no || "",
    project_class: initialData?.project_class || "",
    nda_status: initialData?.nda_status || "pending",
    spk_status: initialData?.spk_status || "pending",
    internal_drive_url: initialData?.internal_drive_url || "",
    external_drive_url: initialData?.external_drive_url || "",
    start_date: initialData?.start_date || "",
    end_date: initialData?.end_date || "",
    status: initialData?.status || "draft",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const inputClass = "w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";
  const sectionTitleClass = "text-lg font-bold text-[var(--color-brand-orange)] mb-4 pb-2 border-b border-slate-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Section 1: Basic Information */}
      <section>
        <h3 className={sectionTitleClass}>Section 1: Informasi Dasar Proyek</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className={labelClass}>Project Code <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="code"
              required
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. PRJ-001"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Project Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Website Revamp"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Client Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="client_name"
              required
              value={formData.client_name}
              onChange={handleChange}
              placeholder="e.g. PT Pertamina Hulu Rokan"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the project..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className={`${inputClass} ${!formData.status ? 'text-slate-400' : 'text-slate-900'}`}>
              <option value="draft" className="text-slate-900">Draft</option>
              <option value="active" className="text-slate-900">Active</option>
              <option value="on_hold" className="text-slate-900">On Hold</option>
              <option value="completed" className="text-slate-900">Completed</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Assign Project Manager</label>
          <select name="pm_id" value={formData.pm_id} onChange={handleChange} className={`${inputClass} ${!formData.pm_id ? 'text-slate-400' : 'text-slate-900'}`}>
            <option value="" className="text-slate-400">-- Select a Project Manager --</option>
            {projectManagers.map((pm) => {
              const formattedRole = pm.role === 'project_manager' ? 'Project Manager' : pm.role === 'pmo' ? 'PMO' : pm.role;
              return (
                <option key={pm.id} value={pm.id} className="text-slate-900">
                  {pm.full_name} — {formattedRole}
                </option>
              );
            })}
          </select>
        </div>
      </section>

      {/* Section 2: Contract, Financial & Legality */}
      <section>
        <h3 className={sectionTitleClass}>Section 2: Kontrak, Finansial & Legalitas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className={labelClass}>Contract Value Excl. Tax (Rp) *</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-medium">Rp</span>
              <input
                type="number"
                name="contract_value_excl_tax"
                required
                min="0"
                value={formData.contract_value_excl_tax || ""}
                onChange={handleNumberChange}
                placeholder="0"
                className={`${inputClass} pl-10 font-bold`}
              />
            </div>
            {formData.contract_value_excl_tax > 0 && (
              <p className="text-xs text-[var(--color-brand-orange)] mt-1 ml-1">
                {formData.contract_value_excl_tax.toLocaleString('id-ID')}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Sales Order No.</label>
            <input
              type="text"
              name="sales_order_no"
              value={formData.sales_order_no}
              onChange={handleChange}
              placeholder="e.g. SO-2026-901"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className={labelClass}>Project Class</label>
            <select name="project_class" value={formData.project_class} onChange={handleChange} className={`${inputClass} ${!formData.project_class ? 'text-slate-400' : 'text-slate-900'}`}>
              <option value="" className="text-slate-400">-- Select Class --</option>
              <option value="Class 1.0" className="text-slate-900">Class 1.0</option>
              <option value="Class 2.0" className="text-slate-900">Class 2.0</option>
              <option value="Class 3.0" className="text-slate-900">Class 3.0</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>NDA Status</label>
            <select name="nda_status" value={formData.nda_status} onChange={handleChange} className={`${inputClass} ${!formData.nda_status ? 'text-slate-400' : 'text-slate-900'}`}>
              <option value="pending" className="text-slate-900">Pending</option>
              <option value="done" className="text-slate-900">Done</option>
              <option value="not_required" className="text-slate-900">Not Required</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>SPK Status</label>
            <select name="spk_status" value={formData.spk_status} onChange={handleChange} className={`${inputClass} ${!formData.spk_status ? 'text-slate-400' : 'text-slate-900'}`}>
              <option value="pending" className="text-slate-900">Pending</option>
              <option value="done" className="text-slate-900">Done</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Internal Drive URL</label>
            <input
              type="url"
              name="internal_drive_url"
              value={formData.internal_drive_url}
              onChange={handleChange}
              placeholder="https://drive.google.com/..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>External Drive URL</label>
            <input
              type="url"
              name="external_drive_url"
              value={formData.external_drive_url}
              onChange={handleChange}
              placeholder="https://drive.google.com/..."
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
        <a 
          href={cancelHref}
          className="px-6 py-3 rounded-full text-sm font-semibold text-slate-500 hover:bg-slate-100 transition"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 shadow-xl shadow-slate-200 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Project...
            </>
          ) : (
            "Create Project"
          )}
        </button>
      </div>
    </form>
  );
}
