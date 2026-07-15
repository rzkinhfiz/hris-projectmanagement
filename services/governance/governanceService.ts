import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { getProjectDetails } from "../projectService";
import { getTasksByProject } from "../taskService";
import { compareCost, compareProgress, compareSchedule } from "./comparator";
import { getWarningForComparison } from "./warnings";
import { resolveWarningAudit } from "../auditService";

function createServiceError(message: string): PostgrestError {
  return {
    message,
    code: "500",
    details: "",
    hint: "",
    toJSON: () => ({ message, code: "500", details: "", hint: "" }),
    name: "ServiceError",
  } as PostgrestError;
}

type GovernanceAssessmentResult = {
  indicatorsInserted: number;
  warningsInserted: number;
  error: PostgrestError | null;
};

export async function resolveGovernanceWarning(warningId: string, performerId: string): Promise<{ success: boolean; error: PostgrestError | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: createServiceError("Supabase client is unavailable."),
    };
  }

  const { data: warningData, error: warningError } = await supabase
    .from("governance_warnings")
    .update({ is_resolved: true })
    .eq("id", warningId)
    .select("*")
    .maybeSingle();

  if (warningError || !warningData) {
    return {
      success: false,
      error: warningError ?? createServiceError("Warning could not be updated."),
    };
  }

  const auditResult = await resolveWarningAudit(
    warningData as {
      id: string;
      project_id: string;
      warning_code: string;
      message: string;
      level: "info" | "warning" | "critical";
      triggered_by: string;
      is_resolved: boolean;
      created_at: string;
    },
    performerId,
  );

  if (auditResult.error) {
    return {
      success: false,
      error: auditResult.error,
    };
  }

  return {
    success: true,
    error: null,
  };
}

export async function assessProjectHealth(projectId: string): Promise<GovernanceAssessmentResult> {
  const { data: project, error: projectError } = await getProjectDetails(projectId);

  if (projectError || !project) {
    return {
      indicatorsInserted: 0,
      warningsInserted: 0,
      error: projectError,
    };
  }

  const { data: tasks, error: tasksError } = await getTasksByProject(projectId);

  if (tasksError) {
    return {
      indicatorsInserted: 0,
      warningsInserted: 0,
      error: tasksError,
    };
  }

  const scheduleResult = compareSchedule(project.end_date ?? null, project.end_date ?? null);
  const costResult = compareCost(1000, 1100);
  const progressResult = compareProgress(50, tasks.reduce((sum, task) => sum + task.progress, 0) / Math.max(tasks.length, 1));

  const results = [scheduleResult, costResult, progressResult];
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      indicatorsInserted: 0,
      warningsInserted: 0,
      error: createServiceError("Supabase client is unavailable."),
    };
  }

  const indicatorPayloads = results.map((result) => ({
    project_id: projectId,
    indicator_type: result.metric,
    planned_value: result.planned,
    actual_value: result.actual,
    status: result.status,
    updated_at: new Date().toISOString(),
  }));

  const { error: indicatorsError } = await supabase
    .from("governance_indicators")
    .insert(indicatorPayloads);

  if (indicatorsError) {
    return {
      indicatorsInserted: 0,
      warningsInserted: 0,
      error: indicatorsError,
    };
  }

  const warningPayloads = results
    .map((result) => getWarningForComparison(result, projectId))
    .filter((warning): warning is NonNullable<typeof warning> => warning !== null);

  let warningsInserted = 0;
  if (warningPayloads.length > 0) {
    const { error: warningsError } = await supabase
      .from("governance_warnings")
      .insert(warningPayloads);

    if (warningsError) {
      return {
        indicatorsInserted: indicatorPayloads.length,
        warningsInserted: 0,
        error: warningsError,
      };
    }

    warningsInserted = warningPayloads.length;
  }

  return {
    indicatorsInserted: indicatorPayloads.length,
    warningsInserted,
    error: null,
  };
}
