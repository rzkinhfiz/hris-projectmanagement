"use client";

import React from "react";

export function ProjectsWorkload() {
  // Mock data for the bubble chart
  const members = [
    { name: "Sam", count: 7, height: 40 },
    { name: "Meldy", count: 8, height: 60 },
    { name: "Ken", count: 10, height: 80, isPeak: true },
    { name: "Dmitry", count: 2, height: 20 },
    { name: "Vego", count: 8, height: 60 },
    { name: "Kadin", count: 2, height: 20 },
    { name: "Melm", count: 4, height: 35 },
  ];

  return (
    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-slate-800">Projects Workload</h3>
        <button className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition">
          Last 3 months
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
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
