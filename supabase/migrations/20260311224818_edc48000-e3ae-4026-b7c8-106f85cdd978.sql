
-- Twinning sessions for paired practice
CREATE TABLE public.twinning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  employee_a_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_b_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  supervisor_user_id uuid,
  scheduled_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
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
  USING (true);

-- Checksheet templates library
CREATE TABLE public.checksheet_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
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

-- Badges table
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text DEFAULT '🏆',
  condition_type text NOT NULL DEFAULT 'course_complete',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage badges" ON public.badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Badges viewable by authenticated" ON public.badges FOR SELECT TO authenticated
  USING (true);

-- Student badges
CREATE TABLE public.student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, badge_id, course_id)
);

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage student badges" ON public.student_badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can insert student badges" ON public.student_badges FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Student badges viewable by authenticated" ON public.student_badges FOR SELECT TO authenticated
  USING (true);

-- Supervisor step comments
CREATE TABLE public.supervisor_step_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  supervisor_user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supervisor_step_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and supervisors manage comments" ON public.supervisor_step_comments FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Comments viewable by authenticated" ON public.supervisor_step_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert comments" ON public.supervisor_step_comments FOR INSERT TO authenticated
  WITH CHECK (true);

-- Validation trigger for twinning_sessions status
CREATE OR REPLACE FUNCTION public.validate_twinning_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'scheduled', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid twinning session status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_twinning_status
  BEFORE INSERT OR UPDATE ON public.twinning_sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_twinning_status();
