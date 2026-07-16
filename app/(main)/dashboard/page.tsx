"use client";

import React, { useEffect, useState } from "react";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { ProjectSummaryTable } from "@/components/dashboard/ProjectSummaryTable";
import { OverallProgress } from "@/components/dashboard/OverallProgress";
import { ProjectsWorkload } from "@/components/dashboard/ProjectsWorkload";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import { getProjects } from "@/services/projectService";
import { getAllTasks } from "@/services/taskService";
import type { TaskWithWorkstream } from "@/services/taskService";
import type { Profile, Project } from "@/types";
import { Check } from "lucide-react";

export default function DashboardPage() {
  const { profile: currentUser } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskWithWorkstream[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      
      setLoading(true);
      
      // Fetch projects
      const { data: projectsData } = await getProjects(currentUser.id, currentUser.role as string);
      
      // Fetch tasks
      const { data: tasksData } = await getAllTasks();
      
      // Fetch profiles
      const supabase = createClient();
      const { data: profilesData } = await supabase.from('profiles').select('*');
      
      const profileMap: Record<string, Profile> = {};
      if (profilesData) {
        profilesData.forEach(p => { profileMap[p.id] = p; });
      }
      
      setProjects(projectsData || []);
      setTasks(tasksData || []);
      setProfiles(profileMap);
      setLoading(false);
    }
    
    fetchData();
  }, [currentUser]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading Dashboard Data...</div>;
  }

  // --- Calculate Metrics for OverviewCards ---
  const totalProjectValue = projects.reduce((sum, p) => sum + (p.contract_value_excl_tax || 0), 0);
  const totalProjects = projects.length;
  // Calculate total actual hours from tasks (or we could use estimated_hours)
  const totalHoursSpent = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);
  const totalResources = Object.keys(profiles).length;

  // --- Calculate Metrics for OverallProgress ---
  const completedTasksCount = tasks.filter(t => t.status === 'DONE').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const ongoingProjects = projects.filter(p => p.status === 'In progress' || p.status === 'Started').length;
  const delayedProjects = projects.filter(p => p.status === 'Overdue' || p.status === 'Hold').length;

  // --- Calculate Metrics for Today Task ---
  // Tasks assigned to current user, not DONE
  const myTasks = tasks.filter(t => t.owner_id === currentUser?.id && t.status !== 'DONE').slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <OverviewCards projects={projects} tasks={tasks} profiles={profiles} />
      
      <div className="grid grid-cols-12 gap-6 h-auto">
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
          <ProjectSummaryTable projects={projects} tasks={tasks} profiles={profiles} />
          
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex-1">
             <div className="flex items-center gap-6 mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800">My Tasks</h3>
                <div className="flex gap-4">
                  <span className="text-sm font-medium text-slate-400">Total <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs ml-1">{myTasks.length}</span></span>
                </div>
             </div>
             
             {myTasks.length === 0 ? (
               <div className="text-sm text-slate-500 py-4 text-center">No pending tasks assigned to you.</div>
             ) : (
               <ul className="space-y-4">
                  {myTasks.map((task) => {
                    const isDraftOrBacklog = task.status === 'DRAFT' || task.status === 'BACKLOG';
                    const isReview = task.status === 'REVIEW';
                    
                    let statusColor = "bg-sky-100 text-sky-700";
                    let checkBg = "border border-slate-300 text-transparent";
                    
                    if (isDraftOrBacklog) {
                      statusColor = "bg-slate-100 text-slate-600";
                    } else if (isReview) {
                      statusColor = "bg-purple-100 text-purple-700";
                      checkBg = "bg-[var(--color-brand-orange)] text-white";
                    } else if (task.status === 'IN_PROGRESS') {
                      statusColor = "bg-amber-100 text-amber-700";
                    }
                    
                    return (
                      <li key={task.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${checkBg}`}>
                             <Check size={12} strokeWidth={3} />
                          </div>
                          <span className="text-sm text-slate-600 font-medium max-w-sm truncate" title={task.name}>{task.name}</span>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${statusColor}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </li>
                    )
                  })}
               </ul>
             )}
          </div>
        </div>
        
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          <div className="h-[320px]">
             <OverallProgress 
               projects={projects}
               tasks={tasks}
               currentUserId={currentUser?.id || ''}
             />
          </div>
          <div className="h-[320px]">
             <ProjectsWorkload tasks={tasks} profiles={profiles} />
          </div>
        </div>
      </div>
    </div>
  );
}
