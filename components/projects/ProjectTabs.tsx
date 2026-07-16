"use client";

import React, { useState } from "react";
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
  AlertTriangle 
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
  const [activeTab, setActiveTab] = useState("overview");
  const { profile } = useAuth();

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
              <h3 className="text-lg font-bold text-slate-800 mb-6">Contract Administration</h3>
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
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Drive URL</label>
                    <p className="text-blue-600 hover:underline cursor-pointer truncate">{project.internal_drive_url || "Not set"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">External Drive URL</label>
                    <p className="text-blue-600 hover:underline cursor-pointer truncate">{project.external_drive_url || "Not set"}</p>
                  </div>
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
