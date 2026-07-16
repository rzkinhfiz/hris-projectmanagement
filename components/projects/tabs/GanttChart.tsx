'use client';

import React, { useState, useMemo } from 'react';
import type { Profile } from '@/types';
import type { TaskWithWorkstream } from '@/services/taskService';
import { Flag, Clock, User, ChevronRight } from 'lucide-react';
import { 
  startOfDay, endOfDay, differenceInDays, addDays, format, 
  isAfter, isBefore, max, min, addWeeks, startOfWeek,
  differenceInWeeks, addMonths, startOfMonth, differenceInMonths
} from 'date-fns';

interface GanttChartProps {
  tasks: TaskWithWorkstream[];
  profiles: Record<string, Profile>;
  canEditDates: boolean;
  onTaskClick?: (task: TaskWithWorkstream) => void;
}

type TimeScale = 'days' | 'weeks' | 'months';

export function GanttChart({ tasks, profiles, canEditDates, onTaskClick }: GanttChartProps) {
  const [scale, setScale] = useState<TimeScale>('days');

  // Calculate timeline bounds
  const { startDate, endDate, dateHeaders, cellWidth } = useMemo(() => {
    if (tasks.length === 0) {
      const today = startOfDay(new Date());
      return { 
        startDate: today, 
        endDate: addDays(today, 30), 
        dateHeaders: [], 
        cellWidth: 40 
      };
    }

    const startDates = tasks.map(t => t.planned_start ? startOfDay(new Date(t.planned_start)) : startOfDay(new Date()));
    const endDates = tasks.map(t => t.planned_end ? endOfDay(new Date(t.planned_end)) : endOfDay(new Date()));

    // Pad dates
    let minDate = min(startDates);
    let maxDate = max(endDates);
    
    // Add 10% padding
    const totalDiffDays = Math.max(14, differenceInDays(maxDate, minDate));
    minDate = addDays(minDate, -Math.floor(totalDiffDays * 0.1));
    maxDate = addDays(maxDate, Math.floor(totalDiffDays * 0.1));

    const headers: { label: string; date: Date }[] = [];
    let cw = 40; // cell width in px

    if (scale === 'days') {
      cw = 40;
      let curr = minDate;
      while (curr <= maxDate) {
        headers.push({ label: format(curr, 'd/M'), date: curr });
        curr = addDays(curr, 1);
      }
    } else if (scale === 'weeks') {
      cw = 80;
      minDate = startOfWeek(minDate);
      let curr = minDate;
      while (curr <= maxDate) {
        headers.push({ label: `W${format(curr, 'w')}`, date: curr });
        curr = addWeeks(curr, 1);
      }
    } else if (scale === 'months') {
      cw = 120;
      minDate = startOfMonth(minDate);
      let curr = minDate;
      while (curr <= maxDate) {
        headers.push({ label: format(curr, 'MMM yyyy'), date: curr });
        curr = addMonths(curr, 1);
      }
    }

    return { startDate: minDate, endDate: maxDate, dateHeaders: headers, cellWidth: cw };
  }, [tasks, scale]);

  const getTaskBounds = (task: TaskWithWorkstream) => {
    const tStart = task.planned_start ? startOfDay(new Date(task.planned_start)) : startOfDay(new Date());
    const tEnd = task.planned_end ? endOfDay(new Date(task.planned_end)) : endOfDay(new Date());
    
    let offsetCells = 0;
    let durationCells = 0;

    if (scale === 'days') {
      offsetCells = differenceInDays(tStart, startDate);
      durationCells = Math.max(1, differenceInDays(tEnd, tStart) + 1);
    } else if (scale === 'weeks') {
      offsetCells = differenceInDays(tStart, startDate) / 7;
      durationCells = Math.max(1, differenceInDays(tEnd, tStart) / 7);
    } else if (scale === 'months') {
      offsetCells = differenceInDays(tStart, startDate) / 30; // Approximation for rendering
      durationCells = Math.max(1, differenceInDays(tEnd, tStart) / 30);
    }

    return { 
      left: offsetCells * cellWidth, 
      width: durationCells * cellWidth 
    };
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

  const getStatusColor = (task: TaskWithWorkstream) => {
    const isOverdue = task.planned_end && 
                      isBefore(new Date(task.planned_end), new Date()) && 
                      task.progress < 100 &&
                      task.status !== 'Completed';

    if (isOverdue) return { bg: 'bg-red-500', border: 'border-red-600', fill: 'bg-red-700' };
    if (task.status === 'Completed') return { bg: 'bg-emerald-500', border: 'border-emerald-600', fill: 'bg-emerald-700' };
    
    // In Progress / To Do
    return { bg: 'bg-[var(--color-brand-orange)]', border: 'border-orange-600', fill: 'bg-orange-700' };
  };

  const handleTaskClick = (task: TaskWithWorkstream) => {
    if (canEditDates && onTaskClick) {
      onTaskClick(task);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Clock size={16} className="text-[var(--color-brand-orange)]" />
          Timeline Visualization
        </h3>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button onClick={() => setScale('days')} className={`px-3 py-1 rounded-md text-xs font-semibold transition ${scale === 'days' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Days</button>
          <button onClick={() => setScale('weeks')} className={`px-3 py-1 rounded-md text-xs font-semibold transition ${scale === 'weeks' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Weeks</button>
          <button onClick={() => setScale('months')} className={`px-3 py-1 rounded-md text-xs font-semibold transition ${scale === 'months' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Months</button>
        </div>
      </div>

      <div className="flex relative overflow-hidden" style={{ height: '500px' }}>
        {/* Left Pane (Sticky Columns) */}
        <div className="w-72 flex-shrink-0 bg-white z-20 border-r border-slate-200 flex flex-col shadow-[4px_0_15px_rgba(0,0,0,0.03)] relative">
          <div className="h-12 flex-shrink-0 border-b border-slate-200 bg-slate-50/80 flex items-center px-4 font-bold text-[11px] text-slate-500 uppercase tracking-wider">
            <div className="flex-1">Task</div>
            <div className="w-16">Assignee</div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar" id="gantt-left-pane">
            {tasks.map(task => (
              <div key={task.id} className="h-14 border-b border-slate-100 flex items-center px-4 hover:bg-slate-50 transition group">
                <div className="flex-1 truncate pr-2 flex flex-col justify-center">
                  <div className="font-semibold text-sm text-slate-800 truncate">{task.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.is_milestone && <Flag size={10} className="text-purple-500 ml-1" />}
                  </div>
                </div>
                <div className="w-8 flex-shrink-0 flex justify-center">
                  {task.owner_id && profiles[task.owner_id] ? (
                    <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600" title={profiles[task.owner_id as string].full_name}>
                      {profiles[task.owner_id as string].full_name.slice(0, 2).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <User size={12} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane (Grid) */}
        <div 
          className="flex-1 overflow-auto bg-slate-50/30 custom-scrollbar relative"
          onScroll={(e) => {
            const leftPane = document.getElementById('gantt-left-pane');
            if (leftPane) leftPane.scrollTop = e.currentTarget.scrollTop;
          }}
        >
          <div style={{ width: `${dateHeaders.length * cellWidth}px`, minWidth: '100%' }}>
            {/* Header Row */}
            <div className="h-12 border-b border-slate-200 flex bg-white sticky top-0 z-10">
              {dateHeaders.map((h, i) => (
                <div key={i} className="flex-shrink-0 border-r border-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-500" style={{ width: `${cellWidth}px` }}>
                  {h.label}
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="relative" style={{ height: `${tasks.length * 56}px` }}>
              {/* Vertical Grid Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {dateHeaders.map((h, i) => (
                  <div key={i} className="flex-shrink-0 border-r border-slate-100/70" style={{ width: `${cellWidth}px` }}></div>
                ))}
              </div>

              {/* Task Rows */}
              {tasks.map((task, idx) => {
                const bounds = getTaskBounds(task);
                const colors = getStatusColor(task);
                
                return (
                  <div key={task.id} className="h-14 absolute w-full border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors" style={{ top: `${idx * 56}px` }}>
                    {/* Task Bar */}
                    <div 
                      className={`absolute top-2.5 h-9 rounded-lg shadow-sm border ${colors.border} ${colors.bg} cursor-pointer group/bar`}
                      style={{ 
                        left: `${bounds.left}px`, 
                        width: task.is_milestone ? '36px' : `${Math.max(bounds.width, 20)}px`,
                        transform: task.is_milestone ? 'translateX(-18px)' : 'none'
                      }}
                      onClick={() => handleTaskClick(task)}
                    >
                      {task.is_milestone ? (
                        <div className="w-full h-full flex items-center justify-center bg-purple-500 border border-purple-600 rounded shadow-md transform rotate-45 scale-75">
                          <Flag size={14} className="text-white transform -rotate-45" />
                        </div>
                      ) : (
                        <>
                          {/* Inner Progress Fill */}
                          <div 
                            className={`absolute top-0 left-0 bottom-0 ${colors.fill} rounded-l-lg opacity-80`}
                            style={{ width: `${task.progress}%`, borderTopRightRadius: task.progress === 100 ? '0.5rem' : '0', borderBottomRightRadius: task.progress === 100 ? '0.5rem' : '0' }}
                          />
                          <div className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-white z-10 truncate drop-shadow-md pointer-events-none">
                            {task.progress}%
                          </div>
                        </>
                      )}

                      {/* Hover Tooltip (Popover) */}
                      <div className="absolute opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-white p-3 rounded-xl shadow-2xl border border-slate-700">
                        <div className="font-bold text-sm mb-1 truncate">{task.name}</div>
                        <div className="text-[10px] text-slate-300 mb-2">{task.owner_id ? profiles[task.owner_id]?.full_name : 'Unassigned'}</div>
                        <div className="flex flex-col gap-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Time:</span>
                            <span className="font-medium">{task.planned_start ? format(new Date(task.planned_start), 'd MMM') : '-'} — {task.planned_end ? format(new Date(task.planned_end), 'd MMM') : '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Hours:</span>
                            <span className="font-medium">⏳ {task.actual_hours}h / {task.estimated_hours}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Progress:</span>
                            <span className="font-medium">{task.progress}%</span>
                          </div>
                        </div>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 transform rotate-45 border-r border-b border-slate-700"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for custom scrollbar hiding */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
