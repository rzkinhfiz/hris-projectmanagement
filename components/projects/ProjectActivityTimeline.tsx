"use client";

import React, { useEffect, useState, useMemo } from "react";
import type { ProjectActivityLog } from "@/types";
import { getProjectActivityLogs } from "@/services/auditService";
import { Loader2, PlusCircle, PencilLine, Trash2, ArrowRight, Search, Filter, CheckCircle } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import { formatDistanceToNow, format } from "date-fns";

interface Props {
  projectId: string;
}

export function ProjectActivityTimeline({ projectId }: Props) {
  const [logs, setLogs] = useState<ProjectActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await getProjectActivityLogs(projectId);
    setLogs(data || []);
    setLoading(false);
  };

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search || 
        (log.item_label?.toLowerCase().includes(searchLower)) || 
        (log.actor?.full_name?.toLowerCase().includes(searchLower));

      const matchesAction = actionFilter === "ALL" || log.action_type === actionFilter;
      const matchesModule = moduleFilter === "ALL" || log.module === moduleFilter;

      return matchesSearch && matchesAction && matchesModule;
    });
  }, [logs, search, actionFilter, moduleFilter]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  if (logs.length === 0) {
    return (
      <div className="bg-[#fcfbfa] p-12 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
        <p className="text-slate-500 font-medium">No activity recorded yet.</p>
      </div>
    );
  }

  const renderDiff = (oldData: any, newData: any) => {
    if (!oldData || !newData) return null;
    const keys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
    
    return (
      <div className="mt-4 space-y-2">
        {keys.map((key) => {
          const oldVal = oldData[key];
          const newVal = newData[key];
          if (oldVal === newVal) return null;
          
          return (
            <div key={key} className="flex flex-wrap items-center gap-2 text-sm bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
              <span className="font-semibold text-slate-600 capitalize shrink-0 min-w-[120px]">{key.replace(/_/g, ' ')}:</span>
              {oldVal !== undefined && (
                <span className="text-slate-400 line-through truncate max-w-[200px]" title={String(oldVal)}>
                  {String(oldVal)}
                </span>
              )}
              {oldVal !== undefined && newVal !== undefined && <ArrowRight size={14} className="text-slate-300 shrink-0 mx-1" />}
              {newVal !== undefined && (
                <span className="font-bold text-amber-600 truncate max-w-[200px]" title={String(newVal)}>
                  {String(newVal)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-[#fcfbfa] p-8 rounded-[2rem] shadow-sm border border-slate-100 min-h-full">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Project Activity Log</h3>
      
      {/* Interactive Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 fade-in">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari kata kunci log atau nama pengguna..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#fcfbfa] border border-stone-200 rounded-xl text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-50 outline-none transition"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select 
              value={actionFilter} 
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-4 pr-10 py-2.5 bg-[#fcfbfa] border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-50 outline-none transition cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVE">Approve</option>
            </select>
            <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={moduleFilter} 
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-4 pr-10 py-2.5 bg-[#fcfbfa] border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-50 outline-none transition cursor-pointer"
            >
              <option value="ALL">All Modules</option>
              <option value="PROJECTS">Projects</option>
              <option value="RESOURCE_LOAD">Resource Load</option>
              <option value="TIME_LOG">Time Log</option>
              <option value="TASKS">Tasks</option>
            </select>
            <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-6 space-y-8 pb-4">
        {filteredLogs.length === 0 ? (
          <div className="pl-6 py-8">
            <p className="text-slate-500 font-medium">Tidak ada aktivitas yang sesuai dengan filter.</p>
          </div>
        ) : filteredLogs.map((log) => {
          const isCreate = log.action_type === 'CREATE';
          const isUpdate = log.action_type === 'UPDATE';
          const isDelete = log.action_type === 'DELETE';
          const isApprove = log.action_type === 'APPROVE';
          
          return (
            <div key={log.id} className="relative pl-8 fade-in">
              {/* Timeline Marker */}
              <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center border-4 border-[#fcfbfa] ${
                isCreate ? 'bg-emerald-500' : isUpdate ? 'bg-amber-500' : isDelete ? 'bg-rose-500' : isApprove ? 'bg-blue-500' : 'bg-stone-500'
              }`}>
                {isCreate && <PlusCircle size={10} className="text-white" />}
                {isUpdate && <PencilLine size={10} className="text-white" />}
                {isDelete && <Trash2 size={10} className="text-white" />}
                {isApprove && <CheckCircle size={10} className="text-white" />}
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    {log.actor?.avatar_url ? (
                       <img src={log.actor.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                    ) : (
                       <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                         {log.actor?.full_name?.charAt(0) || '?'}
                       </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${log.actor?.status === 'INACTIVE' ? 'text-slate-500' : 'text-slate-800'}`}>
                          {log.actor?.full_name || 'Unknown User'}
                          {log.actor?.status === 'INACTIVE' && <span className="ml-1 text-xs font-semibold text-slate-400">(Inactive)</span>}
                        </span>
                        {log.actor?.role && <RoleBadge role={log.actor.role} />}
                      </div>
                      <p 
                        className="text-xs text-stone-400 font-medium mt-0.5 cursor-help border-b border-dashed border-stone-300 inline-block"
                        title={format(new Date(log.created_at), "dd MMM yyyy, HH:mm:ss 'WIB'")}
                      >
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                      isCreate ? 'bg-emerald-100 text-emerald-700' :
                      isUpdate ? 'bg-amber-100 text-amber-700' :
                      isDelete ? 'bg-rose-100 text-rose-700' :
                      isApprove ? 'bg-blue-100 text-blue-700' :
                      'bg-stone-100 text-stone-700'
                    }`}>
                      {log.action_type}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    <span className="font-bold uppercase text-slate-500 mr-2 tracking-wider text-xs">[{log.module.replace(/_/g, ' ')}]</span>
                    {log.item_label}
                  </p>
                  
                  {isUpdate && renderDiff(log.old_data, log.new_data)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
