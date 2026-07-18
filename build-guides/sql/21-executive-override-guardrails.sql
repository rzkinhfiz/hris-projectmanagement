-- ==============================================================================
-- Migration: 21-executive-override-guardrails
-- Purpose: Add audit columns for executive oversight on approvals
-- ==============================================================================

-- 1. Extend time_logs table
ALTER TABLE time_logs
ADD COLUMN approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN is_executive_override BOOLEAN DEFAULT false;

-- 2. Extend tasks table
ALTER TABLE tasks
ADD COLUMN approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN is_executive_override BOOLEAN DEFAULT false;

-- 3. Optionally add comments for schema documentation
COMMENT ON COLUMN time_logs.approved_by IS 'Profile ID of the user who approved this time log';
COMMENT ON COLUMN time_logs.is_executive_override IS 'True if approved by a PMO/Admin who is not the project manager';
COMMENT ON COLUMN tasks.approved_by IS 'Profile ID of the user who approved/marked the task as done';
COMMENT ON COLUMN tasks.is_executive_override IS 'True if approved by a PMO/Admin who is not the project manager';
