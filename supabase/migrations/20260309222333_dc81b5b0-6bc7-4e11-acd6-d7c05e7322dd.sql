
-- Table for department diagnostics (problems and actions)
CREATE TABLE public.department_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('problem', 'action')),
  text text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.department_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diagnostics viewable by authenticated" ON public.department_diagnostics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage diagnostics" ON public.department_diagnostics
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Table for company-level settings (founder/CEO titles, company goal, VFP, etc.)
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by authenticated" ON public.company_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage settings" ON public.company_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default company settings
INSERT INTO public.company_settings (key, value) VALUES
('founder_title', 'Основатель'),
('founder_subtitle', 'Стратегическое руководство'),
('ceo_title', 'Генеральный директор'),
('ceo_subtitle', 'Операционное управление'),
('company_goal', 'Быть лидером туристического рынка Таиланда. Стать ведущей международной компанией в сфере организации незабываемых и интересных экскурсий, обеспечивая нашим туристам яркие впечатления и долгие воспоминания.'),
('company_vfp', 'Восторженные туристы, получившие незабываемые впечатления от интересных экскурсий, с радостью рекомендуют нас другим и снова обращаются за нашими услугами.');
