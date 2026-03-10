
-- Glossary terms table
CREATE TABLE public.glossary_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  example TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Word clearing logs - when students mark words as unclear
CREATE TABLE public.word_clearing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  term TEXT NOT NULL,
  glossary_term_id UUID REFERENCES public.glossary_terms(id) ON DELETE SET NULL,
  cleared BOOLEAN NOT NULL DEFAULT false,
  student_definition TEXT,
  student_example TEXT,
  cleared_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for glossary_terms
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage glossary" ON public.glossary_terms
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Glossary viewable by authenticated" ON public.glossary_terms
  FOR SELECT TO authenticated
  USING (true);

-- RLS for word_clearing_logs
ALTER TABLE public.word_clearing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage word clearing logs" ON public.word_clearing_logs
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Word clearing logs viewable by authenticated" ON public.word_clearing_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert word clearing logs" ON public.word_clearing_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update own word clearing logs" ON public.word_clearing_logs
  FOR UPDATE TO authenticated
  USING (true);
