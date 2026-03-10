
-- Checkout requests table
CREATE TABLE public.checkout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  supervisor_notes TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

ALTER TABLE public.checkout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checkout requests" ON public.checkout_requests FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert checkout requests" ON public.checkout_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can view checkout requests" ON public.checkout_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update checkout requests" ON public.checkout_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Step artifacts table
CREATE TABLE public.step_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID
);

ALTER TABLE public.step_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage step artifacts" ON public.step_artifacts FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert step artifacts" ON public.step_artifacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can view step artifacts" ON public.step_artifacts FOR SELECT TO authenticated USING (true);

-- Storage bucket for course artifacts
INSERT INTO storage.buckets (id, name, public) VALUES ('course-artifacts', 'course-artifacts', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can upload course artifacts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-artifacts');
CREATE POLICY "Anyone can view course artifacts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'course-artifacts');
CREATE POLICY "Admins can delete course artifacts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'course-artifacts' AND has_role(auth.uid(), 'admin'::app_role));
