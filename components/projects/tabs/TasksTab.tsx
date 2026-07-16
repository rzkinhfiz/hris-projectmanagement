'use client';

import React, { useEffect, useState } from 'react';
import type { Project, Profile } from '@/types';
import type { TaskWithWorkstream } from '@/services/taskService';
import { getTasksByProject, updateTaskStatus } from '@/services/taskService';
import { createClient } from '@/utils/supabase/client';
import { AddTaskModal } from '@/components/AddTaskModal';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckSquare, Search, Plus, Calendar, MoreHorizontal, 
  List, Kanban, Clock, Filter, Flag
} from 'lucide-react';

interface TasksTabProps {
  project: Project;
}

type ViewMode = 'list' | 'kanban' | 'gantt';

export function TasksTab({ project }: TasksTabProps) {
  const { profile: currentUser } = useAuth();
  const [tasks, setTasks] = useState<TaskWithWorkstream[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: tasksData } = await getTasksByProject(project.id);
    
    const supabase = createClient();
    const { data: profilesData } = await supabase.from('profiles').select('*');
    const profileMap: Record<string, Profile> = {};
    profilesData?.forEach((p) => {
      profileMap[p.id] = p;
    });

    setProfiles(profileMap);
    setTasks(tasksData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [project.id]);

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

  const handleUpdateProgress = async (taskId: string, newProgress: number) => {
    if (!currentUser) return;
    setUpdatingTaskId(taskId);
    await updateTaskStatus(taskId, { progress: newProgress }, currentUser.id, "Progress updated via slider");
    await fetchData();
    setUpdatingTaskId(null);
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    if (!currentUser) return;
    setUpdatingTaskId(taskId);
    await updateTaskStatus(taskId, { status: newStatus }, currentUser.id, `Status updated to ${newStatus}`);
    await fetchData();
    setUpdatingTaskId(null);
  };

  const filteredTasks = tasks.filter(t => {
    const ownerName = getOwnerName(t.owner_id);
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignee = filterAssignee === 'all' || t.owner_id === filterAssignee;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesAssignee && matchesPriority;
  });

  const columns = [
    { id: "To Do", title: "To Do", color: "bg-slate-200 text-slate-700" },
    { id: "In Progress", title: "In Progress", color: "bg-blue-100 text-blue-700" },
    { id: "Completed", title: "Completed", color: "bg-emerald-100 text-emerald-700" }
  ];

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col h-full min-h-[600px]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4 border-b border-slate-50 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="text-[var(--color-brand-orange)]" />
            Project Tasks
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage deliverables and track progress.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition flex items-center gap-1 text-sm font-medium ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <List size={16} /> List
            </button>
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition flex items-center gap-1 text-sm font-medium ${viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <Kanban size={16} /> Kanban
            </button>
            <button onClick={() => setViewMode('gantt')} className={`p-2 rounded-lg transition flex items-center gap-1 text-sm font-medium ${viewMode === 'gantt' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <Clock size={16} /> Timeline
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          {/* Search */}
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
          
          {/* Filters */}
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

          <RoleGuard currentRole={currentUser?.role || ''} allowed={["administrator", "pmo", "project_manager"]}>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-md flex items-center gap-1"
            >
              <Plus size={16} />
              Add Task
            </button>
          </RoleGuard>
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
                      const canEdit = currentUser?.role === 'administrator' || currentUser?.role === 'pmo' || currentUser?.role === 'project_manager' || isOwner;
                      
                      return (
                        <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 transition group relative">
                          {updatingTaskId === task.id && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-[var(--color-brand-orange)] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-3">
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
                            
                            <RoleGuard currentRole={currentUser?.role || ''} allowed={["administrator", "pmo", "project_manager"]}>
                              <button className="text-slate-300 hover:text-slate-600 transition">
                                <MoreHorizontal size={16} />
                              </button>
                            </RoleGuard>
                          </div>
                          
                          <h4 className="font-bold text-slate-800 text-sm mb-3 leading-snug">{task.name}</h4>
                          
                          <div className="mb-4">
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-slate-500">Progress</span>
                              <span className="text-slate-800">{task.progress}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" max="100" step="5"
                              value={task.progress}
                              disabled={!canEdit}
                              onChange={(e) => handleUpdateProgress(task.id, Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-brand-orange)] disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium">
                                <Calendar size={14} className="text-slate-400" />
                                {task.planned_end ? new Date(task.planned_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No Due'}
                              </div>
                              <div className="flex items-center text-[11px] text-slate-400 font-medium">
                                ⏳ {task.actual_hours}h / {task.estimated_hours}h
                              </div>
                            </div>
                            
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200 shadow-sm" title={ownerName}>
                              {getInitials(ownerName)}
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
                    <th className="p-4">Task Name</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Assignee</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map(task => {
                    const isOwner = currentUser?.id === task.owner_id;
                    const canEdit = currentUser?.role === 'administrator' || currentUser?.role === 'pmo' || currentUser?.role === 'project_manager' || isOwner;
                    return (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          {task.is_milestone && <Flag size={14} className="text-purple-500" />}
                          {task.name}
                        </div>
                      </td>
                      <td className="p-4">
                        <select 
                          value={task.status}
                          disabled={!canEdit}
                          onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                          className="text-xs font-bold text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 bg-white outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
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
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <input 
                            type="range" min="0" max="100" step="5"
                            value={task.progress}
                            disabled={!canEdit}
                            onChange={(e) => handleUpdateProgress(task.id, Number(e.target.value))}
                            className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-brand-orange)]"
                          />
                          <span className="text-xs font-bold text-slate-700 w-8">{task.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  )})}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">No tasks found matching your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'gantt' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[400px]">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">Timeline View</h3>
                  <p className="text-sm text-slate-500">Native CSS Grid visualization (simplified).</p>
                </div>
              </div>

              <div className="space-y-4">
                {filteredTasks.map(task => {
                  // Simplified visualization logic for native gantt
                  // We simulate a grid of 30 days.
                  const startDay = Math.floor(Math.random() * 10);
                  const duration = Math.max(3, Math.floor(Math.random() * 15));
                  const leftPercent = (startDay / 30) * 100;
                  const widthPercent = (duration / 30) * 100;
                  
                  return (
                    <div key={task.id} className="flex items-center gap-4 group">
                      <div className="w-1/4 truncate text-sm font-medium text-slate-700">
                        {task.name}
                      </div>
                      <div className="flex-1 bg-white h-10 rounded-xl border border-slate-200 relative overflow-hidden flex items-center px-1">
                        <div className="absolute inset-0 bg-slate-100/50" style={{ backgroundSize: '10% 100%', backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px)'}}></div>
                        
                        <div 
                          className={`absolute h-6 rounded-md shadow-sm border flex items-center px-2 text-[10px] font-bold text-white overflow-hidden transition-all
                            ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-600' : 
                              task.status === 'In Progress' ? 'bg-blue-500 border-blue-600' : 'bg-slate-400 border-slate-500'}`}
                          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                        >
                          {task.progress}%
                          
                          <div 
                            className="absolute bottom-0 left-0 h-1 bg-white/40" 
                            style={{ width: `${task.progress}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">No tasks to display in timeline.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <AddTaskModal 
          projectId={project.id}
          projectTeamProfiles={profiles}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
