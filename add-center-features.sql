ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_seen_center_update BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS e_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  drive_link TEXT NOT NULL,
  grade_level VARCHAR(50),
  class_id UUID REFERENCES classes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS center_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  schedule_time TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
