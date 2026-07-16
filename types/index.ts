export type UserRole = "project_team" | "project_manager" | "pmo" | "administrator";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  project_id: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client_name: string;
  description: string | null;
  status: "draft" | "active" | "on_hold" | "completed";
  pm_id: string | null;
  created_at: string;
  updated_at: string;
  // Gap Analysis Fields
  sales_order_no?: string | null;
  project_class?: string | null;
  contract_value_excl_tax?: number | null;
  nda_status?: "pending" | "done" | "not_required";
  spk_status?: "pending" | "done";
  internal_drive_url?: string | null;
  external_drive_url?: string | null;
  addendum_notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface CreateProjectPayload {
  code: string;
  name: string;
  client_name: string;
  description?: string;
  pm_id?: string;
  // Gap Analysis Fields
  sales_order_no?: string;
  project_class?: string;
  contract_value_excl_tax: number;
  nda_status: "pending" | "done" | "not_required";
  spk_status: "pending" | "done";
  internal_drive_url?: string;
  external_drive_url?: string;
  start_date?: string;
  end_date?: string;
  status?: "draft" | "active" | "on_hold" | "completed";
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
  priority: string;
  is_milestone: boolean;
  predecessor_task_id: string | null;
  estimated_hours: number;
  actual_hours: number;
  is_governance_readonly: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  project_id: string;
  name: string;
  owner_id: string | null;
  priority: string;
  planned_start: string | null;
  planned_end: string | null;
  estimated_hours: number;
}

export interface InvoicingTerm {
  id: string;
  project_id: string;
  term_number: number;
  billing_condition: string;
  term_percentage: number;
  target_invoice_amount: number;
  target_month: string | null;
  bast_date: string | null;
  invoice_status: string;
  pic_finance: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceAllocation {
  id: string;
  project_id: string;
  user_id: string;
  functional_role: string;
  workload_share: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectBudget {
  id: string;
  project_id: string;
  category: string;
  item_name: string;
  planned_amount: number;
  actual_amount: number;
  purchase_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface IssueAction {
  id: string;
  project_id: string;
  type: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  due_date: string | null;
  severity: string;
  status: string;
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

export interface ProjectIssueAndAction {
  id: string;
  project_id: string;
  type: "risk" | "issue" | "action_item" | "client_feedback";
  title: string;
  description: string;
  owner_id: string;
  due_date: string;
  severity: "low" | "medium" | "high" | "blocker";
  status: "open" | "in_progress" | "closed";
  created_at: string;
  updated_at: string;
}
