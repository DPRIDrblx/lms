CREATE TABLE IF NOT EXISTS ace_question_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  grade_level VARCHAR(50),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ace_question_bank_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID NOT NULL REFERENCES ace_question_banks(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'mcq',
  options JSONB DEFAULT '[]'::jsonb,
  points INTEGER DEFAULT 10,
  criteria JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ace_question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_question_bank_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view banks" ON ace_question_banks;
CREATE POLICY "Anyone can view banks" ON ace_question_banks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Assessment head can manage banks" ON ace_question_banks;
CREATE POLICY "Assessment head can manage banks" ON ace_question_banks FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_assessment_head = true)
);

DROP POLICY IF EXISTS "Anyone can view bank items" ON ace_question_bank_items;
CREATE POLICY "Anyone can view bank items" ON ace_question_bank_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Assessment head can manage bank items" ON ace_question_bank_items;
CREATE POLICY "Assessment head can manage bank items" ON ace_question_bank_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_assessment_head = true)
);
