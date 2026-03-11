-- HST Step Progress Migration
-- Phase 1-4: per-step tracking, word clearing logs

-- ─── course_step_progress ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS course_step_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  step_id         text NOT NULL,
  status          text NOT NULL DEFAULT 'not_started'
                    CHECK (status IN ('not_started','in_progress','pending_review','approved','rejected','retry')),
  artifact_url    text,
  artifact_name   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  checked         boolean NOT NULL DEFAULT false,
  checked_at      timestamptz,
  curator_notes   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, employee_id, step_id)
);

ALTER TABLE course_step_progress ENABLE ROW LEVEL SECURITY;

-- Employees see their own records
CREATE POLICY "employees_own_step_progress"
  ON course_step_progress
  FOR ALL
  USING (
    employee_id = (
      SELECT id FROM employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) LIMIT 1
    )
  );

-- Supervisors and admins see all records
CREATE POLICY "supervisors_see_all_step_progress"
  ON course_step_progress
  FOR ALL
  USING (
    has_role(auth.uid(), 'supervisor') OR has_role(auth.uid(), 'admin')
  );

-- ─── word_clearing_logs ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS word_clearing_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  step_id     text NOT NULL,
  term        text NOT NULL,
  definition  text,
  example     text,
  cleared     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE word_clearing_logs ENABLE ROW LEVEL SECURITY;

-- Employees see their own records
CREATE POLICY "employees_own_word_clearing"
  ON word_clearing_logs
  FOR ALL
  USING (
    employee_id = (
      SELECT id FROM employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) LIMIT 1
    )
  );

-- Supervisors and admins see all
CREATE POLICY "supervisors_see_all_word_clearing"
  ON word_clearing_logs
  FOR ALL
  USING (
    has_role(auth.uid(), 'supervisor') OR has_role(auth.uid(), 'admin')
  );

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_course_step_progress_course_employee
  ON course_step_progress (course_id, employee_id);

CREATE INDEX IF NOT EXISTS idx_word_clearing_logs_course_employee
  ON word_clearing_logs (course_id, employee_id);
