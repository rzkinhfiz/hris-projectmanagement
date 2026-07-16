import React, { useState } from "react";
import type { TaskWithWorkstream } from "@/services/taskService";
import type { Profile, Project } from "@/types";

const statuses: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-600",
  "To do": "bg-slate-100 text-slate-600",
  Draft: "bg-slate-100 text-slate-600",
  "In progress": "bg-blue-100 text-blue-600",
  Started: "bg-blue-100 text-blue-600",
  Hold: "bg-amber-100 text-amber-600",
  "To review": "bg-purple-100 text-purple-600",
  Overdue: "bg-rose-100 text-rose-600",
  Canceled: "bg-slate-200 text-slate-700",
  Delayed: "bg-amber-100 text-amber-600",
  "At risk": "bg-rose-100 text-rose-600",
  "On going": "bg-orange-100 text-orange-600",
};

export interface SummaryProject {
  id: string;
  name: string;
  manager: string;
  date: string;
  status: string;
  progress: number;
}

export function ProjectSummaryTable({ projects, tasks, profiles }: { projects: Project[], tasks: TaskWithWorkstream[], profiles: Record<string, Profile> }) {
  const [managerFilter, setManagerFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const summaryProjects: SummaryProject[] = projects.map(p => {
    const projectTasks = tasks.filter(t => t.project_id === p.id);
    const completedProjectTasks = projectTasks.filter(t => t.status === 'DONE').length;
    const progress = projectTasks.length > 0 ? Math.round((completedProjectTasks / projectTasks.length) * 100) : 0;
    
    return {
      id: p.id,
      name: p.name,
      manager: p.pm_id && profiles[p.pm_id] ? profiles[p.pm_id].full_name || 'Unknown' : 'Unknown',
      date: p.end_date ? new Date(p.end_date).toLocaleDateString() : 'No date',
      status: p.status,
      progress
    };
  });

  const managers = Array.from(new Set(summaryProjects.map(p => p.manager)));
  const availableStatuses = Array.from(new Set(summaryProjects.map(p => p.status)));

  const filteredProjects = summaryProjects.filter(p => {
    if (managerFilter !== "All" && p.manager !== managerFilter) return false;
    if (statusFilter !== "All" && p.status !== statusFilter) return false;
    return true;
  });

  const renderProgressRing = (progress: number) => {
    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="transform -rotate-90 w-8 h-8">
            <circle
              cx="16"
              cy="16"
              r={radius}
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-slate-100"
            />
            <circle
              cx="16"
              cy="16"
              r={radius}
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${progress === 100 ? 'text-emerald-500' : 'text-blue-500'}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[9px] font-bold text-slate-700">{progress}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800">Project summary</h2>
        <div className="flex gap-2 relative">
          
          <div className="relative">
            <button 
              onClick={() => setIsManagerDropdownOpen(!isManagerDropdownOpen)}
              className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Manager: {managerFilter === "All" ? "All" : managerFilter}
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isManagerDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <button 
                  onClick={() => { setManagerFilter("All"); setIsManagerDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${managerFilter === "All" ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600'}`}
                >
                  All Managers
                </button>
                {managers.map(m => (
                  <button 
                    key={m}
                    onClick={() => { setManagerFilter(m); setIsManagerDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${managerFilter === m ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Status: {statusFilter === "All" ? "All" : statusFilter}
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isStatusDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <button 
                  onClick={() => { setStatusFilter("All"); setIsStatusDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === "All" ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600'}`}
                >
                  All Statuses
                </button>
                {availableStatuses.map(s => (
                  <button 
                    key={s}
                    onClick={() => { setStatusFilter(s); setIsStatusDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === s ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 bg-slate-50/50 uppercase rounded-xl">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-l-xl">Name</th>
              <th className="px-4 py-3 font-semibold">Project manager</th>
              <th className="px-4 py-3 font-semibold">Due date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold rounded-r-xl">Progress</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No projects match your filters.
                </td>
              </tr>
            ) : (
              filteredProjects.slice(0, 5).map((project, idx) => (
                <tr key={idx} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 text-sm text-slate-700 font-semibold">{project.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-medium">{project.manager}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-medium">{project.date}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${statuses[project.status as keyof typeof statuses] || 'bg-slate-100 text-slate-600'}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {renderProgressRing(project.progress)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
