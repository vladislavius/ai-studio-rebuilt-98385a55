
CREATE TABLE IF NOT EXISTS public.adminscale_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Новая шкала',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.adminscale_scales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scales" ON public.adminscale_scales
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all scales" ON public.adminscale_scales
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
