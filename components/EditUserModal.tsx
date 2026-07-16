'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Profile, UserRole } from '@/types';
import { adminUpdateUser } from '@/services/adminService';

interface EditUserModalProps {
  user: Profile;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: user.full_name || '',
    phoneNumber: user.phone_number || '',
    role: user.role,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await adminUpdateUser(user.id, {
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      role: formData.role as UserRole
    });

    if (result.success) {
      onSuccess();
    } else {
      setErrorMsg(result.error || 'Failed to update user');
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-[#fcfbfa] w-full max-w-md rounded-[2rem] shadow-xl border border-slate-100 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Edit User Role</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className={labelClass}>Full Name</label>
            <input 
              type="text" 
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input 
              type="tel" 
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>User Role</label>
            <select 
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="administrator">Administrator</option>
              <option value="pmo">PMO</option>
              <option value="project_manager">Project Manager</option>
              <option value="project_team">Project Team</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Role determines the access permissions across the application.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
