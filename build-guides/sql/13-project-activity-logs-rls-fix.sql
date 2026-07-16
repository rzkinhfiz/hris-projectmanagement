DROP POLICY IF EXISTS "PMs can view project activity logs" ON project_activity_logs;
DROP POLICY IF EXISTS "PMs can insert project activity logs" ON project_activity_logs;

CREATE POLICY "Activity logs select" 
ON project_activity_logs FOR SELECT 
USING (
  is_project_member(project_id) 
  OR is_pmo() 
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrator'
);

CREATE POLICY "Activity logs insert" 
ON project_activity_logs FOR INSERT 
WITH CHECK (
  is_project_member(project_id) 
  OR is_pmo() 
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrator'
);
