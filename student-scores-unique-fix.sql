-- Hapus data ganda (jika ada) dengan pendekatan yang benar untuk UUID
DELETE FROM public.student_scores
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER(PARTITION BY student_id, target_id ORDER BY created_at DESC) as rn
    FROM public.student_scores
  ) t
  WHERE t.rn > 1
);

-- Pasang aturan Unik (Unique Constraint) agar fitur Save (Upsert) bekerja sempurna!
ALTER TABLE public.student_scores DROP CONSTRAINT IF EXISTS student_scores_student_id_target_id_key;
ALTER TABLE public.student_scores ADD CONSTRAINT student_scores_student_id_target_id_key UNIQUE(student_id, target_id);
