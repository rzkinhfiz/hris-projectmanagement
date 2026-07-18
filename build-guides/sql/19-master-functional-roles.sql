-- Migration 19: Master Functional Roles
-- Creates a master table for standardized role selection in Resource Load management

CREATE TABLE public.functional_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    department TEXT,
    default_hourly_rate NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.functional_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Select (All authenticated users can see active roles)
CREATE POLICY "Users can view active functional roles"
    ON public.functional_roles FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

-- Policy: Insert/Update/Delete (Only pmo and administrator)
CREATE POLICY "PMO and Admin can insert functional roles"
    ON public.functional_roles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pmo', 'administrator')
        )
    );

CREATE POLICY "PMO and Admin can update functional roles"
    ON public.functional_roles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pmo', 'administrator')
        )
    );

CREATE POLICY "PMO and Admin can delete functional roles"
    ON public.functional_roles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pmo', 'administrator')
        )
    );

-- Seed Data (10-15 standard roles)
INSERT INTO public.functional_roles (name, department, default_hourly_rate) VALUES
    ('Project Manager', 'Project Management Office', 150000),
    ('Scrum Master', 'Project Management Office', 130000),
    ('UI/UX Designer', 'Design', 120000),
    ('Frontend Developer', 'Engineering', 130000),
    ('Backend Developer', 'Engineering', 140000),
    ('Fullstack Developer', 'Engineering', 160000),
    ('Mobile Developer', 'Engineering', 140000),
    ('DevOps Engineer', 'Engineering', 170000),
    ('QA Engineer', 'Quality Assurance', 110000),
    ('System Analyst', 'Engineering', 135000),
    ('Data Scientist', 'Data', 180000),
    ('Data Engineer', 'Data', 160000),
    ('Business Analyst', 'Product', 140000),
    ('Product Manager', 'Product', 165000),
    ('Technical Writer', 'Product', 100000)
ON CONFLICT (name) DO NOTHING;
