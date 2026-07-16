import React from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { ProjectHeader } from "@/components/projects/ProjectHeader";

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
      <ProjectHeader project={project} />
      
      {/* Client Component for Interactive Tabs */}
      <ProjectTabs project={project} />
    </div>
  );
}
