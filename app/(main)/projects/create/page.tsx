"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProjectForm, ProjectFormData } from "@/components/projects/ProjectForm";
import { getProjectManagers } from "@/services/profileService";
import { createProject } from "@/services/projectService";
import type { Profile } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateProjectPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [pms, setPms] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If auth is loaded and user is not PMO, redirect or show error
    if (!authLoading) {
      if (!user) {
        router.replace("/");
        return;
      }
      
      if (profile?.role !== "pmo" && profile?.role !== "administrator") {
        setError("Access Denied: Only PMO or Administrator role can create new projects.");
        setIsLoading(false);
        return;
      }

      // Fetch PMs
      const fetchPMs = async () => {
        const { data, error } = await getProjectManagers();
        if (error) {
          setError("Failed to load project managers.");
        } else {
          setPms(data);
        }
        setIsLoading(false);
      };

      fetchPMs();
    }
  }, [authLoading, user, profile, router]);

  const handleSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    setError(null);

    // Format for DB: convert empty strings to undefined for UUIDs and optional fields
    const newProject = {
      ...data,
      pmo_id: profile?.id || undefined, // The PMO creating the project
      pm_id: data.pm_id === "" ? undefined : data.pm_id,
      sales_order_no: data.sales_order_no === "" ? undefined : data.sales_order_no,
      project_class: data.project_class === "" ? undefined : data.project_class,
      internal_drive_url: data.internal_drive_url === "" ? undefined : data.internal_drive_url,
      external_drive_url: data.external_drive_url === "" ? undefined : data.external_drive_url,
      start_date: data.start_date === "" ? undefined : data.start_date,
      end_date: data.end_date === "" ? undefined : data.end_date,
      status: data.status,
    };

    const { error: submitError } = await createProject(newProject, {
      performerId: profile?.id || "system",
      performerRole: profile?.role || "user",
    });
    
    setIsSubmitting(false);

    if (submitError) {
      setError(submitError.message || "An error occurred while creating the project.");
    } else {
      // Redirect to dashboard or project list
      router.push("/dashboard");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-orange)]"></div>
      </div>
    );
  }

  if (error && profile?.role !== "pmo" && profile?.role !== "administrator") {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="mb-6">{error}</p>
          <Link href="/dashboard" className="bg-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:bg-slate-50 transition">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-auto min-h-full pb-10">
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/dashboard"
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm hover:bg-slate-50 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Create New Project</h1>
          <p className="text-sm text-slate-500 mt-1">Initiate a new project into the governance system.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <ProjectForm 
          projectManagers={pms} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
          cancelHref="/dashboard"
        />
      </div>
    </div>
  );
}
