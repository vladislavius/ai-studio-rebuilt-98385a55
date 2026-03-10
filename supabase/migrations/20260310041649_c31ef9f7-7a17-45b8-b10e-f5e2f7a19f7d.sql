
-- Add supervisor and author roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'author';

-- Programs table for grouping courses
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage programs" ON public.programs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Programs viewable by authenticated" ON public.programs FOR SELECT TO authenticated
  USING (true);

-- Program-courses junction
CREATE TABLE public.program_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  is_required boolean DEFAULT true,
  UNIQUE(program_id, course_id)
);

ALTER TABLE public.program_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage program courses" ON public.program_courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Program courses viewable by authenticated" ON public.program_courses FOR SELECT TO authenticated
  USING (true);

-- Course supervisors: assign supervisor to student+course
CREATE TABLE public.course_supervisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  supervisor_user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, employee_id)
);

ALTER TABLE public.course_supervisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage course supervisors" ON public.course_supervisors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors can view own assignments" ON public.course_supervisors FOR SELECT TO authenticated
  USING (supervisor_user_id = auth.uid());
CREATE POLICY "Course supervisors viewable by authenticated" ON public.course_supervisors FOR SELECT TO authenticated
  USING (true);
