-- Twinning sessions for paired practice
CREATE TABLE public.twinning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  employee_a_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_b_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  supervisor_user_id uuid REFERENCES auth.users(id),
  scheduled_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.twinning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and supervisors manage twinning" ON public.twinning_sessions FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Employees view own twinning sessions" ON public.twinning_sessions FOR SELECT TO authenticated
  USING (
    employee_a_id IN (SELECT id FROM public.employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
    employee_b_id IN (SELECT id FROM public.employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Checksheet templates library
CREATE TABLE public.checksheet_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checksheet_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors and admins manage templates" ON public.checksheet_templates FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'author')
  );

CREATE POLICY "Templates viewable by authenticated" ON public.checksheet_templates FOR SELECT TO authenticated
  USING (true);
