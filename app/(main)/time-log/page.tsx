"use client";

import React, { useEffect, useState } from "react";
import { format, startOfWeek, addWeeks, subWeeks, addDays } from "date-fns";
import { Clock, ChevronLeft, ChevronRight, Save, Check, X, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
import { RoleBadge } from "@/components/RoleBadge";
import { TooltipNote } from "@/components/TooltipNote";
import { getMyWeeklyLogs, saveTimeLogEntry, submitWeeklyTimesheet, approveOrRejectTimeLog, getAssignedTasksForDateRange, requestTimeLogRevision, acceptProposedRevision } from "@/services/timeLogService";
import { TeamApprovalsTab } from "@/components/time-log/TeamApprovalsTab";
import { MonthlyScheduleCalendar } from "@/components/time-log/MonthlyScheduleCalendar";
import AcceptRevisionModal from "@/components/time-log/AcceptRevisionModal";
import type { TimeLog } from "@/types";

type TabType = "My Timesheet" | "Team Approvals";

interface TaskOption {
  id: string;
  name: string;
  project_id: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface TimesheetRow {
  id: string;
  projectId: string;
  taskId: string;
  hours: number[]; // 0 = Mon, 6 = Sun
  status: string[]; // parallel array for status
  logIds: (string | undefined)[]; // parallel array for log IDs
  proposedHours: (number | undefined)[];
  negotiationNotes: (string | undefined)[];
  rejectionReasons: (string | undefined)[];
  isCustom?: boolean;
  projectName?: string;
  taskName?: string;
  estimatedHours?: number;
  plannedEndDate?: string;
}

export default function TimeLogPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("My Timesheet");
  
  // My Timesheet State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");



  // Accept Revision Modal State (Member)
  const [acceptRevisionModalOpen, setAcceptRevisionModalOpen] = useState(false);
  const [selectedRevisionLog, setSelectedRevisionLog] = useState<TimeLog | null>(null);
  const [activePopoverLogId, setActivePopoverLogId] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    if (profile) {
      fetchDropdownOptions();
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      if (activeTab === "My Timesheet") {
        fetchMyTimesheet();
      }
    }
  }, [profile, currentWeekStart, activeTab]);

  const fetchDropdownOptions = async () => {
    const supabase = createClient();
    // Get tasks where user is owner, and their projects
    const { data: userTasks, error } = await supabase
      .from("tasks")
      .select("id, name, project_id, projects!inner(id, name)")
      .eq("owner_id", profile?.id);

    if (error || !userTasks) return;

    const uniqueProjects = new Map<string, ProjectOption>();
    const taskList: TaskOption[] = [];

    userTasks.forEach((t: any) => {
      if (t.projects) {
        uniqueProjects.set(t.project_id, { id: t.project_id, name: t.projects.name });
      }
      taskList.push({ id: t.id, name: t.name, project_id: t.project_id });
    });

    setProjects(Array.from(uniqueProjects.values()));
    setTasks(taskList);
  };

  const fetchMyTimesheet = async () => {
    if (!profile) return;
    setLoading(true);
    const endOfWeekDate = addDays(currentWeekStart, 6);
    
    // 1. Fetch existing logs
    const { data: logsData } = await getMyWeeklyLogs(profile.id, currentWeekStart, endOfWeekDate);
    
    // 2. Fetch assigned tasks overlapping this week
    const { data: assignedTasks } = await getAssignedTasksForDateRange(profile.id, currentWeekStart, endOfWeekDate);
    
    const rowMap = new Map<string, TimesheetRow>();

    // 3. Pre-populate rows for assigned tasks
    if (assignedTasks) {
      assignedTasks.forEach((task: any) => {
        const key = `${task.project_id}-${task.id}`;
        rowMap.set(key, {
          id: key,
          projectId: task.project_id,
          taskId: task.id,
          hours: Array(7).fill(0),
          status: Array(7).fill('DRAFT'),
          logIds: Array(7).fill(undefined),
          proposedHours: Array(7).fill(undefined),
          negotiationNotes: Array(7).fill(undefined),
          rejectionReasons: Array(7).fill(undefined),
          isCustom: false,
          projectName: task.projects?.name || 'Unknown Project',
          taskName: task.name,
          estimatedHours: task.estimated_hours,
          plannedEndDate: task.planned_end
        });
      });
    }

    // 4. Process existing logs (override empty hours or add custom ad-hoc rows)
    logsData.forEach((log) => {
      const key = `${log.project_id}-${log.task_id}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          id: key,
          projectId: log.project_id,
          taskId: log.task_id,
          hours: Array(7).fill(0),
          status: Array(7).fill('DRAFT'),
          logIds: Array(7).fill(undefined),
          proposedHours: Array(7).fill(undefined),
          negotiationNotes: Array(7).fill(undefined),
          rejectionReasons: Array(7).fill(undefined),
          isCustom: true // It wasn't in assignedTasks
        });
      }
      const row = rowMap.get(key)!;
      const logDate = new Date(log.log_date);
      // Find day index (0 = Mon, 6 = Sun)
      const dayIndex = weekDays.findIndex(d => format(d, 'yyyy-MM-dd') === format(logDate, 'yyyy-MM-dd'));
      if (dayIndex !== -1) {
        row.hours[dayIndex] = Number(log.hours);
        row.status[dayIndex] = log.status;
        row.logIds[dayIndex] = log.id;
        row.proposedHours[dayIndex] = log.proposed_hours ?? undefined;
        row.negotiationNotes[dayIndex] = log.negotiation_notes ?? undefined;
        row.rejectionReasons[dayIndex] = log.rejection_reason ?? undefined;
      }
    });

    setRows(Array.from(rowMap.values()));
    setLoading(false);
  };

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  const updateRow = (index: number, field: keyof TimesheetRow, value: any) => {
    const newRows = [...rows];
    
    // Cascade Reset logic
    if (field === 'projectId') {
      newRows[index].projectId = value;
      newRows[index].taskId = ''; // reset task
    } else {
      newRows[index] = { ...newRows[index], [field]: value };
    }
    setRows(newRows);
  };

  const updateHour = (rowIndex: number, dayIndex: number, value: string) => {
    let num = parseFloat(value) || 0;
    if (num > 24) num = 24;
    if (num < 0) num = 0;
    
    const newRows = [...rows];
    newRows[rowIndex].hours[dayIndex] = num;
    setRows(newRows);
  };

  const handleFillEstimated = (rowIndex: number, estimatedHours: number) => {
    const hoursPerDay = Math.round((estimatedHours / 5) * 10) / 10;
    const newRows = [...rows];
    for (let i = 0; i < 5; i++) {
      if (newRows[rowIndex].status[i] === 'DRAFT' || newRows[rowIndex].status[i] === 'REJECTED') {
         newRows[rowIndex].hours[i] = hoursPerDay;
      }
    }
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { id: `new-${Date.now()}`, projectId: '', taskId: '', hours: Array(7).fill(0), status: Array(7).fill('DRAFT'), logIds: Array(7).fill(undefined), proposedHours: Array(7).fill(undefined), negotiationNotes: Array(7).fill(undefined), rejectionReasons: Array(7).fill(undefined), isCustom: true }]);
  };

  const removeRow = (index: number) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const handleCalendarTaskClick = (task: any) => {
    if (activeTab !== "My Timesheet") return;
    
    const key = `${task.project_id}-${task.id}`;
    
    // Check if it already exists
    if (!rows.find(r => r.id === key)) {
      const newRow: TimesheetRow = {
        id: key,
        projectId: task.project_id,
        taskId: task.id,
        hours: Array(7).fill(0),
        status: Array(7).fill('DRAFT'),
        logIds: Array(7).fill(undefined),
        proposedHours: Array(7).fill(undefined),
        negotiationNotes: Array(7).fill(undefined),
        rejectionReasons: Array(7).fill(undefined),
        isCustom: false,
        projectName: task.projects?.name || 'Unknown Project',
        taskName: task.name,
        estimatedHours: task.estimated_hours,
        plannedEndDate: task.planned_end
      };
      
      setRows(prev => [...prev, newRow]);
    }
    
    // Trigger scroll and highlight
    setHighlightedRowId(key);
    
    setTimeout(() => {
      const el = document.getElementById('weekly-board-table');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    
    // Remove highlight after 1.5s
    setTimeout(() => {
      setHighlightedRowId(null);
    }, 1500);
  };

  const handleSaveDraft = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      for (const row of rows) {
        if (!row.projectId || !row.taskId) continue;
        for (let i = 0; i < 7; i++) {
          const hrs = row.hours[i];
          if (hrs > 0 || row.status[i] !== 'DRAFT') { // save if hours > 0 or if we need to update an existing log
            const logDateStr = format(weekDays[i], 'yyyy-MM-dd');
            await saveTimeLogEntry(profile.id, {
              project_id: row.projectId,
              task_id: row.taskId,
              log_date: logDateStr,
              hours: hrs
            });
          }
        }
      }
      await fetchMyTimesheet();
      alert("Draft saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save draft.");
    }
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!profile) return;
    
    // First save any pending changes
    await handleSaveDraft();
    
    setSaving(true);
    try {
      // Re-fetch to get all IDs for the week
      const endOfWeekDate = addDays(currentWeekStart, 6);
      const { data } = await getMyWeeklyLogs(profile.id, currentWeekStart, endOfWeekDate);
      
      const logIdsToSubmit = data.filter(d => d.status === 'DRAFT' || d.status === 'REJECTED').map(d => d.id);
      
      if (logIdsToSubmit.length > 0) {
        await submitWeeklyTimesheet(profile.id, logIdsToSubmit);
        alert("Timesheet submitted for approval!");
        await fetchMyTimesheet();
      } else {
        alert("No drafts available to submit.");
      }
    } catch(e) {
      console.error(e);
      alert("Failed to submit timesheet.");
    }
    setSaving(false);
  };



  const totalHoursThisWeek = rows.reduce((acc, row) => acc + row.hours.reduce((sum, h) => sum + h, 0), 0);

  return (
    <div className="bg-[#fcfbfa] min-h-screen p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Tabs */}
        <div className="flex items-center gap-6 mb-8 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab("My Timesheet")}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'My Timesheet' ? 'border-[var(--color-brand-orange)] text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            ⏱️ My Timesheet
          </button>
          
          <RoleGuard currentRole={profile?.role || ''} allowed={["administrator", "pmo", "project_manager"]}>
            <button 
              onClick={() => setActiveTab("Team Approvals")}
              className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'Team Approvals' ? 'border-[var(--color-brand-orange)] text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              📋 Team Approvals
            </button>
          </RoleGuard>
        </div>

        {activeTab === "My Timesheet" && (
          <div className="space-y-6">
            
            {/* KPI Cards & Week Nav */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-50 rounded-xl transition"><ChevronLeft size={20} className="text-slate-600" /></button>
                <div className="flex flex-col items-center min-w-[200px]">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Week of</span>
                  <span className="text-base font-bold text-slate-800">
                    {format(currentWeekStart, 'MMM dd')} - {format(addDays(currentWeekStart, 6), 'MMM dd, yyyy')}
                  </span>
                </div>
                <button onClick={handleNextWeek} className="p-2 hover:bg-slate-50 rounded-xl transition"><ChevronRight size={20} className="text-slate-600" /></button>
              </div>

              <div className="flex gap-4">
                <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Hours</span>
                  <span className="text-2xl font-black text-slate-800">{totalHoursThisWeek.toFixed(1)} <span className="text-sm font-bold text-slate-400">hrs</span></span>
                </div>
                <div className="bg-[var(--color-brand-orange)]/10 px-6 py-4 rounded-3xl shadow-sm border border-[var(--color-brand-orange)]/20 flex flex-col justify-center min-w-[180px]">
                  <span className="text-xs font-bold text-[var(--color-brand-orange)] uppercase tracking-wider mb-1">Status Filter</span>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-lg font-black text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto" id="weekly-board-table">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[25%]">Project</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[25%]">Task</th>
                      {weekDays.map(day => (
                        <th key={day.toString()} className="p-4 text-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400">{format(day, 'EEE')}</span>
                            <span className="text-sm font-black text-slate-800">{format(day, 'dd')}</span>
                          </div>
                        </th>
                      ))}
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={10} className="p-8 text-center text-slate-400 font-medium">Loading timesheet...</td></tr>
                    ) : rows.length === 0 ? (
                       <tr><td colSpan={10} className="p-8 text-center text-slate-400 font-medium">No projects assigned.</td></tr>
                    ) : (
                      rows.map((row, originalIndex) => ({ row, originalIndex }))
                        .filter(({ row }) => {
                          if (statusFilter === "ALL") return true;
                          const hasHours = row.hours.some(h => h > 0);
                          if (!hasHours) return statusFilter === 'DRAFT';
                          return row.status.some((s, i) => s === statusFilter && row.hours[i] > 0);
                        })
                        .map(({ row, originalIndex: rowIndex }) => (
                        <tr 
                          key={row.id} 
                          className={`hover:bg-slate-50/30 transition-colors duration-500 ${highlightedRowId === row.id ? 'bg-amber-100/60' : ''}`}
                        >
                          <td className="p-4 align-top">
                            {row.isCustom !== false ? (
                              <select 
                                value={row.projectId}
                                onChange={(e) => updateRow(rowIndex, 'projectId', e.target.value)}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-brand-orange)] focus:ring-1 focus:ring-[var(--color-brand-orange)] ${row.projectId ? 'text-slate-900 font-semibold' : 'text-slate-500 font-medium'}`}
                              >
                                <option value="">Select Project...</option>
                                {projects.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="inline-block px-3 py-1.5 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg text-sm font-bold shadow-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                {row.projectName}
                              </div>
                            )}
                          </td>
                          <td className="p-4 align-top">
                            {row.isCustom !== false ? (
                              <select 
                                value={row.taskId}
                                onChange={(e) => updateRow(rowIndex, 'taskId', e.target.value)}
                                disabled={!row.projectId}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-brand-orange)] focus:ring-1 focus:ring-[var(--color-brand-orange)] disabled:opacity-50 ${row.taskId ? 'text-slate-900 font-semibold' : 'text-slate-500 font-medium'}`}
                              >
                                <option value="">Select Task...</option>
                                {tasks.filter(t => t.project_id === row.projectId).map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <span className="font-bold text-slate-800 text-sm leading-tight">
                                  {row.taskName}
                                </span>
                                {row.estimatedHours ? (
                                  <TooltipNote content="Otomatis mengisi jam kerja berdasarkan estimasi yang tersisa" position="right">
                                    <button 
                                      onClick={() => handleFillEstimated(rowIndex, row.estimatedHours!)}
                                      className="self-start px-2.5 py-1 flex items-center gap-1 text-[11px] font-bold text-[var(--color-brand-orange)] bg-white border border-[var(--color-brand-orange)] rounded-md hover:bg-orange-50 transition shadow-sm"
                                    >
                                      ⚡ Fill {row.estimatedHours}h
                                    </button>
                                  </TooltipNote>
                                ) : null}
                              </div>
                            )}
                          </td>
                          
                          {row.hours.map((hrs, dayIndex) => {
                            const isOvertime = hrs > 12;
                            const status = row.status[dayIndex];
                            const isReadonly = status === 'SUBMITTED' || status === 'APPROVED' || status === 'REVISION_REQUESTED';
                            const cellDateStr = format(weekDays[dayIndex], 'yyyy-MM-dd');
                            const isDeadline = row.plannedEndDate === cellDateStr;
                            const isRevisionRequested = status === 'REVISION_REQUESTED';
                            const logId = row.logIds[dayIndex];
                            const proposedHours = row.proposedHours[dayIndex];
                            const negNotes = row.negotiationNotes[dayIndex];
                            const isPopoverOpen = activePopoverLogId === logId && logId;
                            
                            return (
                            <td key={dayIndex} className="p-4 align-top">
                              <div className="flex flex-col items-center gap-1.5 relative">
                                {isDeadline && (
                                  <span className="absolute -top-3 text-[10px] bg-white rounded-full shadow-sm z-10" title="Deadline">🚩</span>
                                )}
                                
                                <div className="relative">
                                  <input 
                                    type="number"
                                    min="0" max="24" step="0.5"
                                    value={hrs || ''}
                                    disabled={isReadonly}
                                    onChange={(e) => updateHour(rowIndex, dayIndex, e.target.value)}
                                    className={`w-16 text-center bg-slate-50 border border-slate-200 rounded-xl py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-[var(--color-brand-orange)] focus:ring-1 focus:ring-[var(--color-brand-orange)] disabled:opacity-50 disabled:bg-slate-100 ${isOvertime ? 'border-amber-400 bg-amber-50' : ''} ${isDeadline ? 'border-b-2 !border-b-rose-400' : ''} ${isRevisionRequested ? '!border-2 !border-purple-400 !bg-purple-50 cursor-pointer opacity-100' : ''}`}
                                    placeholder="0"
                                    onClick={() => {
                                      if (isRevisionRequested && logId) {
                                        setActivePopoverLogId(isPopoverOpen ? null : logId);
                                      }
                                    }}
                                  />
                                  {isRevisionRequested && (
                                    <span className="absolute -top-2 -right-2 bg-purple-100 text-purple-600 p-1 rounded-full cursor-pointer shadow-sm hover:scale-110 transition-transform" onClick={() => logId && setActivePopoverLogId(isPopoverOpen ? null : logId)}>
                                      <span className="text-[10px]">💬</span>
                                    </span>
                                  )}
                                </div>

                                {isPopoverOpen && isRevisionRequested && (
                                  <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[60] w-64 bg-white rounded-2xl shadow-xl shadow-purple-900/10 border border-purple-100 p-4 animate-in zoom-in-95 fade-in duration-200">
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                                      <div className="text-xs font-bold text-slate-400">Revisi Diajukan</div>
                                      <button onClick={() => setActivePopoverLogId(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 mb-3 bg-slate-50 rounded-xl p-2 border border-slate-100">
                                      <div className="text-sm font-bold text-slate-400 line-through decoration-rose-400">{hrs}h</div>
                                      <span className="text-slate-300">➔</span>
                                      <div className="text-lg font-black text-emerald-600">{proposedHours}h</div>
                                    </div>
                                    <div className="text-xs text-slate-600 bg-purple-50 rounded-lg p-2.5 mb-4 border border-purple-100 italic">
                                      "{negNotes}"
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <button 
                                        onClick={() => {
                                          setActivePopoverLogId(null);
                                          setSelectedRevisionLog({
                                            id: logId!,
                                            project_id: row.projectId,
                                            task_id: row.taskId,
                                            profile_id: profile?.id || '',
                                            hours: hrs,
                                            status: 'REVISION_REQUESTED',
                                            rejection_reason: null,
                                            proposed_hours: proposedHours || null,
                                            negotiation_notes: negNotes || null,
                                            created_at: '',
                                            updated_at: '',
                                            log_date: cellDateStr,
                                            project: { name: row.projectName || '', code: '' },
                                            task: { name: row.taskName || '' }
                                          });
                                          setAcceptRevisionModalOpen(true);
                                        }}
                                        className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-2 rounded-xl text-xs font-bold transition"
                                      >
                                        🤝 Accept {proposedHours}h
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setActivePopoverLogId(null);
                                          const newRows = [...rows];
                                          newRows[rowIndex].status[dayIndex] = 'DRAFT';
                                          newRows[rowIndex].proposedHours[dayIndex] = undefined;
                                          newRows[rowIndex].negotiationNotes[dayIndex] = undefined;
                                          setRows(newRows);
                                        }}
                                        className="w-full bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 py-2 rounded-xl text-xs font-bold transition"
                                      >
                                        ✏️ Edit & Re-submit
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {isOvertime && !isRevisionRequested && (
                                  <TooltipNote content="Peringatan: Jam input harian melebihi batas normal operasional (> 12 jam)" position="bottom" className="absolute -bottom-5">
                                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                      <AlertTriangle size={8} /> Overtime
                                    </span>
                                  </TooltipNote>
                                )}
                                {status === 'APPROVED' && <span className="absolute -top-2 -right-2 bg-emerald-100 text-emerald-600 p-0.5 rounded-full"><Check size={10} /></span>}
                                {status === 'SUBMITTED' && <span className="absolute -top-2 -right-2 bg-blue-100 text-blue-600 p-0.5 rounded-full"><Clock size={10} /></span>}
                                {status === 'REJECTED' && (
                                  <TooltipNote 
                                    content={
                                      <div className="flex flex-col gap-1 max-w-[200px]">
                                        <span className="font-bold border-b border-rose-300 pb-1 mb-1">Ditolak:</span>
                                        <span className="whitespace-pre-wrap">{row.rejectionReasons?.[dayIndex] || "Tidak ada alasan spesifik"}</span>
                                      </div>
                                    } 
                                    position="top"
                                  >
                                    <span className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 p-0.5 rounded-full cursor-help"><X size={10} /></span>
                                  </TooltipNote>
                                )}
                              </div>
                            </td>
                          )})}
                          
                          <td className="p-4 align-top text-center">
                            <button onClick={() => removeRow(rowIndex)} className="mt-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer actions */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                <button onClick={addRow} className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand-orange)] hover:text-orange-700 bg-orange-50 px-4 py-2 rounded-xl transition">
                  <Plus size={16} /> Add Custom Row
                </button>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    <Save size={16} /> Save Draft
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 text-sm font-bold text-white bg-[var(--color-brand-orange)] hover:bg-orange-600 px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    🚀 Submit Weekly Timesheet
                  </button>
                </div>
              </div>
            </div>

            {/* Hybrid Calendar View */}
            <MonthlyScheduleCalendar onTaskClick={handleCalendarTaskClick} />
          </div>
        )}

        {activeTab === "Team Approvals" && (
          <RoleGuard currentRole={profile?.role || ''} allowed={["administrator", "pmo", "project_manager"]}>
            <TeamApprovalsTab profile={profile} />
          </RoleGuard>
        )}

        {/* Accept Revision Double Verification Modal */}
        {selectedRevisionLog && (
          <AcceptRevisionModal
            isOpen={acceptRevisionModalOpen}
            onClose={() => {
              setAcceptRevisionModalOpen(false);
              setSelectedRevisionLog(null);
            }}
            onConfirm={async () => {
              if (selectedRevisionLog && profile?.id) {
                const { error } = await acceptProposedRevision(selectedRevisionLog.id, profile.id);
                if (!error) {
                  fetchMyTimesheet(); // Refresh after accepting
                } else {
                  console.error(error);
                  alert(`Failed to accept revision: ${error.message}`);
                }
              }
            }}
            timeLog={selectedRevisionLog}
          />
        )}

      </div>
    </div>
  );
}
