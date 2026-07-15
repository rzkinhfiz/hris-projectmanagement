"use client";

import React from "react";
import { Shield, Users as UsersIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function UsersPage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-orange)]"></div>
      </div>
    );
  }

  // RBAC validation: Only PMO can manage users
  if (profile?.role !== "pmo") {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-[2rem] max-w-md text-center border border-rose-100 shadow-sm">
          <Shield size={48} className="mx-auto mb-4 text-rose-400" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="mb-6 text-sm">Only users with the PMO role have authorization to manage system accounts.</p>
          <Link href="/dashboard" className="bg-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:bg-slate-50 transition border border-slate-200 text-slate-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UsersIcon className="text-[var(--color-brand-orange)]" />
            Users Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage system accounts and authorizations.</p>
        </div>
        <button className="bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm">
          + Add User
        </button>
      </div>
      
      <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <UsersIcon size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">Users Table Skeleton</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            User list and role assignment CRUD will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
