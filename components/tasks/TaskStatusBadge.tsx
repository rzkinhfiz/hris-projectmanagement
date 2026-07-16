import React from 'react';
import type { TaskStatus } from '@/types';

interface TaskStatusBadgeProps {
  status: TaskStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function TaskStatusBadge({ status, size = 'sm', className = '' }: TaskStatusBadgeProps) {
  const getBadgeStyle = (statusStr: string) => {
    switch (statusStr?.toUpperCase()) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'BACKLOG':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'TO_DO':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
      case 'REVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DONE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        // Fallback for any old string data that hasn't been migrated
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatLabel = (statusStr: string) => {
    if (!statusStr) return 'Unknown';
    if (statusStr === 'TO_DO') return 'To Do';
    if (statusStr === 'IN_PROGRESS') return 'In Progress';
    return statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase();
  };

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md border ${sizeClasses} ${getBadgeStyle(status)} ${className}`}>
      {formatLabel(status)}
    </span>
  );
}
