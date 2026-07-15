import React from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ProjectTabs } from "@/components/projects/ProjectTabs";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white rounded-t-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col gap-4">
        <a href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-[var(--color-brand-orange)] transition w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Back to Projects
        </a>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wider">
              {project.code || "NO-CODE"}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
              project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
              project.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {project.status}
            </span>
            {project.project_class && (
              <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded-md uppercase tracking-wider">
                {project.project_class}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{project.name}</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">{project.description}</p>
        </div>
      </div>
      </div>
      
      {/* Client Component for Interactive Tabs */}
      <ProjectTabs project={project} />
    </div>
  );
}
