"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Clock, 
  Users, 
  FileText, 
  Settings,
  HelpCircle,
  Plus
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    // If the path is dashboard, we only want exact matches, otherwise check startsWith
    const isActive = path === "/dashboard" 
      ? pathname === "/dashboard" 
      : pathname.startsWith(path);
      
    if (isActive) {
      return "flex items-center gap-3 bg-white text-[var(--color-brand-orange)] px-4 py-3 rounded-full font-medium shadow-sm transition";
    }
    return "flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-800 text-slate-300 transition font-medium";
  };

  return (
    <aside className="w-64 bg-[var(--color-sidebar)] text-slate-300 flex flex-col h-full rounded-l-[2rem] overflow-hidden py-6 px-4">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-10 pt-4">
        {/* Abstract logo mark */}
        <div className="relative w-8 h-8 rounded-full bg-[var(--color-brand-orange)] flex items-center justify-center shrink-0">
          <div className="w-3 h-3 rounded-full bg-[var(--color-sidebar)]"></div>
        </div>
        <span className="text-white text-xl font-bold tracking-wide leading-tight">
          Project Management
        </span>
      </div>

      {/* Primary Action Button */}
      <Link href="/projects/create" className="bg-white text-slate-900 rounded-full py-3 px-4 flex items-center gap-2 mb-10 hover:bg-slate-100 transition shadow-sm font-medium">
        <div className="bg-[var(--color-brand-orange)] text-white rounded-full p-1">
          <Plus size={16} strokeWidth={3} />
        </div>
        Create new project
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <Link href="/dashboard" className={getLinkClass("/dashboard")}>
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link href="/projects" className={getLinkClass("/projects")}>
          <Briefcase size={20} />
          Projects
        </Link>
        <Link href="/tasks" className={getLinkClass("/tasks")}>
          <CheckSquare size={20} />
          Tasks
        </Link>
        <Link href="/time-log" className={getLinkClass("/time-log")}>
          <Clock size={20} />
          Time log
        </Link>
        <Link href="/resources" className={getLinkClass("/resources")}>
          <Users size={20} />
          Resource mgnt
        </Link>
        <Link href="/users" className={getLinkClass("/users")}>
          <Users size={20} />
          Users
        </Link>
        <Link href="/templates" className={getLinkClass("/templates")}>
          <FileText size={20} />
          Project template
        </Link>
        <Link href="/settings" className={getLinkClass("/settings")}>
          <Settings size={20} />
          Menu settings
        </Link>
      </nav>

      {/* Footer / Help */}
      <div className="mt-auto pt-6 px-2">
        <button className="w-10 h-10 rounded-full bg-[var(--color-brand-orange)] text-white flex items-center justify-center hover:bg-orange-600 transition">
          <HelpCircle size={20} />
        </button>
      </div>
    </aside>
  );
}
