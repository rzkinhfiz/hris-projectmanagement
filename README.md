# PMO Project Management

## QA Verification Guide

### Audit logging
- Confirm that successful progress updates create a new row in the `audit_logs` table with `entity = 'Task'`, `action = 'UPDATE_PROGRESS'`, and the new progress value in `details`.
- Confirm that warning resolution creates a new row in the `audit_logs` table with `entity = 'Warning'` and `action = 'RESOLVE_WARNING'`.

### RLS access verification
- Sign in as a `project_team` user and attempt to insert/update/delete rows in `governance_indicators` or `governance_warnings`.
- The request should be blocked by RLS and the UI should not expose edit controls in the monitoring dashboard for non-PMO users.
- Sign in as a `pmo` user and confirm that the governance warning action remains available and that audit entries are recorded.
