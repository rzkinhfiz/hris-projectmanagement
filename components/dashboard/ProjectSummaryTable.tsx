import React from "react";

const statuses = {
  Completed: "bg-emerald-100 text-emerald-600",
  Delayed: "bg-amber-100 text-amber-600",
  "At risk": "bg-rose-100 text-rose-600",
  "On going": "bg-orange-100 text-orange-600",
};

export function ProjectSummaryTable() {
  const projects = [
    { name: "Nelsa web developement", manager: "Om prakash sao", date: "May 25, 2023", status: "Completed", progress: 100 },
    { name: "Datascale AI app", manager: "Neilsan mando", date: "Jun 20, 2023", status: "Delayed", progress: 35 },
    { name: "Media channel branding", manager: "Tiruvelly priya", date: "July 13, 2023", status: "At risk", progress: 68 },
    { name: "Corlax iOS app develpoement", manager: "Matte hannery", date: "Dec 20, 2023", status: "Completed", progress: 100 },
    { name: "Website builder developement", manager: "Sukumar rao", date: "Mar 15, 2024", status: "On going", progress: 50 },
  ];

  const renderProgressRing = (progress: number) => {
    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    // Determine color based on progress or status
    let strokeColor = "text-emerald-500";
    if (progress < 100 && progress > 50) strokeColor = "text-orange-500";
    if (progress <= 50) strokeColor = "text-amber-500";
    if (progress === 100) strokeColor = "text-emerald-500";

    return (
      <div className="relative flex items-center justify-center w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90">
          <circle
            className="text-slate-100"
            strokeWidth="3"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="16"
            cy="16"
          />
          <circle
            className={strokeColor}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="16"
            cy="16"
          />
        </svg>
        <span className="absolute text-[9px] font-bold text-slate-700">{progress}%</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Project summary</h3>
        <div className="flex gap-2">
          {["Project", "Project manager", "Status"].map((filter) => (
            <button key={filter} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition">
              {filter}
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="pb-4 text-xs font-semibold text-slate-800">Name</th>
              <th className="pb-4 text-xs font-semibold text-slate-800">Project manager</th>
              <th className="pb-4 text-xs font-semibold text-slate-800">Due date</th>
              <th className="pb-4 text-xs font-semibold text-slate-800">Status</th>
              <th className="pb-4 text-xs font-semibold text-slate-800 text-center">Progress</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, idx) => (
              <tr key={idx} className="group">
                <td className="py-3 text-sm text-slate-600 font-medium">{project.name}</td>
                <td className="py-3 text-sm text-slate-500">{project.manager}</td>
                <td className="py-3 text-sm text-slate-500">{project.date}</td>
                <td className="py-3">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${statuses[project.status as keyof typeof statuses]}`}>
                    {project.status}
                  </span>
                </td>
                <td className="py-3 flex justify-center">
                  {renderProgressRing(project.progress)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
