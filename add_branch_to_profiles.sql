ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES nia_branches(id);
