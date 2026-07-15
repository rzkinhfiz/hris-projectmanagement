import Link from "next/link";
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
  return (
    <aside className="w-64 bg-[var(--color-sidebar)] text-slate-300 flex flex-col h-full rounded-l-[2rem] overflow-hidden py-6 px-4">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 rounded-full bg-[var(--color-brand-orange)] flex items-center justify-center">
          <div className="w-4 h-4 bg-[var(--color-sidebar)] rounded-full border-2 border-[var(--color-brand-orange)]" />
        </div>
        <span className="text-xl font-semibold text-white tracking-wide">Promage</span>
      </div>

      {/* Primary Action Button */}
      <button className="bg-white text-slate-900 rounded-full py-3 px-4 flex items-center gap-2 mb-10 hover:bg-slate-100 transition shadow-sm font-medium">
        <div className="bg-[var(--color-brand-orange)] text-white rounded-full p-1">
          <Plus size={16} strokeWidth={3} />
        </div>
        Create new project
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 bg-white text-[var(--color-brand-orange)] px-4 py-3 rounded-full font-medium"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link 
          href="/projects" 
          className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-800 transition"
        >
          <Briefcase size={20} />
          Projects
        </Link>
        <Link 
          href="/tasks" 
          className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-800 transition"
        >
          <CheckSquare size={20} />
          Tasks
        </Link>
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-800 transition"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link 
          href="/time-log" 
          className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-800 transition"
        >
          <Clock size={20} />
          Time log
        </Link>
        <Link 
          href="/resources" 
          className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-800 transition"
        >
          <Users size={20} />
          Resource mgnt
        </Link>
        <Link 
          href="/users" 
          className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-800 transition"
        >
          <Users size={20} />
          Users
        </Link>
        <Link 
          href="/templates" 
          className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-800 transition"
        >
          <FileText size={20} />
          Project template
        </Link>
        <Link 
          href="/settings" 
          className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-800 transition"
        >
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
