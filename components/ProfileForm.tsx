'use client';

import { useState } from 'react';
import type { Profile } from '@/types';
import { updateUserProfile } from '@/services/userService';
import { User } from 'lucide-react';
import { RoleBadge } from './RoleBadge';

type ProfileFormProps = {
  profile: Profile;
  userEmail: string;
};

export function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    phone_number: profile.phone_number || '',
    avatar_url: profile.avatar_url || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const { error } = await updateUserProfile(profile.id, userEmail, formData);
      if (error) throw new Error(error.message);
      
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="bg-[#fcfbfa] rounded-[2rem] shadow-xl border border-slate-100 p-8 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-3 bg-orange-100 text-[var(--color-brand-orange)] rounded-2xl">
          <User size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Profile Information</h2>
          <p className="text-sm text-slate-500">Update your personal details here.</p>
        </div>
      </div>
      
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className={labelClass}>Email Address (Read-Only)</label>
            <input 
              type="email" 
              value={userEmail} 
              disabled 
              className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-sm rounded-xl px-4 py-3 outline-none cursor-not-allowed" 
            />
          </div>
          
          <div>
            <label className={labelClass}>Current Role (Read-Only)</label>
            <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 flex items-center cursor-not-allowed">
              <RoleBadge role={profile.role} size="md" />
            </div>
          </div>
          
          <div>
            <label className={labelClass}>Full Name</label>
            <input 
              type="text" 
              name="full_name"
              value={formData.full_name} 
              onChange={handleChange}
              className={inputClass} 
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div>
            <label className={labelClass}>Phone Number</label>
            <input 
              type="text" 
              name="phone_number"
              value={formData.phone_number} 
              onChange={handleChange}
              className={inputClass} 
              placeholder="e.g. +62 812 3456 7890"
            />
          </div>

          <div>
            <label className={labelClass}>Avatar URL</label>
            <input 
              type="url" 
              name="avatar_url"
              value={formData.avatar_url} 
              onChange={handleChange}
              className={inputClass} 
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>
        
        <div className="pt-6 mt-auto">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-xl shadow-md transition disabled:opacity-70 flex justify-center items-center"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
