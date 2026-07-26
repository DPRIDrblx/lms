ALTER TABLE center_schedules
ADD COLUMN IF NOT EXISTS drive_link TEXT,
ADD COLUMN IF NOT EXISTS attendance_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS summary TEXT;

CREATE TABLE IF NOT EXISTS center_schedule_attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES center_schedules(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_id, student_id)
);
