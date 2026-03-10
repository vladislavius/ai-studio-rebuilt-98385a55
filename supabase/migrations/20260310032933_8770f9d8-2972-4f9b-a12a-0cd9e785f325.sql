
CREATE TABLE public.training_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  step_id text,
  sender_id uuid NOT NULL,
  sender_name text,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'chat',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view training messages" ON public.training_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert training messages" ON public.training_messages
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage training messages" ON public.training_messages
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.training_messages;

CREATE INDEX idx_training_messages_course ON public.training_messages(course_id, employee_id);
CREATE INDEX idx_training_messages_step ON public.training_messages(course_id, employee_id, step_id);
