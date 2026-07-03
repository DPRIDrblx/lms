-- supervisi-breakdown.sql

-- Add columns to store the individual scores from the HoD's clinical supervision
ALTER TABLE ace_performances ADD COLUMN IF NOT EXISTS hod_score_1 INTEGER;
ALTER TABLE ace_performances ADD COLUMN IF NOT EXISTS hod_score_2 INTEGER;
ALTER TABLE ace_performances ADD COLUMN IF NOT EXISTS hod_score_3 INTEGER;
ALTER TABLE ace_performances ADD COLUMN IF NOT EXISTS hod_score_4 INTEGER;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
