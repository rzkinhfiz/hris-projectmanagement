-- 18-task-status-expansion.sql
-- Description: Expand task status to 6 workflow stages and migrate old data.

-- 1. Migrate old 'To Do' / 'TODO' / 'planned' to 'TO_DO'
UPDATE public.tasks
SET status = 'TO_DO'
WHERE status IN ('TODO', 'To Do', 'planned', 'To do');

-- 2. Migrate 'In Progress' to 'IN_PROGRESS'
UPDATE public.tasks
SET status = 'IN_PROGRESS'
WHERE status IN ('In Progress', 'In progress');

-- 3. Migrate 'Completed' to 'DONE'
UPDATE public.tasks
SET status = 'DONE'
WHERE status IN ('Completed');

-- 4. Add check constraint to ensure only valid statuses are used
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('DRAFT', 'BACKLOG', 'TO_DO', 'IN_PROGRESS', 'REVIEW', 'DONE'));
