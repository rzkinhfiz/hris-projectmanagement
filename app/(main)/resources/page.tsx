import React from "react";
import { Users } from "lucide-react";
import { ResourceManagementWorkspace } from "@/components/resources/ResourceManagementWorkspace";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile } from "@/types";

export default async function ResourcesPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/login");
  }

  return (
    <div className="bg-[#fcfbfa] rounded-[2rem] p-8 shadow-sm border border-stone-200 min-h-[500px] flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="text-amber-600" />
          Resources Management
        </h2>
        <p className="text-sm text-slate-500 mt-1">Monitor capacity, functional roles, and project allocations.</p>
      </div>
      
      <div className="flex-1">
        <ResourceManagementWorkspace profile={profile as Profile} />
      </div>
    </div>
  );
}
