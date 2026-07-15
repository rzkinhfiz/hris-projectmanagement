import React from "react";
import { Users } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="text-[var(--color-brand-orange)]" />
          Resources Management
        </h2>
        <p className="text-sm text-slate-500 mt-1">Monitor capacity and allocation of project teams.</p>
      </div>
      
      <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">Resource Allocation Skeleton</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            Team utilization metrics and charts will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
