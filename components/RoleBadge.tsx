import React from 'react';
import type { UserRole } from '@/types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const config = {
    administrator: {
      label: 'Super Admin',
      className: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    pmo: {
      label: 'PMO Executive',
      className: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    project_manager: {
      label: 'Project Manager',
      className: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    project_team: {
      label: 'Project Team',
      className: 'bg-slate-50 text-slate-700 border-slate-200'
    }
  };

  const styleConfig = config[role] || config.project_team;
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider rounded-md border ${sizeClasses} ${styleConfig.className}`}>
      {styleConfig.label}
    </span>
  );
}
