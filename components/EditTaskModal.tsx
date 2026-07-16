'use client';

import React, { useState } from 'react';
import type { Profile } from '@/types';
import type { TaskWithWorkstream } from '@/services/taskService';
import { updateTaskStatus } from '@/services/taskService';
import { X, Check } from 'lucide-react';

interface EditTaskModalProps {
  task: TaskWithWorkstream;
  projectTeamProfiles: Record<string, Profile>;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTaskModal({ task, projectTeamProfiles, currentUserId, onClose, onSuccess }: EditTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: task.name,
    owner_id: task.owner_id || '',
    priority: task.priority,
    planned_start: task.planned_start ? new Date(task.planned_start).toISOString().split('T')[0] : '',
    planned_end: task.planned_end ? new Date(task.planned_end).toISOString().split('T')[0] : '',
    estimated_hours: task.estimated_hours || 0,
    actual_hours: task.actual_hours || 0,
    is_milestone: task.is_milestone || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: (name === 'estimated_hours' || name === 'actual_hours') ? Number(value) : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updates = {
        name: formData.name,
        owner_id: formData.owner_id || null,
        priority: formData.priority,
        planned_start: formData.planned_start || null,
        planned_end: formData.planned_end || null,
        estimated_hours: formData.estimated_hours,
        actual_hours: formData.actual_hours,
        is_milestone: formData.is_milestone,
      };

      const { error } = await updateTaskStatus(task.id, updates, currentUserId, "Updated task details via Edit Modal");
      
      if (error) {
        throw new Error(error.message);
      }
      
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update task');
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#fcfbfa] w-full max-w-lg rounded-[2rem] shadow-xl border border-slate-100 flex flex-col my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Edit Task</h2>
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
            <label className={labelClass}>Task Title <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Design Database Schema"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Assignee</label>
              <select
                name="owner_id"
                value={formData.owner_id || ''}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {Object.values(projectTeamProfiles)
                  .filter(p => p.role !== 'administrator' && p.status !== 'INACTIVE')
                  .map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.role.replace('_', ' ')})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={labelClass}>Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Planned Start</label>
              <input 
                type="date" 
                name="planned_start"
                value={formData.planned_start || ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            
            <div>
              <label className={labelClass}>Planned End</label>
              <input 
                type="date" 
                name="planned_end"
                value={formData.planned_end || ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Estimated Hours</label>
              <input 
                type="number" 
                name="estimated_hours"
                min="0"
                value={formData.estimated_hours}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Actual Hours</label>
              <input 
                type="number" 
                name="actual_hours"
                min="0"
                value={formData.actual_hours}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <input 
              type="checkbox"
              id="is_milestone"
              name="is_milestone"
              checked={formData.is_milestone}
              onChange={handleChange}
              className="w-5 h-5 accent-[var(--color-brand-orange)] rounded cursor-pointer"
            />
            <label htmlFor="is_milestone" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
              Mark as Milestone
            </label>
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
