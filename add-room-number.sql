-- Jalankan di SQL Editor Supabase

ALTER TABLE public.center_schedules 
ADD COLUMN IF NOT EXISTS room_number TEXT;
