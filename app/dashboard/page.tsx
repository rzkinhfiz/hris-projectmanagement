import { KpiCard } from "../../components/KpiCard";
import { ProjectTable } from "../../components/ProjectTable";
import { WarningPanel } from "../../components/WarningPanel";
import { assessProjectHealth } from "../../services/governance/governanceService";
import { getProjects } from "../../services/projectService";
import { createClient } from "../../utils/supabase/server";
import { cookies } from "next/headers";
import LogoutClient from "../../components/LogoutClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

  let role: "project_team" | "project_manager" | "pmo" = "project_team";
  let projects: Array<{ id: string; code: string; name: string; pm_id: string | null; status: string }> = [];

  if (hasSupabaseConfig) {
    try {
      const supabase = createClient(cookieStore);
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData.user;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, project_id")
        .eq("id", user?.id ?? "")
        .maybeSingle();

      role = (profileData?.role as "project_team" | "project_manager" | "pmo" | undefined) ?? "project_team";

      const { data } = await getProjects();
      projects = data ?? [];

      if (projects.length > 0) {
        await assessProjectHealth(projects[0].id);
      }
    } catch {
      role = "project_team";
      projects = [];
    }
  }

  const dashboardProjects = projects.map((project) => ({
    id: project.id,
    code: project.code,
    name: project.name,
    pm_id: project.pm_id,
    status: project.status,
    scheduleStatus: "green" as const,
    costStatus: "yellow" as const,
    healthStatus: "green" as const,
  }));

  const warnings = [
    {
      id: "warning-1",
      warning_code: "SCHEDULE_YELLOW",
      message: "Schedule variance exceeded the monitored threshold.",
      level: "warning" as const,
      triggered_by: "system",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
          <div className="flex items-start gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                Monitoring Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Project Health Overview
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                Read-only monitoring view for governance indicators, schedule health, and active warnings.
              </p>
            </div>
            <div className="ml-auto">
              <LogoutClient />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <KpiCard title="Cost Variance" value="+8.4%" status="yellow" icon="💰" />
          <KpiCard title="Schedule Variance" value="-3.2 days" status="green" icon="📅" />
          <KpiCard title="Progress Deviation" value="12.1%" status="red" icon="📈" />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          <ProjectTable projects={dashboardProjects} />
          <WarningPanel warnings={warnings} role={role} />
        </section>
      </div>
    </main>
  );
}
