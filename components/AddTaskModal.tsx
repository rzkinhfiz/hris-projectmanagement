'use client';

import React, { useState } from 'react';
import type { Profile } from '@/types';
import type { CreateTaskPayload } from '@/types';
import { createTask } from '@/services/taskService';
import { X, Check } from 'lucide-react';

interface AddTaskModalProps {
  projectId: string;
  projectTeamProfiles: Record<string, Profile>;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTaskModal({ projectId, projectTeamProfiles, onClose, onSuccess }: AddTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<CreateTaskPayload, 'project_id'>>({
    name: '',
    owner_id: '',
    priority: 'Medium',
    planned_start: '',
    planned_end: '',
    estimated_hours: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_hours' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: CreateTaskPayload = {
        project_id: projectId,
        name: formData.name,
        owner_id: formData.owner_id || null,
        priority: formData.priority,
        planned_start: formData.planned_start || null,
        planned_end: formData.planned_end || null,
        estimated_hours: formData.estimated_hours,
      };

      const { error } = await createTask(payload);
      
      if (error) {
        throw new Error(error.message);
      }
      
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create task');
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] focus:border-transparent transition";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#fcfbfa] w-full max-w-lg rounded-[2rem] shadow-xl border border-slate-100 flex flex-col my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Add New Task</h2>
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
                {Object.values(projectTeamProfiles).map(p => (
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
              <label className={labelClass}>Planned Start Date</label>
              <input 
                type="date" 
                name="planned_start"
                value={formData.planned_start || ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            
            <div>
              <label className={labelClass}>Planned End Date</label>
              <input 
                type="date" 
                name="planned_end"
                value={formData.planned_end || ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Estimated Hours</label>
            <input 
              type="number" 
              name="estimated_hours"
              min="0"
              value={formData.estimated_hours}
              onChange={handleChange}
              className={inputClass}
              placeholder="0"
            />
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
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
