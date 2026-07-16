'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShieldCheck } from 'lucide-react';

export function SecurityForm() {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
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
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      setIsSubmitting(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });
      
      if (error) throw new Error(error.message);
      
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setFormData({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="bg-[#fcfbfa] rounded-[2rem] shadow-xl border border-slate-100 p-8 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-3 bg-rose-100 text-rose-500 rounded-2xl">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Security & Password</h2>
          <p className="text-sm text-slate-500">Update your account password here.</p>
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
            <label className={labelClass}>New Password</label>
            <input 
              type="password" 
              name="newPassword"
              required
              minLength={6}
              value={formData.newPassword} 
              onChange={handleChange}
              className={inputClass} 
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              required
              minLength={6}
              value={formData.confirmPassword} 
              onChange={handleChange}
              className={inputClass} 
              placeholder="Confirm new password"
            />
          </div>
        </div>
        
        <div className="pt-6 mt-auto">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-4 rounded-xl shadow-md transition disabled:opacity-70 flex justify-center items-center"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Update Password"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
