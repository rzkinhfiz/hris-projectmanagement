"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FolderGit2, Search, ArrowRight, Clock, AlertTriangle, CheckCircle2, PlayCircle } from "lucide-react";
import { getProjects } from "@/services/projectService";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await getProjects();
      if (error) console.error("Error fetching projects:", error);
      console.log("Projects data:", data);
      setProjects(data || []);
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return { bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle2 size={14} className="mr-1" /> };
      case "at risk":
        return { bg: "bg-rose-100", text: "text-rose-700", icon: <AlertTriangle size={14} className="mr-1" /> };
      case "delayed":
        return { bg: "bg-amber-100", text: "text-amber-700", icon: <Clock size={14} className="mr-1" /> };
      case "on going":
      case "active":
        return { bg: "bg-blue-100", text: "text-blue-700", icon: <PlayCircle size={14} className="mr-1" /> };
      default:
        return { bg: "bg-slate-100", text: "text-slate-700", icon: null };
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderGit2 className="text-[var(--color-brand-orange)]" />
            Projects Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage and oversee all company projects.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              className="w-64 bg-slate-50 rounded-full py-2 pl-10 pr-4 text-sm text-slate-700 outline-none border border-slate-200 focus:border-[var(--color-brand-orange)] focus:ring-1 focus:ring-[var(--color-brand-orange)] transition"
            />
          </div>
          
          <Link 
            href="/projects/create"
            className="bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-semibold transition shadow-sm flex items-center gap-1"
          >
            + Create Project
          </Link>
        </div>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-orange)]"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <FolderGit2 size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">No Projects Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-2 mb-6">
              There are currently no projects in the database.
            </p>
            <Link 
              href="/projects/create"
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2 rounded-full text-sm font-semibold transition shadow-sm"
            >
              Create Your First Project
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 pt-2 text-xs font-bold text-slate-500 uppercase tracking-wider pl-4">Project</th>
                <th className="pb-4 pt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="pb-4 pt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline</th>
                <th className="pb-4 pt-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const statusStyle = getStatusStyle(project.status);
                return (
                  <tr key={project.id} className="group hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{project.name}</span>
                        <span className="text-xs font-medium text-slate-400 mt-0.5">{project.code}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-md ${statusStyle.bg} ${statusStyle.text} uppercase tracking-wider`}>
                        {statusStyle.icon}
                        {project.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600 font-medium">
                          {project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'} 
                          {' - '}
                          {project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <Link href={`/projects/${project.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-[var(--color-brand-orange)] hover:border-[var(--color-brand-orange)] transition shadow-sm">
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
