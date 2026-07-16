CREATE TYPE activity_module AS ENUM ('METADATA', 'BUDGET', 'RESOURCE_LOAD', 'RAID_LOG', 'TASKS', 'TERMS_REVENUE');
CREATE TYPE action_type AS ENUM ('CREATE', 'UPDATE', 'DELETE');

CREATE TABLE project_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES profiles(id),
    module activity_module NOT NULL,
    action_type action_type NOT NULL,
    item_label TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE project_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PMs can view project activity logs" 
ON project_activity_logs FOR SELECT 
USING (is_project_member(project_id));

CREATE POLICY "PMs can insert project activity logs" 
ON project_activity_logs FOR INSERT 
WITH CHECK (is_project_member(project_id));
