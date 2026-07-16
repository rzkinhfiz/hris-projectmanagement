"use client";

import React, { useState } from "react";
import { Project } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { EditProjectMetadataModal } from "./EditProjectMetadataModal";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const { profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canEditMetadata = profile?.role === "pmo" || profile?.role === "administrator";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Started":
      case "Active":
      case "In progress":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Completed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Hold":
      case "To review":
      case "Overdue":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Canceled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-t-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col gap-4">
      <a href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-[var(--color-brand-orange)] transition w-fit">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        Back to Projects
      </a>
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md uppercase tracking-wider">
              {project.code || "NO-CODE"}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 border rounded-md uppercase tracking-wider ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            {project.project_class && (
              <span className="text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-md uppercase tracking-wider">
                {project.project_class.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{project.name}</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">{project.description}</p>
        </div>

        {canEditMetadata && profile && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-xl transition border border-amber-200 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            Edit Metadata
          </button>
        )}
      </div>

      {profile && (
        <EditProjectMetadataModal
          project={project}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentUser={{ ...profile, role: profile.role || "", email: profile.email || undefined }}
        />
      )}
    </div>
  );
}
