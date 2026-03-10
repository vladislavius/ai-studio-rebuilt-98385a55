
CREATE POLICY "Authenticated can insert course progress"
ON public.course_progress FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update course progress"
ON public.course_progress FOR UPDATE
TO authenticated
USING (true);
