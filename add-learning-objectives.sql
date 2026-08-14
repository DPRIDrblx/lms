-- Jalankan di SQL Editor Supabase

ALTER TABLE public.center_schedules 
ADD COLUMN IF NOT EXISTS learning_objectives TEXT,
ADD COLUMN IF NOT EXISTS learning_methods TEXT;
