"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Project } from "@/types";
import { RevenueTab } from "./tabs/RevenueTab";
import { BudgetTab } from "./tabs/BudgetTab";
import { ResourceTab } from "./tabs/ResourceTab";
import { RaidTab } from "./tabs/RaidTab";
import { TasksTab } from "./tabs/TasksTab";
import { 
  FileText, 
  CheckSquare, 
  DollarSign, 
  PieChart, 
  Users, 
  AlertTriangle,
  Edit2,
  X,
  Save
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
import { ProjectComplianceCard } from "./ProjectComplianceCard";
import { ProjectActivityTimeline } from "./ProjectActivityTimeline";
import { History } from "lucide-react";

interface ProjectTabsProps {
  project: Project;
}

export function ProjectTabs({ project }: ProjectTabsProps) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("taskId") ? "tasks" : "overview";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { profile } = useAuth();
  
  // Edit Drive URLs state
  const [showEditUrls, setShowEditUrls] = useState(false);
  const [internalUrl, setInternalUrl] = useState(project.internal_drive_url || "");
  const [externalUrl, setExternalUrl] = useState(project.external_drive_url || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveUrls = async () => {
    setIsSaving(true);
    const { updateProjectMetadata } = await import("@/services/projectService");
    const { error } = await updateProjectMetadata(project.id, {
      internal_drive_url: internalUrl,
      external_drive_url: externalUrl
    }, {
      performerId: profile?.id || "",
      performerRole: profile?.role || "",
      userEmail: profile?.email || ""
    });

    if (error) {
      alert("Failed to update URLs: " + error.message);
      setIsSaving(false);
    } else {
      window.location.reload();
    }
  };

  const tabs = [
    { id: "overview", label: "Overview & Legal", icon: FileText },
    { id: "tasks", label: "Tasks & Gantt", icon: CheckSquare },
    { id: "revenue", label: "Revenue & Terms", icon: DollarSign },
    { id: "budget", label: "Budgeting", icon: PieChart },
    { id: "resources", label: "Resource Load", icon: Users },
    { id: "raid", label: "RAID Log", icon: AlertTriangle },
    { id: "activity", label: "Activity Log", icon: History },
  ];

  return (
    <div className="flex-1 flex flex-col mt-2">
      <div className="bg-white px-8 border-b border-slate-100 shadow-sm flex gap-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 border-b-2 transition-colors font-medium ${
                isActive 
                  ? "border-[var(--color-brand-orange)] text-[var(--color-brand-orange)]" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-8 bg-slate-50/50">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {profile && <ProjectComplianceCard project={project} currentUser={profile} />}
            
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Contract Administration</h3>
                <RoleGuard currentRole={profile?.role || ""} allowed={["administrator", "pmo"]}>
                  {!showEditUrls && (
                    <button 
                      onClick={() => setShowEditUrls(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition"
                    >
                      <Edit2 size={14} /> Edit Drive URLs
                    </button>
                  )}
                </RoleGuard>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sales Order No.</label>
                    <p className="text-slate-800 font-medium">{project.sales_order_no || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contract Value (Excl. Tax)</label>
                    <p className="text-slate-800 font-medium">Rp {project.contract_value_excl_tax?.toLocaleString() || "0"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {showEditUrls ? (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Internal Drive URL</label>
                        <input 
                          type="url"
                          value={internalUrl}
                          onChange={e => setInternalUrl(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">External Drive URL</label>
                        <input 
                          type="url"
                          value={externalUrl}
                          onChange={e => setExternalUrl(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                        <button 
                          onClick={() => setShowEditUrls(false)}
                          disabled={isSaving}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveUrls}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition"
                        >
                          <Save size={14} /> {isSaving ? 'Saving...' : 'Save URLs'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Drive URL</label>
                        {project.internal_drive_url ? (
                          <a href={project.internal_drive_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block">
                            {project.internal_drive_url}
                          </a>
                        ) : (
                          <p className="text-slate-500 italic">Not set</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">External Drive URL</label>
                        {project.external_drive_url ? (
                          <a href={project.external_drive_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block">
                            {project.external_drive_url}
                          </a>
                        ) : (
                          <p className="text-slate-500 italic">Not set</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <RoleGuard currentRole={profile?.role || ""} allowed={["administrator"]}>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2">Danger Zone</h4>
                <p className="text-sm text-slate-500 mb-4">
                  Permanently delete this project and all of its associated data (tasks, invoices, budget, etc.). 
                  This action cannot be undone.
                </p>
                <button 
                  onClick={async () => {
                    if (confirm("Are you absolutely sure you want to permanently delete this project? This action cannot be undone.")) {
                      const { deleteProject } = await import("@/services/projectService");
                      const { error } = await deleteProject(project.id, {
                        performerId: profile?.id || "",
                        performerRole: profile?.role || "",
                      });
                      if (error) {
                        alert("Failed to delete project: " + error.message);
                      } else {
                        window.location.href = "/projects";
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium rounded-xl transition border border-red-100"
                >
                  Delete Project (Permanently)
                </button>
              </div>
            </RoleGuard>
          </div>
          </div>
        )}
        
        {activeTab === "tasks" && (
           <TasksTab project={project} />
        )}
        
        {activeTab === "revenue" && (
           <RevenueTab project={project} />
        )}

        {activeTab === "budget" && (
           <BudgetTab project={project} />
        )}

        {activeTab === "resources" && (
           <ResourceTab project={project} />
        )}

        { activeTab === "raid" && (
           <RaidTab project={project} />
        )}

        { activeTab === "activity" && (
           <ProjectActivityTimeline projectId={project.id} />
        )}
      </div>
    </div>
  );
}
