ALTER TABLE quizzes ADD COLUMN allow_practice_mode BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN practice_time_limit_minutes INTEGER DEFAULT 0;
ALTER TABLE quizzes ADD COLUMN save_practice_scores BOOLEAN DEFAULT false;
