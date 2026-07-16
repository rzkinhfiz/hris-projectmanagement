"use client";

import React, { useState } from "react";
import type { TaskWithWorkstream } from "@/services/taskService";
import type { Profile } from "@/types";

export function ProjectsWorkload({ tasks, profiles }: { tasks: TaskWithWorkstream[], profiles: Record<string, Profile> }) {
  const [timeFilter, setTimeFilter] = useState<'1month' | '3months' | 'all'>('3months');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getFilteredDate = () => {
    const d = new Date();
    if (timeFilter === '1month') d.setMonth(d.getMonth() - 1);
    else if (timeFilter === '3months') d.setMonth(d.getMonth() - 3);
    else return new Date(0); // All time
    return d;
  };

  const filterDate = getFilteredDate();
  const filteredTasks = tasks.filter(t => new Date(t.created_at) >= filterDate);

  const workloadMap: Record<string, number> = {};
  filteredTasks.forEach(t => {
    if (t.owner_id && profiles[t.owner_id]) {
      const name = profiles[t.owner_id].full_name || 'Unknown';
      const shortName = name.split(' ')[0];
      workloadMap[shortName] = (workloadMap[shortName] || 0) + 1;
    }
  });
  
  let members: { name: string; count: number; height: number; isPeak?: boolean }[] = Object.keys(workloadMap).map(name => ({
    name,
    count: workloadMap[name],
    height: Math.min(20 + (workloadMap[name] * 5), 100)
  }));
  
  if (members.length > 0) {
    const maxCount = Math.max(...members.map(m => m.count));
    members = members.map(m => ({
      ...m,
      isPeak: m.count === maxCount
    }));
  }
  
  members.sort((a, b) => b.count - a.count);
  members = members.slice(0, 7);

  return (
    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8 relative">
        <h3 className="text-lg font-bold text-slate-800">Projects Workload</h3>
        
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            {timeFilter === '1month' ? 'Last 1 month' : timeFilter === '3months' ? 'Last 3 months' : 'All Time'}
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
              <button 
                onClick={() => { setTimeFilter('1month'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${timeFilter === '1month' ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600 font-medium'}`}
              >
                Last 1 month
              </button>
              <button 
                onClick={() => { setTimeFilter('3months'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${timeFilter === '3months' ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600 font-medium'}`}
              >
                Last 3 months
              </button>
              <button 
                onClick={() => { setTimeFilter('all'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${timeFilter === 'all' ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600 font-medium'}`}
              >
                All Time
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between px-2 pt-10 pb-4 relative">
        {/* Helper line at bottom */}
        <div className="absolute bottom-10 left-0 right-0 h-px bg-slate-100" />
        
        {members.map((member, idx) => (
          <div key={idx} className="flex flex-col items-center z-10">
            <div className="relative flex flex-col items-center justify-end h-[100px] mb-2">
              {/* Stacked outline circles below the main one for visual effect */}
              {member.count > 4 && (
                <>
                  <div className="w-4 h-4 rounded-full border border-slate-300 absolute -bottom-1" />
                  <div className="w-4 h-4 rounded-full border border-slate-300 absolute bottom-3" />
                  <div className="w-4 h-4 rounded-full border border-slate-300 absolute bottom-7" />
                </>
              )}
              {member.count > 7 && (
                <>
                  <div className="w-4 h-4 rounded-full border border-slate-300 absolute bottom-11" />
                </>
              )}
              
              {/* The main solid circle representing the count */}
              <div 
                className={`flex items-center justify-center rounded-full text-[10px] font-bold text-white z-20 ${
                  member.isPeak ? 'bg-[var(--color-brand-orange)] w-8 h-8 -mt-8' : 'bg-slate-900 w-7 h-7 -mt-7'
                }`}
                style={{ marginBottom: `${member.height}px` }}
              >
                {member.count < 10 ? `0${member.count}` : member.count}
              </div>
              
              {/* Vertical connecting line */}
              <div 
                className="w-px bg-slate-200 absolute bottom-0 z-0" 
                style={{ height: `${member.height}px` }} 
              />
            </div>
            
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              {member.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
