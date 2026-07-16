import React from "react";
import { Shield, Users as UsersIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { UsersClient } from "./UsersClient";

export const metadata = {
  title: 'Users Management | HRIS PMO',
};

export default async function UsersPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <p>Please log in.</p>
      </div>
    );
  }

  // Get current user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  // PMO and Administrator can see the list.
  if (profile?.role !== "pmo" && profile?.role !== "administrator") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-[2rem] max-w-md text-center border border-rose-100 shadow-sm">
          <Shield size={48} className="mx-auto mb-4 text-rose-400" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="mb-6 text-sm">Only users with the PMO or Administrator role have authorization to view this page.</p>
          <Link href="/dashboard" className="bg-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:bg-slate-50 transition border border-slate-200 text-slate-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Fetch all profiles
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[500px] flex flex-col relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UsersIcon className="text-[var(--color-brand-orange)]" />
            Users Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage system accounts and authorizations.</p>
        </div>
      </div>
      
      <UsersClient initialProfiles={allProfiles || []} currentRole={profile.role} />
    </div>
  );
}
