-- promotion-requests.sql

CREATE TABLE IF NOT EXISTS ace_promotion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES ace_profiles(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE ace_promotion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own promotion requests" 
ON ace_promotion_requests FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Users can insert their own promotion requests" 
ON ace_promotion_requests FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
