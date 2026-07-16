"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, ChevronLeft, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { RoleBadge } from "./RoleBadge";

export function Topbar() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper to generate initials
  const getInitials = (name?: string | null) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };



  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format page title from pathname
  const formatPageTitle = (path: string) => {
    if (path === "/dashboard") return "Dashboard";
    
    // UUID regex pattern
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const parts = path.split('/').filter(Boolean).map(p => {
      if (uuidRegex.test(p)) return "Detail";
      return p.charAt(0).toUpperCase() + p.slice(1);
    });
    
    return parts.join(" / ");
  };

  const pageTitle = formatPageTitle(pathname);

  return (
    <header className="flex items-center justify-between py-6 px-8 bg-[var(--color-canvas)] rounded-tr-[2rem]">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 shadow-sm hover:bg-slate-50 transition"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold text-slate-900">{pageTitle || "Overview"}</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search for anything..."
            className="w-72 bg-white rounded-full py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-[var(--color-brand-orange)] transition"
          />
        </div>

        {/* Notification */}
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 bg-white rounded-full py-1.5 px-2 pr-4 shadow-sm hover:bg-slate-50 transition focus:ring-2 focus:ring-[var(--color-brand-orange)] outline-none max-w-[200px] sm:max-w-[260px] md:max-w-[300px]"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-slate-600">
                {getInitials(profile?.full_name)}
              </span>
            </div>
            <div className="text-left flex flex-col justify-center flex-1 min-w-0">
              <span 
                className="text-sm font-semibold text-slate-800 leading-tight truncate"
                title={profile?.full_name || profile?.email || "User"}
              >
                {profile?.full_name || "Loading..."}
              </span>
              <div className="mt-1">
                {profile?.role ? <RoleBadge role={profile.role} size="sm" /> : <span className="text-xs text-slate-500">Loading...</span>}
              </div>
            </div>
            <ChevronDown size={16} className={`text-slate-400 ml-1 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</p>
              </div>
              <Link 
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[var(--color-brand-orange)] transition"
              >
                <Settings size={16} />
                My Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
