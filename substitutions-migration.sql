
ALTER TABLE ace_substitutions ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES ace_schedules(id) ON DELETE CASCADE;
ALTER TABLE ace_substitutions ADD COLUMN IF NOT EXISTS substitution_date DATE;
ALTER TABLE ace_substitutions DROP CONSTRAINT IF EXISTS ace_substitutions_status_check;
-- Just in case we have existing data, we update 'pending' to 'pending_tu'
UPDATE ace_substitutions SET status = 'pending_tu' WHERE status = 'pending';
UPDATE ace_substitutions SET status = 'rejected_tu' WHERE status = 'rejected';
ALTER TABLE ace_substitutions ADD CONSTRAINT ace_substitutions_status_check CHECK (status IN ('pending_tu', 'rejected_tu', 'pending_sub', 'rejected_sub', 'accepted'));
