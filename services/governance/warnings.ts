import type { ComparisonResult } from "./comparator";

export interface GovernanceWarningPayload {
  project_id: string;
  warning_code: string;
  message: string;
  level: "info" | "warning" | "critical";
  triggered_by: string;
  is_resolved: boolean;
}

export function getWarningForComparison(
  result: ComparisonResult,
  projectId: string,
  taskId?: string,
): GovernanceWarningPayload | null {
  if (result.status === "green") {
    return null;
  }

  const label = result.metric === "schedule"
    ? "schedule"
    : result.metric === "cost"
      ? "cost"
      : "progress";

  const severity = result.status === "red" ? "critical" : "warning";
  const message = `${label} variance is ${result.status.toUpperCase()} (${result.variancePct.toFixed(1)}%).`;

  return {
    project_id: projectId,
    warning_code: `${label.toUpperCase()}_${result.status.toUpperCase()}`,
    message,
    level: severity,
    triggered_by: taskId ?? "system",
    is_resolved: false,
  };
}
