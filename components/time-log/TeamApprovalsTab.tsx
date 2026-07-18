"use client";

import React, { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { Clock, Check, X, Search, Filter, RefreshCcw, ChevronDown, ChevronRight, ChevronLeft, AlertTriangle, ShieldAlert } from "lucide-react";
import { getTeamTimeLogs, approveOrRejectTimeLog, requestTimeLogRevision } from "@/services/timeLogService";
import { RoleBadge } from "@/components/RoleBadge";
import { ExecutiveOverrideModal } from "./ExecutiveOverrideModal";
import type { TimeLog, TimeLogStatus, TeamTimeLogFilters } from "@/types";

interface TeamApprovalsTabProps {
  profile: any;
}

export function TeamApprovalsTab({ profile }: TeamApprovalsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ACTION" | "HISTORY">("ACTION");
  
  // Data State
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [useDateFilter, setUseDateFilter] = useState(false);

  // Expanded Rows State
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Modals State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionProposedHours, setRevisionProposedHours] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideLogId, setOverrideLogId] = useState<string | null>(null);
  const [overrideTaskId, setOverrideTaskId] = useState<string | null>(null);
  const [overrideProjectName, setOverrideProjectName] = useState("");
  const [overridePmName, setOverridePmName] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const fetchLogs = async () => {
    if (!profile) return;
    setLoading(true);
    
    let statusFilter: TimeLogStatus[] = [];
    if (activeSubTab === "ACTION") {
      statusFilter = ['SUBMITTED', 'REVISION_REQUESTED'];
    } else {
      statusFilter = ['APPROVED', 'REJECTED'];
    }

    const filters: TeamTimeLogFilters = {
      status: statusFilter,
      userId: selectedUserId || undefined,
      projectId: selectedProjectId || undefined,
    };

    if (useDateFilter) {
      filters.startDate = format(currentWeekStart, 'yyyy-MM-dd');
      filters.endDate = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    }

    const { data } = await getTeamTimeLogs(profile.id, profile.role, filters);
    setLogs(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [profile, activeSubTab, selectedUserId, selectedProjectId, currentWeekStart, useDateFilter]);

  const handleApproveClick = (log: TimeLog) => {
    // Check if executive override is needed
    if ((profile?.role === 'pmo' || profile?.role === 'administrator') && log.project?.pm_id !== profile.id) {
      const pmName = allUsers.find(u => u.id === log.project?.pm_id)?.name || "Unknown PM";
      setOverrideProjectName(log.project?.name || "Unknown Project");
      setOverridePmName(pmName);
      setOverrideLogId(log.id);
      setOverrideTaskId(log.task_id);
      setOverrideModalOpen(true);
    } else {
      executeApprove(log.id, log.task_id);
    }
  };

  const executeApprove = async (logId: string, taskId: string) => {
    setIsApproving(true);
    const { error } = await approveOrRejectTimeLog(logId, 'APPROVED', null, taskId, {
      id: profile.id,
      name: profile.full_name,
      role: profile.role
    });
    setIsApproving(false);
    if (!error) {
      setOverrideModalOpen(false);
      fetchLogs();
    } else {
      alert(`Failed to approve: ${error.message || JSON.stringify(error)}`);
    }
  };

  const handleReject = async () => {
    if (!selectedLogId || !selectedTaskId || !rejectReason) return;
    const { error } = await approveOrRejectTimeLog(selectedLogId, 'REJECTED', rejectReason, selectedTaskId);
    if (!error) {
      setRejectModalOpen(false);
      setRejectReason("");
      fetchLogs();
    } else {
      alert("Failed to reject");
    }
  };

  const handleRequestRevisionSubmit = async () => {
    if (!selectedLogId || !profile?.id) return;
    const numHours = parseFloat(revisionProposedHours);
    if (isNaN(numHours) || numHours < 0 || numHours > 24) {
      alert("Please enter a valid number of proposed hours (0-24).");
      return;
    }
    const { error } = await requestTimeLogRevision(selectedLogId, numHours, revisionNotes, profile.id);
    if (!error) {
      setRevisionModalOpen(false);
      fetchLogs();
    } else {
      alert(`Failed to request revision: ${error.message || JSON.stringify(error)}`);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [allProjects, setAllProjects] = useState<{id: string, name: string}[]>([]);
  const [allUsers, setAllUsers] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    // Fetch broadly once to get a good list of users/projects for the dropdowns
    if (profile) {
      getTeamTimeLogs(profile.id, profile.role, { status: 'ALL' }).then(({ data }) => {
        const pMap = new Map();
        const uMap = new Map();
        data.forEach((log: any) => {
          if (log.project_id && log.project?.name) pMap.set(log.project_id, log.project.name);
          if (log.profile_id && log.profile?.full_name) uMap.set(log.profile_id, log.profile.full_name);
        });
        setAllProjects(Array.from(pMap, ([id, name]) => ({ id, name })));
        setAllUsers(Array.from(uMap, ([id, name]) => ({ id, name })));
      });
    }
  }, [profile]);

  return (
    <div className="bg-[#fcfbfa] rounded-3xl shadow-sm border border-slate-200 p-6 mt-6">
      
      {/* Sub Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-2">
        <button 
          onClick={() => setActiveSubTab("ACTION")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-bold transition-colors ${activeSubTab === 'ACTION' ? 'text-amber-700 bg-amber-50 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          ⏳ Need Action
        </button>
        <button 
          onClick={() => setActiveSubTab("HISTORY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-bold transition-colors ${activeSubTab === 'HISTORY' ? 'text-emerald-700 bg-emerald-50 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          📜 History & Archive
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-600">Filters:</span>
        </div>

        <select 
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-semibold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
        >
          <option value="">All Members</option>
          {allUsers.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select 
          value={selectedProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-semibold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
        >
          <option value="">All Projects</option>
          {allProjects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
          <label className="flex items-center gap-2 px-2 text-sm font-bold text-slate-600 cursor-pointer">
            <input type="checkbox" checked={useDateFilter} onChange={e => setUseDateFilter(e.target.checked)} className="accent-amber-500" />
            Filter by Week
          </label>
          {useDateFilter && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
              <button onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft size={16} /></button>
              <span className="text-xs font-bold text-slate-700 w-36 text-center">
                {format(currentWeekStart, 'MMM dd')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM dd')}
              </span>
              <button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="p-1 hover:bg-slate-200 rounded"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>

        <button 
          onClick={() => {
            setSelectedUserId("");
            setSelectedProjectId("");
            setUseDateFilter(false);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl ml-auto transition"
        >
          <RefreshCcw size={14} /> Reset
        </button>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">No time logs found matching the criteria.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 w-10"></th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project / Task</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Hours</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                {activeSubTab === "ACTION" && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => {
                const isExpanded = expandedRows[log.id];
                const task = log.task as any;
                
                return (
                  <React.Fragment key={log.id}>
                    <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                      <td className="p-4 text-center">
                        <button onClick={() => toggleRow(log.id)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-800">{log.profile?.full_name}</span>
                          <RoleBadge role={log.profile?.role as any} />
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-semibold text-slate-700 text-sm">{log.project?.name}</span>
                          <span className="text-sm text-slate-500">{task?.name}</span>
                          {log.project?.pm_id !== profile?.id && (profile?.role === 'pmo' || profile?.role === 'administrator') && (
                            <span className="mt-1 inline-flex items-center gap-1 bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-200">
                              <ShieldAlert size={10} /> Executive Oversight (PM: {allUsers.find(u => u.id === log.project?.pm_id)?.name || 'Unknown'})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className="font-semibold text-slate-800">{format(new Date(log.log_date), 'MMM dd, yyyy')}</span>
                      </td>
                      <td className="p-4 align-top text-center">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-sm font-black border border-slate-200">
                          {log.hours}h
                        </span>
                      </td>
                      <td className="p-4 align-top text-center">
                        {log.status === 'SUBMITTED' && <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-200"><Clock size={12}/> Submitted</span>}
                        {log.status === 'APPROVED' && <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold border border-emerald-200"><Check size={12}/> Approved</span>}
                        {log.status === 'REJECTED' && <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-1 rounded-md text-xs font-bold border border-rose-200"><X size={12}/> Rejected</span>}
                        {log.status === 'REVISION_REQUESTED' && <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs font-bold border border-purple-200">💬 Revision</span>}
                      </td>
                      {activeSubTab === "ACTION" && (
                        <td className="p-4 align-top text-right">
                          <div className="flex items-center justify-end gap-2">
                            {log.status === 'SUBMITTED' && (
                              <>
                                <button onClick={() => handleApproveClick(log)} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition" title="Approve"><Check size={16} /></button>
                                <button onClick={() => { setSelectedLogId(log.id); setSelectedTaskId(log.task_id); setRejectReason(""); setRejectModalOpen(true); }} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-200 transition" title="Reject"><X size={16} /></button>
                                <button onClick={() => { setSelectedLogId(log.id); setSelectedTaskId(log.task_id); setRevisionProposedHours(""); setRevisionNotes(""); setRevisionModalOpen(true); }} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg border border-amber-200 transition" title="Request Revision">💬</button>
                              </>
                            )}
                            {log.status === 'REVISION_REQUESTED' && (
                              <span className="text-xs font-bold text-slate-400 italic">Waiting for member</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    
                    {/* Expandable Detail Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={7} className="p-6 border-b border-slate-100">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Task Info */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-100 pb-2">Task Details</h4>
                              <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Progress</span>
                                  <span className="text-sm font-bold text-slate-800">{task?.progress || 0}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Est. vs Actual</span>
                                  <span className="text-sm font-bold text-slate-800">{task?.actual_hours || 0} / {task?.estimated_hours || 0} h</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* History & Notes Info */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-100 pb-2">Negotiation & Notes</h4>
                              {log.rejection_reason && (
                                <div className="mb-2">
                                  <span className="text-xs font-bold text-rose-500 block mb-1">Rejection Reason:</span>
                                  <p className="text-sm text-slate-700 bg-rose-50 p-2 rounded-lg">{log.rejection_reason}</p>
                                </div>
                              )}
                              {log.negotiation_notes && (
                                <div className="mb-2">
                                  <span className="text-xs font-bold text-purple-500 block mb-1">Revision Proposed ({log.proposed_hours}h):</span>
                                  <p className="text-sm text-slate-700 bg-purple-50 p-2 rounded-lg italic">"{log.negotiation_notes}"</p>
                                </div>
                              )}
                              {!log.rejection_reason && !log.negotiation_notes && (
                                <p className="text-sm text-slate-400 italic">No additional notes.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Reject Timesheet</h3>
            <p className="text-sm text-slate-500 mb-6">Please provide a reason for rejecting this time log entry.</p>
            
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[var(--color-brand-orange)] focus:ring-1 focus:ring-[var(--color-brand-orange)] mb-6 h-32 resize-none"
            ></textarea>
            
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-5 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Revision Modal */}
      {revisionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfbfa] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Request Revision</h3>
            <p className="text-sm text-slate-500 mb-6">Propose a new duration for this time log and provide your negotiation notes.</p>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proposed Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={revisionProposedHours}
                onChange={e => setRevisionProposedHours(e.target.value)}
                placeholder="e.g., 4"
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Negotiation Notes</label>
              <textarea
                value={revisionNotes}
                onChange={e => setRevisionNotes(e.target.value)}
                placeholder="Reason for changing the hours..."
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400 h-24 resize-none"
              ></textarea>
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setRevisionModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleRequestRevisionSubmit}
                disabled={!revisionProposedHours || !revisionNotes.trim()}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[var(--color-brand-orange)] hover:bg-orange-600 rounded-xl transition shadow-md disabled:opacity-50"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive Override Modal */}
      <ExecutiveOverrideModal 
        isOpen={overrideModalOpen}
        projectName={overrideProjectName}
        pmName={overridePmName}
        isSubmitting={isApproving}
        onConfirm={() => {
          if (overrideLogId && overrideTaskId) {
            executeApprove(overrideLogId, overrideTaskId);
          }
        }}
        onCancel={() => setOverrideModalOpen(false)}
      />

    </div>
  );
}
