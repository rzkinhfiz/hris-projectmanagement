import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { TaskWithWorkstream } from "@/services/taskService";
import type { Project } from "@/types";

export interface OverallProgressProps {
  projects: Project[];
  tasks: TaskWithWorkstream[];
  currentUserId: string;
}

export function OverallProgress({
  projects,
  tasks,
  currentUserId
}: OverallProgressProps) {
  const [filter, setFilter] = useState<'All' | 'My'>('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter projects/tasks
  const activeProjects = filter === 'All' ? projects : projects.filter(p => p.pm_id === currentUserId);
  const activeProjectIds = new Set(activeProjects.map(p => p.id));
  const activeTasks = filter === 'All' ? tasks : tasks.filter(t => activeProjectIds.has(t.project_id) || t.owner_id === currentUserId);

  const completedTasks = activeTasks.filter(t => t.status === 'DONE').length;
  const totalTasks = activeTasks.length;
  const totalProjects = activeProjects.length;
  const completedProjects = activeProjects.filter(p => p.status === 'Completed').length;
  const delayedProjects = activeProjects.filter(p => p.status === 'Overdue' || p.status === 'Hold').length;
  const ongoingProjects = activeProjects.filter(p => p.status === 'In progress' || p.status === 'Started').length;

  // Calculate percentage
  const value = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const data = [
    { name: "Completed", value: value, color: "#10b981" }, // Emerald 500
    { name: "Remaining", value: 100 - value, color: "#f1f5f9" }, // Slate 100
  ];

  return (
    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 relative">
        <h3 className="text-lg font-bold text-slate-800">Overall progress</h3>
        
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            {filter === 'All' ? 'All Projects' : 'My Projects'}
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
              <button 
                onClick={() => { setFilter('All'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${filter === 'All' ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600 font-medium'}`}
              >
                All Projects
              </button>
              <button 
                onClick={() => { setFilter('My'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${filter === 'My' ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600 font-medium'}`}
              >
                My Projects
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center min-h-[160px]">
        <div className="w-full h-[180px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Decorative ticks background - roughly simulated */}
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius={85}
                outerRadius={105}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray="4 4"
                dataKey="value"
                isAnimationActive={false}
              />
              {/* Actual Progress */}
              <Pie
                data={data}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius={90}
                outerRadius={100}
                dataKey="value"
                stroke="none"
                cornerRadius={5}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Center Text */}
        <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="block text-3xl font-bold text-slate-800">{value}%</span>
          <span className="block text-xs font-medium text-slate-400 mt-1">Completed</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-auto pt-4 border-t border-slate-50">
        <div className="text-center">
          <span className="block text-lg font-bold text-slate-800">{totalProjects}</span>
          <span className="block text-[10px] font-medium text-slate-400">Total projects</span>
        </div>
        <div className="text-center">
          <span className="block text-lg font-bold text-emerald-500">{completedProjects}</span>
          <span className="block text-[10px] font-medium text-slate-400">Completed</span>
        </div>
        <div className="text-center">
          <span className="block text-lg font-bold text-amber-500">{delayedProjects}</span>
          <span className="block text-[10px] font-medium text-slate-400">Delayed</span>
        </div>
        <div className="text-center">
          <span className="block text-lg font-bold text-rose-500">{ongoingProjects}</span>
          <span className="block text-[10px] font-medium text-slate-400">On going</span>
        </div>
      </div>
    </div>
  );
}
