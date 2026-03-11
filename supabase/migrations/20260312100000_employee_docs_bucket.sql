-- Storage bucket for course builder materials and employee documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-docs', 'employee-docs', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated users can upload to employee-docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-docs');

CREATE POLICY "Anyone can view employee-docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-docs');

CREATE POLICY "Admins and authors can delete from employee-docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'employee-docs' AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'author')
    )
  );

CREATE POLICY "Authenticated users can update employee-docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'employee-docs');
