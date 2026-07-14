export type UserRole = "project_team" | "project_manager" | "pmo";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  pm_id: string | null;
  pmo_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workstream {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  level: "L1" | "L2" | "L3";
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  workstream_id: string | null;
  name: string;
  owner_id: string | null;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  progress: number;
  status: string;
  is_governance_readonly: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgressUpdate {
  id: string;
  task_id: string;
  project_id: string;
  updated_by: string;
  update_date: string;
  progress: number;
  note: string | null;
}

export interface GovernanceIndicator {
  id: string;
  project_id: string;
  indicator_type: string;
  planned_value: number | null;
  actual_value: number | null;
  status: string;
  updated_at: string;
}

export interface GovernanceWarning {
  id: string;
  project_id: string;
  warning_code: string;
  message: string;
  level: "info" | "warning" | "critical";
  triggered_by: string;
  is_resolved: boolean;
  created_at: string;
}
