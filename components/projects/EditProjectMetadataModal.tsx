"use client";

import React, { useState } from "react";
import { Project, ProjectStatus } from "@/types";
import { useRouter } from "next/navigation";
import { updateProjectMetadata } from "@/services/projectService";

interface EditProjectMetadataModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    role: string;
    email?: string;
  };
}

export function EditProjectMetadataModal({
  project,
  isOpen,
  onClose,
  currentUser,
}: EditProjectMetadataModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    status: project.status as ProjectStatus,
    project_class: project.project_class || "CLASS_1_0",
    contract_value_excl_tax: project.contract_value_excl_tax || 0,
    start_date: project.start_date || "",
    end_date: project.end_date || "",
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "contract_value_excl_tax" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await updateProjectMetadata(
      project.id,
      {
        status: formData.status,
        project_class: formData.project_class,
        contract_value_excl_tax: formData.contract_value_excl_tax,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      },
      {
        performerId: currentUser.id,
        performerRole: currentUser.role,
        userEmail: currentUser.email || "Unknown Email",
      }
    );

    setIsSubmitting(false);

    if (error) {
      alert("Failed to update project metadata: " + error.message);
    } else {
      alert("Project metadata updated successfully!");
      router.refresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-[#fcfbfa] w-full max-w-2xl rounded-[2rem] shadow-xl border border-amber-100/50 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-amber-100/50 flex justify-between items-center bg-white">
          <h2 className="text-2xl font-bold text-slate-800">Edit Project Metadata</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <form id="edit-metadata-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Project Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-2xl border border-slate-200 transition focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10 ${!formData.status ? 'text-gray-600 font-medium' : 'text-gray-900 font-semibold'}`}
                  required
                >
                  <option value="Draft">Draft</option>
                  <option value="To do">To do</option>
                  <option value="In progress">In progress</option>
                  <option value="Hold">Hold</option>
                  <option value="To review">To review</option>
                  <option value="Started">Started</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Canceled">Canceled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Project Class</label>
                <select
                  name="project_class"
                  value={formData.project_class}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-2xl border border-slate-200 transition focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10 ${!formData.project_class ? 'text-gray-600 font-medium' : 'text-gray-900 font-semibold'}`}
                  required
                >
                  <option value="CLASS_1_0">Class 1.0</option>
                  <option value="CLASS_2_0">Class 2.0</option>
                  <option value="CLASS_3_0">Class 3.0</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Contract Value (Excl. Tax)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                  <input
                    type="number"
                    name="contract_value_excl_tax"
                    value={formData.contract_value_excl_tax}
                    onChange={handleChange}
                    className="w-full p-3 pl-12 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition outline-none"
                    required
                    min="0"
                  />
                </div>
                {formData.contract_value_excl_tax > 0 && (
                  <p className="text-amber-700 text-xs font-medium mt-2">
                    💡 Preview: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(formData.contract_value_excl_tax))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Baseline Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-gray-700 font-medium focus:text-gray-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Baseline End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-gray-700 font-medium focus:text-gray-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition outline-none"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-amber-100/50 bg-white flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-metadata-form"
            className="px-6 py-3 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-lg shadow-amber-600/20 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
