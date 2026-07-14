import type { Project } from "../types";

export type ProjectTableRow = Pick<Project, "id" | "code" | "name" | "pm_id" | "status"> & {
  scheduleStatus: "green" | "yellow" | "red";
  costStatus: "green" | "yellow" | "red";
  healthStatus: "green" | "yellow" | "red";
};

type ProjectTableProps = {
  projects: ProjectTableRow[];
};

const badgeStyles: Record<"green" | "yellow" | "red", string> = {
  green: "bg-emerald-50 text-emerald-700",
  yellow: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
};

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-md">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Project Monitoring</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-white text-left text-slate-600">
            <tr>
              <th className="px-6 py-3 font-medium">Kode Proyek</th>
              <th className="px-6 py-3 font-medium">Nama Proyek</th>
              <th className="px-6 py-3 font-medium">PM</th>
              <th className="px-6 py-3 font-medium">Status Jadwal</th>
              <th className="px-6 py-3 font-medium">Status Biaya</th>
              <th className="px-6 py-3 font-medium">Status Kesehatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 font-semibold">{project.code}</td>
                <td className="px-6 py-4">{project.name}</td>
                <td className="px-6 py-4">{project.pm_id ?? "—"}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[project.scheduleStatus]}`}>
                    {project.scheduleStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[project.costStatus]}`}>
                    {project.costStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[project.healthStatus]}`}>
                    {project.healthStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
