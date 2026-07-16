import React, { useState } from 'react';
import { Calendar, Flag, MoreHorizontal } from 'lucide-react';
import type { TaskWithWorkstream } from '@/services/taskService';
import type { Project, TaskStatus } from '@/types';
import type { AuthProfile } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/RoleGuard';
import { ActionMenu, ProgressSlider } from '@/components/projects/tabs/TasksTab';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';

interface KanbanBoardProps {
  tasks: TaskWithWorkstream[];
  project: Project;
  currentUser: AuthProfile | null;
  updatingTaskId: string | null;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onUpdateProgress: (taskId: string, progress: number) => Promise<void>;
  onEditTask: (task: TaskWithWorkstream) => void;
  onDeleteTask: (taskId: string) => void;
  getOwnerName: (ownerId: string | null) => string;
}

export function KanbanBoard({
  tasks,
  project,
  currentUser,
  updatingTaskId,
  onUpdateStatus,
  onUpdateProgress,
  onEditTask,
  onDeleteTask,
  getOwnerName
}: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'DRAFT', title: 'Draft', color: 'bg-slate-100 text-slate-700' },
    { id: 'BACKLOG', title: 'Backlog', color: 'bg-orange-100 text-orange-700' },
    { id: 'TO_DO', title: 'To Do', color: 'bg-sky-100 text-sky-700' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-amber-100 text-amber-700' },
    { id: 'REVIEW', title: 'Review', color: 'bg-purple-100 text-purple-700' },
    { id: 'DONE', title: 'Done', color: 'bg-emerald-100 text-emerald-700' }
  ];

  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getInitials = (name: string) => {
    if (!name || name === 'Unassigned') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDraggedTaskId(null);
    
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // RBAC Guardrails
    const isProjectTeam = currentUser?.role === 'project_team';
    
    if (isProjectTeam && (newStatus === 'DONE' || newStatus === 'DRAFT')) {
      alert("⚖️ Hanya Project Manager yang dapat mengubah tugas ke status Done atau Draft");
      return;
    }

    const isOwner = currentUser?.id === task.owner_id;
    const isProjectPM = currentUser?.role === 'project_manager' && project.pm_id === currentUser?.id;
    const canEdit = currentUser?.role === 'administrator' || currentUser?.role === 'pmo' || isProjectPM || isOwner;

    if (!canEdit) {
      alert("Anda tidak memiliki akses untuk memindahkan tugas ini.");
      return;
    }

    await onUpdateStatus(taskId, newStatus);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-[600px] w-full items-start">
      {columns.map(column => (
        <div 
          key={column.id} 
          className="flex-1 min-w-[320px] bg-slate-50/80 rounded-2xl p-4 flex flex-col border border-slate-100 h-full"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between mb-4 px-1 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800">{column.title}</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${column.color}`}>
                {tasks.filter(t => t.status === column.id).length}
              </span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 pb-10">
            {tasks.filter(t => t.status === column.id).map(task => {
              const ownerName = getOwnerName(task.owner_id);
              const isOwner = currentUser?.id === task.owner_id;
              const isProjectPM = currentUser?.role === 'project_manager' && project.pm_id === currentUser?.id;
              const isProjectTeam = currentUser?.role === 'project_team';
              const isLockedForTeam = isProjectTeam && (task.status === 'REVIEW' || task.status === 'DONE');
              const canEdit = currentUser?.role === 'administrator' || currentUser?.role === 'pmo' || isProjectPM || (isOwner && !isLockedForTeam);
              const canManageTask = currentUser?.role === 'administrator' || currentUser?.role === 'pmo' || isProjectPM;
              const isDragging = draggedTaskId === task.id;
              
              return (
                <div 
                  key={task.id} 
                  draggable={canEdit}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={() => setDraggedTaskId(null)}
                  className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 transition group relative ${canEdit ? 'cursor-grab active:cursor-grabbing hover:border-slate-300' : 'opacity-80'} ${isDragging ? 'opacity-50 scale-95' : ''}`}
                >
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
                      {canManageTask && (
                        <ActionMenu 
                          onEdit={() => onEditTask(task)}
                          onDelete={() => onDeleteTask(task.id)}
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
                        await onUpdateProgress(id, progress);
                      }}
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
            
            {tasks.filter(t => t.status === column.id).length === 0 && (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8">
                <span className="text-sm text-slate-400 font-medium text-center">No tasks in this stage</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
