"use client";

import { RoleGuard } from "./RoleGuard";

export type WarningItem = {
  id: string;
  warning_code: string;
  message: string;
  level: "info" | "warning" | "critical";
  triggered_by: string;
};

type WarningPanelProps = {
  warnings: WarningItem[];
  role: "project_team" | "project_manager" | "pmo";
};

export function WarningPanel({ warnings, role }: WarningPanelProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Governance Warnings</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
          {warnings.length} active
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {warnings.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            No active warnings.
          </p>
        ) : (
          warnings.map((warning) => (
            <div key={warning.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{warning.warning_code}</p>
                <p className="mt-1 text-sm text-slate-600">{warning.message}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  Triggered by {warning.triggered_by}
                </p>
              </div>
              <RoleGuard currentRole={role} allowed={["pmo"]}>
                <button
                  type="button"
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
                >
                  Resolve Warning
                </button>
              </RoleGuard>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
