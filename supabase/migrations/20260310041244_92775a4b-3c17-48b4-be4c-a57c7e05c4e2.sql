
CREATE TABLE public.student_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  answer_html text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, employee_id, step_id)
);

ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage student answers"
ON public.student_answers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view student answers"
ON public.student_answers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert student answers"
ON public.student_answers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update student answers"
ON public.student_answers FOR UPDATE
TO authenticated
USING (true);
