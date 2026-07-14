import type { ReactNode } from "react";

export type KpiStatus = "green" | "yellow" | "red";

type KpiCardProps = {
  title: string;
  value: string | number;
  status: KpiStatus;
  icon?: ReactNode;
};

const statusStyles: Record<KpiStatus, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  yellow: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
};

export function KpiCard({ title, value, status, icon }: KpiCardProps) {
  return (
    <section className={`rounded-[2rem] border p-6 shadow-md ${statusStyles[status]}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium uppercase tracking-wide opacity-80">{title}</p>
        {icon ? <span className="text-xl">{icon}</span> : null}
      </div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
    </section>
  );
}
