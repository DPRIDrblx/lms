ALTER TABLE center_schedules
ADD COLUMN IF NOT EXISTS learning_objectives TEXT,
ADD COLUMN IF NOT EXISTS learning_methods TEXT;
