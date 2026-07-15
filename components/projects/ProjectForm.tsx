"use client";

import React, { useState } from "react";
import type { Profile } from "../../types";

export interface ProjectFormData {
  code: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  pm_id: string;
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
    description: initialData?.description || "",
    status: initialData?.status || "Draft",
    start_date: initialData?.start_date || "",
    end_date: initialData?.end_date || "",
    pm_id: initialData?.pm_id || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Project Code</label>
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
          <label className={labelClass}>Project Name</label>
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
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of the project..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Start Date</label>
          <input
            type="date"
            name="start_date"
            required
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
        <select name="pm_id" value={formData.pm_id} onChange={handleChange} className={inputClass}>
          <option value="">-- Select a Project Manager --</option>
          {projectManagers.map((pm) => (
            <option key={pm.id} value={pm.id}>
              {pm.full_name} ({pm.email})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
        <a 
          href={cancelHref}
          className="px-6 py-3 rounded-full text-sm font-semibold text-slate-500 hover:bg-slate-100 transition"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-full text-sm font-semibold text-white bg-[var(--color-brand-orange)] hover:bg-orange-600 shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            "Save Project"
          )}
        </button>
      </div>
    </form>
  );
}
