'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { UserRole } from '@/types';
import { adminCreateUser } from '@/services/adminService';

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserModal({ onClose, onSuccess }: AddUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    password: '',
    role: 'project_team' as UserRole,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await adminCreateUser(formData);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user account');
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition shadow-sm";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#fcfbfa] w-full max-w-lg rounded-[2rem] shadow-xl border border-slate-100 flex flex-col my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/50 rounded-t-[2rem]">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Add New User</h2>
            <p className="text-sm text-slate-500 mt-1">Create a new account for the platform.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className={labelClass}>Email Address <span className="text-rose-500">*</span></label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. adhi@example.com"
            />
          </div>

          <div>
            <label className={labelClass}>Initial Password <span className="text-rose-500">*</span></label>
            <input 
              type="password" 
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              className={inputClass}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className={labelClass}>Full Name <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Adhi Putra"
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
              placeholder="e.g. +628123456789"
            />
          </div>

          <div>
            <label className={labelClass}>Assign Role <span className="text-rose-500">*</span></label>
            <select
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="project_team">Project Team</option>
              <option value="project_manager">Project Manager</option>
              <option value="pmo">PMO</option>
            </select>
            <p className="text-xs text-slate-400 mt-2 italic">
              Note: The 'administrator' role cannot be assigned from this interface.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-8">
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
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
