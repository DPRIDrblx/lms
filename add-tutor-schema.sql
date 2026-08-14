-- Add tutor features to center_schedules
ALTER TABLE public.center_schedules
ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS subtopic TEXT,
ADD COLUMN IF NOT EXISTS meeting_summary TEXT,
ADD COLUMN IF NOT EXISTS photo_start_url TEXT,
ADD COLUMN IF NOT EXISTS photo_end_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('scheduled', 'ongoing', 'completed')) DEFAULT 'scheduled';

-- Ensure center_schedule_attendances exists and has status
CREATE TABLE IF NOT EXISTS public.center_schedule_attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES public.center_schedules(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('hadir', 'sakit', 'izin', 'absen')) DEFAULT 'hadir',
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_id, student_id)
);

-- Add status column if it was created previously without it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='center_schedule_attendances' AND column_name='status') THEN
        ALTER TABLE public.center_schedule_attendances ADD COLUMN status TEXT CHECK (status IN ('hadir', 'sakit', 'izin', 'absen')) DEFAULT 'hadir';
    END IF;
END $$;
