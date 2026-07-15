import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { ProjectSummaryTable } from "@/components/dashboard/ProjectSummaryTable";
import { OverallProgress } from "@/components/dashboard/OverallProgress";
import { ProjectsWorkload } from "@/components/dashboard/ProjectsWorkload";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <OverviewCards />
      
      <div className="grid grid-cols-12 gap-6 h-auto">
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
          <ProjectSummaryTable />
          
          {/* Today Task section as requested by image but let's just make a placeholder mimicking it */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex-1">
             <div className="flex items-center gap-6 mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800">Today task</h3>
                <div className="flex gap-4">
                  <span className="text-sm font-medium text-slate-400">All <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs ml-1">10</span></span>
                  <span className="text-sm font-medium text-[var(--color-brand-orange)] border-b-2 border-[var(--color-brand-orange)] pb-4 -mb-4">Important</span>
                  <span className="text-sm font-medium text-slate-400">Notes <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs ml-1">05</span></span>
                  <span className="text-sm font-medium text-slate-400">Links <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs ml-1">10</span></span>
                </div>
             </div>
             
             <ul className="space-y-4">
                {[
                  { text: "Create a user flow of social application design", status: "Approved", color: "bg-emerald-100 text-emerald-600", check: "bg-[var(--color-brand-orange)]" },
                  { text: "Create a user flow of social application design", status: "In review", color: "bg-rose-100 text-rose-600", check: "bg-[var(--color-brand-orange)]" },
                  { text: "Landing page design for Fintech project of singapore", status: "In review", color: "bg-rose-100 text-rose-600", check: "bg-[var(--color-brand-orange)]" },
                  { text: "Interactive prototype for app screens of deltamine project", status: "On going", color: "bg-emerald-100 text-emerald-600", check: "border border-slate-300" },
                  { text: "Interactive prototype for app screens of deltamine project", status: "Approved", color: "bg-emerald-100 text-emerald-600", check: "bg-[var(--color-brand-orange)]" },
                ].map((task, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${task.check}`}>
                         {task.check.includes('bg') && (
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                         )}
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{task.text}</span>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${task.color}`}>
                      {task.status}
                    </span>
                  </li>
                ))}
             </ul>
          </div>
        </div>
        
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          <div className="h-[320px]">
             <OverallProgress />
          </div>
          <div className="h-[320px]">
             <ProjectsWorkload />
          </div>
        </div>
      </div>
    </div>
  );
}
