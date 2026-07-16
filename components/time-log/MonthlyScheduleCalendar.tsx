"use client";

import React, { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAssignedTasksForDateRange } from "@/services/timeLogService";
import { TooltipNote } from "@/components/TooltipNote";

interface Task {
  id: string;
  name: string;
  project_id: string;
  planned_start: string;
  planned_end: string;
  estimated_hours: number;
  projects?: { name: string };
}

interface Props {
  onTaskClick: (task: Task) => void;
}

export function MonthlyScheduleCalendar({ onTaskClick }: Props) {
  const { profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (profile) {
      fetchTasks();
    }
  }, [profile, currentMonth]);

  const fetchTasks = async () => {
    if (!profile) return;
    setLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    // the service handles formatting to yyyy-MM-dd
    const { data } = await getAssignedTasksForDateRange(profile.id, start, end);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTasks((data || []) as any[]);
    setLoading(false);
  };

  const getPastelColor = (projectId: string) => {
    const colors = [
      "bg-amber-100 text-amber-900 border-amber-200",
      "bg-orange-100 text-orange-900 border-orange-200",
      "bg-emerald-100 text-emerald-900 border-emerald-200",
      "bg-rose-100 text-rose-900 border-rose-200",
      "bg-yellow-100 text-yellow-900 border-yellow-200",
      "bg-slate-100 text-slate-800 border-slate-200"
    ];
    if (!projectId) return colors[0];
    const charCode = projectId.charCodeAt(projectId.length - 1);
    return colors[charCode % colors.length];
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Calendar grid math
  const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-[#fcfbfa] border border-slate-200 rounded-3xl p-6 shadow-sm mt-8 relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          📅 Monthly Deadline & Schedule Tracker
        </h3>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={prevMonth}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-slate-700 min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button 
            onClick={nextMonth}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
        {weekDayNames.map(dayName => (
          <div key={dayName} className="bg-slate-50 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {dayName}
          </div>
        ))}
        
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const dayStr = format(day, 'yyyy-MM-dd');
          
          // Find tasks that overlap with this day
          const dayTasks = tasks.filter(t => {
            const startStr = t.planned_start?.slice(0, 10);
            const endStr = t.planned_end?.slice(0, 10);
            return startStr <= dayStr && endStr >= dayStr;
          });

          return (
            <div 
              key={idx} 
              className={`min-h-[120px] p-2 bg-white ${isCurrentMonth ? '' : 'bg-slate-50/50 opacity-60'} transition-colors relative flex flex-col gap-1`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'bg-[var(--color-brand-orange)] text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-600'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto max-h-[140px] custom-scrollbar pr-1">
                {dayTasks.map(task => {
                  const endStr = task.planned_end?.slice(0, 10);
                  const isDeadline = endStr === dayStr;
                  const colorClass = getPastelColor(task.project_id);
                  
                  return (
                    <div 
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`
                        relative px-2 py-1.5 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between gap-1
                        ${colorClass}
                      `}
                    >
                      <div className="font-bold truncate" title={task.name}>
                        {task.name}
                      </div>
                      {isDeadline && (
                         <TooltipNote content="Batas waktu akhir (due date) untuk tugas ini" position="top">
                           <span className="text-[10px] bg-white rounded-full shadow-sm px-1 py-0.5 flex-shrink-0">
                             🚩
                           </span>
                         </TooltipNote>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-3xl z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-orange)]"></div>
        </div>
      )}
    </div>
  );
}
