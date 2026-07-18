"use client";


import React, { useState } from "react";
import { BarChart3, Briefcase, Settings } from "lucide-react";
import type { Profile } from "@/types";
import { CapacityUtilizationTab } from "./tabs/CapacityUtilizationTab";
import { MasterFunctionalRolesTab } from "./tabs/MasterFunctionalRolesTab";
import { ProjectAssignmentsTab } from "./tabs/ProjectAssignmentsTab";

interface WorkspaceProps {
  profile: Profile;
}

export function ResourceManagementWorkspace({ profile }: WorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"CAPACITY" | "ROLES" | "ASSIGNMENTS">("CAPACITY");

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab("CAPACITY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm ${
            activeTab === "CAPACITY"
              ? "bg-amber-100 text-amber-900"
              : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
          }`}
        >
          <BarChart3 size={18} />
          Capacity & Utilization
        </button>
        <button
          onClick={() => setActiveTab("ROLES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm ${
            activeTab === "ROLES"
              ? "bg-amber-100 text-amber-900"
              : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
          }`}
        >
          <Settings size={18} />
          Master Functional Roles
        </button>
        <button
          onClick={() => setActiveTab("ASSIGNMENTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm ${
            activeTab === "ASSIGNMENTS"
              ? "bg-amber-100 text-amber-900"
              : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
          }`}
        >
          <Briefcase size={18} />
          Project Assignments
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 bg-white rounded-2xl border border-stone-100 p-6 shadow-sm overflow-auto">
        {activeTab === "CAPACITY" && <CapacityUtilizationTab profile={profile} />}
        {activeTab === "ROLES" && <MasterFunctionalRolesTab profile={profile} />}
        {activeTab === "ASSIGNMENTS" && <ProjectAssignmentsTab profile={profile} />}
      </div>
    </div>
  );
}
