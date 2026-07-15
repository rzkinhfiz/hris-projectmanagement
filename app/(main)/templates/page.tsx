import React from "react";
import { LayoutTemplate } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutTemplate className="text-[var(--color-brand-orange)]" />
            Project Templates
          </h2>
          <p className="text-sm text-slate-500 mt-1">Standardize project baselines and WBS templates.</p>
        </div>
        <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm">
          Browse Catalog
        </button>
      </div>
      
      <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LayoutTemplate size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">Template Directory Skeleton</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            Library of predefined project structures will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
