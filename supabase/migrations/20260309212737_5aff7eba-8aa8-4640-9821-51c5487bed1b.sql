
-- ==============================================
-- HR System "Остров Сокровищ" — Full DB Schema
-- ==============================================

-- 1. Helper: update_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 3. User roles table (security-critical, separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read own roles, admins can read all
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- First user gets admin role
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT,
  color TEXT DEFAULT '#4C5CFF',
  icon TEXT DEFAULT 'Users',
  description TEXT,
  long_description TEXT,
  manager_name TEXT,
  goal TEXT,
  vfp TEXT,
  main_stat TEXT,
  sort_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.departments(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments viewable by authenticated"
  ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'Сотрудник',
  nickname TEXT,
  birth_date DATE,
  join_date DATE,
  email TEXT,
  email2 TEXT,
  phone TEXT,
  whatsapp TEXT,
  telegram TEXT,
  telegram_username TEXT,
  actual_address TEXT,
  registration_address TEXT,
  bank_name TEXT,
  bank_details TEXT,
  crypto_wallet TEXT,
  crypto_currency TEXT,
  crypto_network TEXT,
  inn TEXT,
  passport_number TEXT,
  passport_date TEXT,
  passport_issuer TEXT,
  foreign_passport TEXT,
  foreign_passport_date TEXT,
  foreign_passport_issuer TEXT,
  photo_url TEXT,
  additional_info TEXT,
  department_ids UUID[] DEFAULT '{}',
  subdepartment_ids UUID[] DEFAULT '{}',
  emergency_contacts JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees viewable by authenticated"
  ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert employees"
  ON public.employees FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update employees"
  ON public.employees FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete employees"
  ON public.employees FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_employees_department ON public.employees USING GIN(department_ids);
CREATE INDEX idx_employees_full_name ON public.employees(full_name);
CREATE INDEX idx_employees_birth_date ON public.employees(birth_date);

-- 7. Employee attachments
CREATE TABLE public.employee_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  document_category TEXT DEFAULT 'other',
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments viewable by authenticated"
  ON public.employee_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage attachments"
  ON public.employee_attachments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. Statistic definitions
CREATE TABLE public.statistic_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  calculation_method TEXT,
  purpose TEXT,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('company', 'department', 'employee')),
  owner_id TEXT,
  inverted BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_double BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.statistic_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stats defs viewable by authenticated"
  ON public.statistic_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage stat defs"
  ON public.statistic_definitions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_stat_defs_updated_at
  BEFORE UPDATE ON public.statistic_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Statistic values
CREATE TABLE public.statistic_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES public.statistic_definitions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  value2 NUMERIC,
  condition TEXT CHECK (condition IN ('non_existence', 'danger', 'emergency', 'normal', 'affluence', 'power', 'power_change')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.statistic_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stat values viewable by authenticated"
  ON public.statistic_values FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert stat values"
  ON public.statistic_values FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Admins can update stat values"
  ON public.statistic_values FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete stat values"
  ON public.statistic_values FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_stat_values_def_date ON public.statistic_values(definition_id, date);

-- 10. Candidates/Trainees
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (last_name || ' ' || first_name || COALESCE(' ' || middle_name, '')) STORED,
  position TEXT NOT NULL DEFAULT 'Кандидат',
  department_id UUID REFERENCES public.departments(id),
  status TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate', 'trainee', 'converted')),
  email TEXT,
  phone TEXT,
  telegram TEXT,
  birth_date DATE,
  start_date DATE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  converted_employee_id UUID REFERENCES public.employees(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates viewable by authenticated"
  ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage candidates"
  ON public.candidates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Onboarding templates
CREATE TABLE public.onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT,
  department_id UUID REFERENCES public.departments(id),
  tasks JSONB DEFAULT '[]',
  stage_structure JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates viewable by authenticated"
  ON public.onboarding_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage templates"
  ON public.onboarding_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. Onboarding instances
CREATE TABLE public.onboarding_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.onboarding_templates(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_completion_date DATE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0,
  tasks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Onboarding viewable by authenticated"
  ON public.onboarding_instances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage onboarding"
  ON public.onboarding_instances FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_onboarding_updated_at
  BEFORE UPDATE ON public.onboarding_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Report templates
CREATE TABLE public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  metrics JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Report templates viewable by authenticated"
  ON public.report_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage report templates"
  ON public.report_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 14. Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.report_templates(id),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports viewable by authenticated"
  ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage reports"
  ON public.reports FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 15. Courses (Academy)
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  sections JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  is_hst_course BOOLEAN DEFAULT false,
  duration_hours NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses viewable by authenticated"
  ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Course progress
CREATE TABLE public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0,
  completed_sections JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  certified BOOLEAN DEFAULT false,
  UNIQUE(course_id, employee_id)
);
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course progress viewable by authenticated"
  ON public.course_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage course progress"
  ON public.course_progress FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 17. Storage bucket for employee files
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-files', 'employee-files', true);

CREATE POLICY "Authenticated can view employee files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-files');

CREATE POLICY "Admins can upload employee files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete employee files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'employee-files' AND public.has_role(auth.uid(), 'admin'));
