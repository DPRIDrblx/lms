const fs = require('fs');

let s = fs.readFileSync('c:/Users/rayha/Downloads/lmsss/ace-system.sql', 'utf8');

// Replace the table definition in ace-system.sql
s = s.replace(
  /CREATE TABLE IF NOT EXISTS ace_substitutions \([\s\S]*?\);/,
  `CREATE TABLE IF NOT EXISTS ace_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_id UUID REFERENCES ace_leaves(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES ace_schedules(id) ON DELETE CASCADE,
  substitution_date DATE,
  requestor_id UUID NOT NULL REFERENCES profiles(id),
  substitute_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending_tu' CHECK (status IN ('pending_tu', 'rejected_tu', 'pending_sub', 'rejected_sub', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`
);

fs.writeFileSync('c:/Users/rayha/Downloads/lmsss/ace-system.sql', s);

const migrationSql = `
ALTER TABLE ace_substitutions ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES ace_schedules(id) ON DELETE CASCADE;
ALTER TABLE ace_substitutions ADD COLUMN IF NOT EXISTS substitution_date DATE;
ALTER TABLE ace_substitutions DROP CONSTRAINT IF EXISTS ace_substitutions_status_check;
-- Just in case we have existing data, we update 'pending' to 'pending_tu'
UPDATE ace_substitutions SET status = 'pending_tu' WHERE status = 'pending';
UPDATE ace_substitutions SET status = 'rejected_tu' WHERE status = 'rejected';
ALTER TABLE ace_substitutions ADD CONSTRAINT ace_substitutions_status_check CHECK (status IN ('pending_tu', 'rejected_tu', 'pending_sub', 'rejected_sub', 'accepted'));
`;

fs.writeFileSync('c:/Users/rayha/Downloads/lmsss/substitutions-migration.sql', migrationSql);
console.log('done updating sql');
