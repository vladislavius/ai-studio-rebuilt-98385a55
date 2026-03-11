
-- Extra assignments table
CREATE TABLE public.extra_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_date date,
  completed_at timestamptz,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.extra_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and supervisors manage extra assignments" ON public.extra_assignments FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Extra assignments viewable by authenticated" ON public.extra_assignments FOR SELECT TO authenticated
  USING (true);

-- Twinning feedback table
CREATE TABLE public.twinning_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.twinning_sessions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  rating integer NOT NULL DEFAULT 5,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, employee_id)
);

ALTER TABLE public.twinning_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and supervisors manage twinning feedback" ON public.twinning_feedback FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Authenticated can insert twinning feedback" ON public.twinning_feedback FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Twinning feedback viewable by authenticated" ON public.twinning_feedback FOR SELECT TO authenticated
  USING (true);
