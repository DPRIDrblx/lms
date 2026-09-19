-- Add description and theme_color columns to quizzes table
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(50);
