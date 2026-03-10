
CREATE TABLE public.course_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  description text,
  sections jsonb DEFAULT '[]'::jsonb,
  is_hst_course boolean DEFAULT false,
  duration_hours numeric,
  change_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.course_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage course versions" ON public.course_versions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Course versions viewable by authenticated" ON public.course_versions FOR SELECT TO authenticated
  USING (true);
