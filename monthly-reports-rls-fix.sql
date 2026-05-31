DROP POLICY IF EXISTS "Homeroom can manage monthly reports" ON public.monthly_reports;
CREATE POLICY "Homeroom can manage monthly reports" ON public.monthly_reports
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = public.monthly_reports.class_id 
    AND (wali_kelas_id = auth.uid() OR co_homeroom_id = auth.uid() OR supervisor_id = auth.uid())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = class_id 
    AND (wali_kelas_id = auth.uid() OR co_homeroom_id = auth.uid() OR supervisor_id = auth.uid())
  )
);
