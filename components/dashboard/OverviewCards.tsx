import { useState } from "react";
import { BarChart3, Briefcase, Clock, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { TaskWithWorkstream } from "@/services/taskService";
import type { Profile, Project } from "@/types";

export interface OverviewCardsProps {
  projects: Project[];
  tasks: TaskWithWorkstream[];
  profiles: Record<string, Profile>;
}

export function OverviewCards({ projects, tasks, profiles }: OverviewCardsProps) {
  const [timeFilter, setTimeFilter] = useState<'30days' | '3months' | 'all'>('30days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getFilteredDate = () => {
    const d = new Date();
    if (timeFilter === '30days') d.setDate(d.getDate() - 30);
    else if (timeFilter === '3months') d.setMonth(d.getMonth() - 3);
    else return new Date(0); // All time
    return d;
  };

  const filterDate = getFilteredDate();

  // Filter logic
  const filteredProjects = projects.filter(p => new Date(p.created_at) >= filterDate);
  const filteredTasks = tasks.filter(t => new Date(t.created_at) >= filterDate);
  // profiles don't really get filtered by time for "total team members" unless we want active ones, but let's just show total.

  const totalProjectValue = filteredProjects.reduce((sum, p) => sum + (p.contract_value_excl_tax || 0), 0);
  const totalProjects = filteredProjects.length;
  const totalHoursSpent = filteredTasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);
  const totalResources = Object.keys(profiles).length;

  // Format currency
  const formattedValue = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalProjectValue || 0);

  const cards = [
    {
      id: "revenue",
      title: "Total Project Value",
      value: formattedValue,
      trend: "Current total value",
      isPositive: true,
      icon: <BarChart3 size={20} className="text-purple-500" />,
      iconBg: "bg-purple-100",
    },
    {
      id: "projects",
      title: "Projects",
      value: totalProjects.toString(),
      trend: "Active projects",
      isPositive: true,
      icon: <Briefcase size={20} className="text-orange-500" />,
      iconBg: "bg-orange-100",
    },
    {
      id: "time",
      title: "Time spent",
      value: totalHoursSpent.toString(),
      suffix: "Hrs",
      trend: "Total logged hours",
      isPositive: true,
      icon: <Clock size={20} className="text-blue-500" />,
      iconBg: "bg-blue-100",
    },
    {
      id: "resources",
      title: "Resources",
      value: totalResources.toString(),
      trend: "Total team members",
      isPositive: true,
      icon: <Users size={20} className="text-amber-500" />,
      iconBg: "bg-amber-100",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Overview</h2>
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            {timeFilter === '30days' ? 'Last 30 days' : timeFilter === '3months' ? 'Last 3 months' : 'All Time'}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
              <button 
                onClick={() => { setTimeFilter('30days'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${timeFilter === '30days' ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600 font-medium'}`}
              >
                Last 30 days
              </button>
              <button 
                onClick={() => { setTimeFilter('3months'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${timeFilter === '3months' ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600 font-medium'}`}
              >
                Last 3 months
              </button>
              <button 
                onClick={() => { setTimeFilter('all'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${timeFilter === 'all' ? 'text-slate-900 font-bold bg-slate-50/50' : 'text-slate-600 font-medium'}`}
              >
                All Time
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${card.iconBg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">{card.title}</p>
              <div className="flex items-baseline gap-1 mb-3">
                <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
                {card.suffix && <span className="text-sm font-semibold text-slate-500">{card.suffix}</span>}
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${card.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                 {card.isPositive ? <ArrowUpRight size={14} strokeWidth={2.5} /> : <ArrowDownRight size={14} strokeWidth={2.5} />}
                 <span className="font-semibold">{card.trend.split(' ')[0]}</span>
                 <span className="text-slate-500">{card.trend.split(' ').slice(1).join(' ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
