
-- Fix: restrict stat values insert to require created_by = auth.uid()
DROP POLICY "Authenticated can insert stat values" ON public.statistic_values;
CREATE POLICY "Authenticated can insert stat values"
  ON public.statistic_values FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
