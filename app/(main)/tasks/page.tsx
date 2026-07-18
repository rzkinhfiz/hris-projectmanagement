"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckSquare, Search, Calendar, MoreHorizontal, List, Kanban, Check, Trash2, Pencil, Flag, Filter, ArrowUpRight } from "lucide-react";
import { getAllTasks, updateTaskStatus, deleteTask } from "@/services/taskService";
import { createClient } from "@/utils/supabase/client";
import type { TaskWithWorkstream } from "@/services/taskService";
import type { Profile, TaskStatus } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";

// --- ActionMenu Internal Component ---
function ActionMenu({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = () => setIsOpen(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-300 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
          <button 
            onClick={() => { setIsOpen(false); onEdit(); }}
            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Pencil size={14} className="text-blue-500" /> Edit Task
          </button>
          <button 
            onClick={() => { setIsOpen(false); onDelete(); }}
            className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
          >
            <Trash2 size={14} /> Delete Task
          </button>
        </div>
      )}
    </div>
  );
}

// --- ProgressSlider Internal Component ---
function ProgressSlider({ 
  taskId, 
  initialProgress, 
  disabled, 
  hideLabel = false,
  onSave 
}: { 
  taskId: string, 
  initialProgress: number, 
  disabled: boolean,
  hideLabel?: boolean,
  onSave: (taskId: string, progress: number) => Promise<void>
}) {
  const [localProgress, setLocalProgress] = useState(initialProgress);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setLocalProgress(initialProgress);
  }, [initialProgress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProgress(Number(e.target.value));
  };

  const handleRelease = async () => {
    if (localProgress === initialProgress) return;
    setStatus('saving');
    try {
      await onSave(taskId, localProgress);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setLocalProgress(initialProgress);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="w-full">
      {!hideLabel && (
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="text-slate-500 flex items-center gap-1">
            Progress
            {status === 'saving' && <div className="w-2.5 h-2.5 border border-[var(--color-brand-orange)] border-t-transparent rounded-full animate-spin"></div>}
            {status === 'saved' && <Check size={12} className="text-emerald-500" />}
            {status === 'error' && <span className="text-rose-500">Failed</span>}
          </span>
          <span className="text-slate-800">{localProgress}%</span>
        </div>
      )}
      
      {hideLabel && (
        <div className="flex items-center gap-2 mb-1 justify-end">
          {status === 'saving' && <div className="w-2.5 h-2.5 border border-[var(--color-brand-orange)] border-t-transparent rounded-full animate-spin"></div>}
          {status === 'saved' && <Check size={12} className="text-emerald-500" />}
          {status === 'error' && <span className="text-rose-500 text-[10px]">Failed</span>}
          <span className="text-xs font-bold text-slate-700 w-8 text-right">{localProgress}%</span>
        </div>
      )}
      
      <input 
        type="range" 
        min="0" max="100" step="5"
        value={localProgress}
        disabled={disabled || status === 'saving'}
        onChange={handleChange}
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-brand-orange)] disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

type ViewMode = 'list' | 'kanban';

export default function TasksPage() {
  const { profile: currentUser } = useAuth();
  const [tasks, setTasks] = useState<TaskWithWorkstream[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [projects, setProjects] = useState<Record<string, { name: string, pm_id: string | null }>>({});
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: tasksData } = await getAllTasks();
    
    const supabase = createClient();
    const { data: profilesData } = await supabase.from('profiles').select('*');
    const { data: projectsData } = await supabase.from('projects').select('id, name, pm_id');
    
    const profileMap: Record<string, Profile> = {};
    profilesData?.forEach((p) => { profileMap[p.id] = p; });

    const projectMap: Record<string, { name: string, pm_id: string | null }> = {};
    projectsData?.forEach((p) => { projectMap[p.id] = { name: p.name, pm_id: p.pm_id }; });

    setProfiles(profileMap);
    setProjects(projectMap);
    setTasks(tasksData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId || !profiles[ownerId]) return "Unassigned";
    return profiles[ownerId].full_name || "Unknown User";
  };

  const getInitials = (name: string) => {
    if (name === "Unassigned") return "?";
    return name.slice(0, 2).toUpperCase();
  };

  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setUpdatingTaskId(taskId);
    if (!currentUser) return;
    await deleteTask(taskId, currentUser.id);
    fetchData();
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!currentUser) return;
    setUpdatingTaskId(taskId);
    await updateTaskStatus(taskId, { status: newStatus }, currentUser.id, `Status updated to ${newStatus}`);
    await fetchData();
    setUpdatingTaskId(null);
  };

  const filteredTasks = tasks.filter(t => {
    const ownerName = getOwnerName(t.owner_id);
    const projectName = projects[t.project_id]?.name || "Unknown Project";
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const columns = [
    { id: 'DRAFT', title: 'Draft', color: 'bg-slate-100 text-slate-700' },
    { id: 'BACKLOG', title: 'Backlog', color: 'bg-orange-100 text-orange-700' },
    { id: 'TO_DO', title: 'To Do', color: 'bg-sky-100 text-sky-700' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-amber-100 text-amber-700' },
    { id: 'REVIEW', title: 'Review', color: 'bg-purple-100 text-purple-700' },
    { id: 'DONE', title: 'Done', color: 'bg-emerald-100 text-emerald-700' }
  ];

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col h-full min-h-[600px]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4 border-b border-slate-50 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="text-[var(--color-brand-orange)]" />
            Global Task Tracker
          </h2>
          <p className="text-sm text-slate-500 mt-1">Monitor operational progress across all projects.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition flex items-center gap-1 text-sm font-medium ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <List size={16} /> List
            </button>
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition flex items-center gap-1 text-sm font-medium ${viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <Kanban size={16} /> Kanban
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 bg-slate-50 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-700 outline-none border border-slate-200 focus:border-[var(--color-brand-orange)] focus:ring-1 focus:ring-[var(--color-brand-orange)] transition"
            />
          </div>
          
          <div className="relative flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filterPriority} 
              onChange={e => setFilterPriority(e.target.value)}
              className="bg-transparent text-sm text-slate-700 outline-none font-medium cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-orange)]"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto flex flex-col gap-6">
          {viewMode === 'kanban' && (
            <div className="flex gap-6 pb-4 h-full min-h-[400px]">
              {columns.map(column => (
                <div key={column.id} className="flex-1 min-w-[320px] bg-slate-50/80 rounded-2xl p-4 flex flex-col border border-slate-100">
                  <div className="flex items-center justify-between mb-4 px-1 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{column.title}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${column.color}`}>
                        {filteredTasks.filter(t => t.status === column.id).length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                    {filteredTasks.filter(t => t.status === column.id).map(task => {
                      const ownerName = getOwnerName(task.owner_id);
                      const isOwner = currentUser?.id === task.owner_id;
                      const projectPm = projects[task.project_id]?.pm_id;
                      const isProjectPM = currentUser?.role === 'project_manager' && projectPm === currentUser?.id;
                      const isProjectTeam = currentUser?.role === 'project_team';
                      const isLockedForTeam = isProjectTeam && (task.status === 'REVIEW' || task.status === 'DONE');
                      const canEdit = currentUser?.role === 'administrator' || currentUser?.role === 'pmo' || isProjectPM || (isOwner && !isLockedForTeam);
                      const canManageTask = currentUser?.role === 'administrator' || currentUser?.role === 'pmo' || isProjectPM;
                      
                      return (
                        <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 transition group relative">
                          {updatingTaskId === task.id && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-[var(--color-brand-orange)] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex flex-col gap-1.5 items-start">
                               <Link 
                                 href={`/projects/${task.project_id}`}
                                 className="text-amber-800 hover:text-amber-900 bg-orange-50 hover:bg-orange-100 font-medium px-2.5 py-1 rounded-full transition-colors inline-flex items-center gap-1 text-[10px] uppercase tracking-wider"
                               >
                                 {projects[task.project_id]?.name || "Unknown Project"}
                               </Link>
                               <div className="flex items-center gap-2 flex-wrap">
                                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityColor(task.priority)}`}>
                                   {task.priority}
                                 </span>
                                 {task.is_milestone && (
                                   <span className="text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                     <Flag size={10} /> Milestone
                                   </span>
                                 )}
                               </div>
                            </div>
                            
                            <RoleGuard currentRole={currentUser?.role || ''} allowed={["administrator", "pmo", "project_manager"]}>
                              {canManageTask && (
                                <ActionMenu 
                                  onEdit={() => { alert("Global edit not implemented yet. Please edit within the project context."); }}
                                  onDelete={() => handleDeleteTask(task.id)}
                                />
                              )}
                            </RoleGuard>
                          </div>
                          
                          <h4 className="font-bold text-slate-800 text-sm mb-3 leading-snug">{task.name}</h4>
                          
                          <div className="mb-4">
                            <ProgressSlider 
                              taskId={task.id}
                              initialProgress={task.progress}
                              disabled={!canEdit}
                              onSave={async (id, progress) => {
                                if (!currentUser) return;
                                await updateTaskStatus(id, { progress }, currentUser.id, "Progress updated via slider");
                                setTasks(prev => prev.map(t => t.id === id ? { ...t, progress } : t));
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                            <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium">
                              <Calendar size={14} className="text-slate-400" />
                              {task.planned_end ? new Date(task.planned_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No Due'}
                            </div>
                            <div className="flex gap-2 items-center">
                              <Link
                                href={`/projects/${task.project_id}?taskId=${task.id}`}
                                className="rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 p-1.5 flex items-center justify-center transition-colors"
                                title="Buka Detail di Proyek"
                              >
                                <ArrowUpRight size={14} />
                              </Link>
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200 shadow-sm" title={ownerName}>
                                {getInitials(ownerName)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {filteredTasks.filter(t => t.status === column.id).length === 0 && (
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8">
                        <span className="text-sm text-slate-400 font-medium text-center">No tasks in this stage</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="p-4">Project</th>
                    <th className="p-4">Task Name</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Assignee</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map(task => {
                    const isOwner = currentUser?.id === task.owner_id;
                    const projectPm = projects[task.project_id]?.pm_id;
                    const isProjectPM = currentUser?.role === 'project_manager' && projectPm === currentUser?.id;
                    const isProjectTeam = currentUser?.role === 'project_team';
                    const isLockedForTeam = isProjectTeam && (task.status === 'REVIEW' || task.status === 'DONE');
                    const canEdit = currentUser?.role === 'administrator' || currentUser?.role === 'pmo' || isProjectPM || (isOwner && !isLockedForTeam);
                    const canManageTask = currentUser?.role === 'administrator' || currentUser?.role === 'pmo' || isProjectPM;
                    return (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <Link 
                          href={`/projects/${task.project_id}`}
                          className="text-amber-800 hover:text-amber-900 bg-orange-50 hover:bg-orange-100 font-medium px-2.5 py-1 rounded-full transition-colors inline-flex items-center gap-1 text-[10px] uppercase tracking-wider max-w-[120px] truncate"
                          title={projects[task.project_id]?.name || "Unknown Project"}
                        >
                           {projects[task.project_id]?.name || "Unknown Project"}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-sm text-slate-800 flex items-center gap-2 max-w-[200px] truncate" title={task.name}>
                          {task.is_milestone && <Flag size={14} className="text-purple-500" />}
                          {task.name}
                        </div>
                      </td>
                      <td className="p-4">
                        <select 
                          value={task.status}
                          disabled={!canEdit}
                          onChange={(e) => {
                            const newStatus = e.target.value as TaskStatus;
                            const isProjectTeam = currentUser?.role === 'project_team';
                            if (isProjectTeam && (newStatus === 'DONE' || newStatus === 'DRAFT')) {
                              alert("⚖️ Hanya Project Manager yang dapat mengubah tugas ke status Done atau Draft");
                              return;
                            }
                            handleUpdateStatus(task.id, newStatus);
                          }}
                          className="text-xs font-bold text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 bg-white outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="DRAFT" disabled={currentUser?.role === 'project_team'}>Draft</option>
                          <option value="BACKLOG">Backlog</option>
                          <option value="TO_DO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="REVIEW">Review</option>
                          <option value="DONE" disabled={currentUser?.role === 'project_team'}>Done</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600">
                        {getOwnerName(task.owner_id)}
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {task.planned_end ? new Date(task.planned_end).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4 w-40">
                        <ProgressSlider 
                          taskId={task.id}
                          initialProgress={task.progress}
                          disabled={!canEdit}
                          hideLabel={true}
                          onSave={async (id, progress) => {
                            if (!currentUser) return;
                            await updateTaskStatus(id, { progress }, currentUser.id, "Progress updated via list view slider");
                            setTasks(prev => prev.map(t => t.id === id ? { ...t, progress } : t));
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/projects/${task.project_id}?taskId=${task.id}`}
                            className="rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 p-1.5 flex items-center justify-center transition-colors"
                            title="Buka Detail di Proyek"
                          >
                            <ArrowUpRight size={14} />
                          </Link>
                          <RoleGuard currentRole={currentUser?.role || ''} allowed={["administrator", "pmo", "project_manager"]}>
                            {canManageTask && (
                              <ActionMenu 
                                onEdit={() => { alert("Global edit not implemented yet. Please edit within the project context."); }}
                                onDelete={() => handleDeleteTask(task.id)}
                              />
                            )}
                          </RoleGuard>
                        </div>
                      </td>
                    </tr>
                  )})}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 text-sm">No tasks found matching your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
