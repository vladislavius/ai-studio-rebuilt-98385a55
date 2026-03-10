-- Twinning session feedback
CREATE TABLE public.twinning_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.twinning_sessions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, employee_id)
);
ALTER TABLE public.twinning_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own twinning feedback" ON public.twinning_feedback FOR ALL TO authenticated USING (true);

-- Supervisor comments on student steps
CREATE TABLE public.supervisor_step_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  comment text NOT NULL,
  supervisor_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supervisor_step_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supervisors manage step comments" ON public.supervisor_step_comments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Students view own step comments" ON public.supervisor_step_comments FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Extra assignments from supervisor to student
CREATE TABLE public.extra_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_date date,
  completed_at timestamptz,
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.extra_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supervisors manage extra assignments" ON public.extra_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Students view own extra assignments" ON public.extra_assignments FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));
CREATE POLICY "Students complete own extra assignments" ON public.extra_assignments FOR UPDATE TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Badges definition
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🏆',
  condition_type text NOT NULL CHECK (condition_type IN ('course_complete', 'program_complete', 'first_course', 'certified')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by all" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage badges" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Student earned badges
CREATE TABLE public.student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, badge_id, course_id)
);
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Student badges viewable by authenticated" ON public.student_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "System awards badges" ON public.student_badges FOR INSERT TO authenticated USING (true);

-- Seed default badges
INSERT INTO public.badges (title, description, icon, condition_type) VALUES
  ('Первый курс', 'Завершил первый курс', '🌟', 'first_course'),
  ('Курс завершён', 'Успешно прошёл курс', '📚', 'course_complete'),
  ('Сертифицирован', 'Получил сертификат', '🏆', 'certified'),
  ('Программа пройдена', 'Завершил программу обучения', '🎓', 'program_complete');
