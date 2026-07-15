-- =========================================================
-- PMO Monitoring & Governance - Gap Enrichment Migration
-- Domain: Contract Admin, Invoicing, Resource Load, Budget, RAID Log
-- =========================================================

-- ---------------------------------------------------------
-- 1. ALTER PROJECTS TABLE (Domain 1: Contract Admin)
-- ---------------------------------------------------------
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS sales_order_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS project_class VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contract_value_excl_tax DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS addendum_notes TEXT,
  ADD COLUMN IF NOT EXISTS nda_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS spk_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS internal_drive_url TEXT,
  ADD COLUMN IF NOT EXISTS external_drive_url TEXT;

-- ---------------------------------------------------------
-- 2. ALTER TASKS TABLE (Domain 6: Advanced Gantt)
-- ---------------------------------------------------------
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS predecessor_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_hours INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_hours INTEGER DEFAULT 0;

-- ---------------------------------------------------------
-- 3. CREATE PROJECT INVOICING TERMS (Domain 2: Revenue)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_invoicing_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  term_number INTEGER NOT NULL,
  billing_condition TEXT NOT NULL,
  term_percentage DECIMAL(5,4) NOT NULL, -- e.g. 0.2000 for 20%
  target_invoice_amount DECIMAL(15,2) NOT NULL,
  target_month DATE,
  bast_date DATE,
  invoice_status VARCHAR(50) DEFAULT 'unbilled',
  pic_finance VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.project_invoicing_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read access for project members on project_invoicing_terms"
  ON public.project_invoicing_terms FOR SELECT
  USING (
    public.is_project_member(project_id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pmo')
  );

CREATE POLICY "Write access for PMO on project_invoicing_terms"
  ON public.project_invoicing_terms FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pmo'));

-- ---------------------------------------------------------
-- 4. CREATE PROJECT RESOURCE ALLOCATIONS (Domain 3: Resource Load)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  functional_role VARCHAR(100) NOT NULL,
  workload_share VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.project_resource_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read access for authenticated on project_resource_allocations"
  ON public.project_resource_allocations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Write access for PMO/PM on project_resource_allocations"
  ON public.project_resource_allocations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pmo', 'project_manager'))
  );

-- ---------------------------------------------------------
-- 5. CREATE PROJECT BUDGETS (Domain 4: Budgeting)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  item_name TEXT NOT NULL,
  planned_amount DECIMAL(15,2) DEFAULT 0.00,
  actual_amount DECIMAL(15,2) DEFAULT 0.00,
  purchase_date DATE,
  status VARCHAR(50) DEFAULT 'Planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read access for project members on project_budgets"
  ON public.project_budgets FOR SELECT
  USING (
    public.is_project_member(project_id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pmo')
  );

CREATE POLICY "Write access for PMO/PM on project_budgets"
  ON public.project_budgets FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pmo', 'project_manager'))
  );

-- ---------------------------------------------------------
-- 6. CREATE PROJECT ISSUES AND ACTIONS (Domain 5: RAID Log)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_issues_and_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- risk, issue, action_item, client_feedback
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  severity VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.project_issues_and_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read access for project members on project_issues_and_actions"
  ON public.project_issues_and_actions FOR SELECT
  USING (
    public.is_project_member(project_id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pmo')
  );

CREATE POLICY "Write access for project members on project_issues_and_actions"
  ON public.project_issues_and_actions FOR ALL
  USING (
    public.is_project_member(project_id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pmo')
  );
