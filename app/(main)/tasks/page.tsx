"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, Search, Plus, Calendar, User, MoreHorizontal } from "lucide-react";
import { getAllTasks } from "@/services/taskService";
import { createClient } from "@/utils/supabase/client";
import type { TaskWithWorkstream } from "@/services/taskService";
import type { Profile } from "@/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithWorkstream[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await getAllTasks();
      
      // Fetch profiles mapping for owner names
      const supabase = createClient();
      const { data: profilesData } = await supabase.from("profiles").select("*");
      
      const profileMap: Record<string, Profile> = {};
      profilesData?.forEach((p) => {
        profileMap[p.id] = p;
      });

      setProfiles(profileMap);
      setTasks(tasksData || []);
      setLoading(false);
    };

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

  const columns = [
    { id: "To Do", title: "To Do", color: "bg-slate-200 text-slate-700" },
    { id: "In Progress", title: "In Progress", color: "bg-blue-100 text-blue-700" },
    { id: "Completed", title: "Completed", color: "bg-emerald-100 text-emerald-700" }
  ];

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[500px] flex flex-col h-full">
      <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="text-[var(--color-brand-orange)]" />
            Task Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Track operational progress and delivery streams.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-64 bg-slate-50 rounded-full py-2 pl-10 pr-4 text-sm text-slate-700 outline-none border border-slate-200 focus:border-[var(--color-brand-orange)] focus:ring-1 focus:ring-[var(--color-brand-orange)] transition"
            />
          </div>
          
          <button className="bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-semibold transition shadow-sm flex items-center gap-1">
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-orange)]"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto flex gap-6 pb-4">
          {columns.map(column => (
            <div key={column.id} className="flex-1 min-w-[300px] bg-slate-50 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{column.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${column.color}`}>
                    {tasks.filter(t => t.status === column.id).length}
                  </span>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {tasks.filter(t => t.status === column.id).map(task => {
                  const ownerName = getOwnerName(task.owner_id);
                  return (
                    <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-slate-300 transition cursor-pointer group">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                          task.progress === 100 ? "bg-emerald-50 text-emerald-600" 
                          : task.progress > 0 ? "bg-blue-50 text-blue-600" 
                          : "bg-slate-100 text-slate-500"
                        }`}>
                          {task.progress}% Done
                        </span>
                        <button className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      
                      <h4 className="font-bold text-slate-800 text-sm mb-3 leading-snug">{task.name}</h4>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium">
                          <Calendar size={14} />
                          {task.planned_end ? new Date(task.planned_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No Due Date'}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm" title={ownerName}>
                            {getInitials(ownerName)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {tasks.filter(t => t.status === column.id).length === 0 && (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                    <span className="text-sm text-slate-400 font-medium">No tasks</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
