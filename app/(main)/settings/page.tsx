"use client";

import React from "react";
import { Settings as SettingsIcon, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { profile, loading } = useAuth();

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="text-[var(--color-brand-orange)]" />
          Account Settings
        </h2>
        <p className="text-sm text-slate-500 mt-1">Manage your personal profile and preferences.</p>
      </div>
      
      <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <User size={32} />
        </div>
        
        {loading ? (
          <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-full mb-2"></div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-slate-700">{profile?.full_name || "User Name"}</h3>
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mt-2">
              {profile?.role?.replace('_', ' ') || "Role"}
            </span>
          </>
        )}
        
        <p className="text-sm text-slate-500 max-w-sm mt-6 text-center">
          Profile edit form (Change Name, Change Password, etc.) will be implemented here.
        </p>
      </div>
    </div>
  );
}
