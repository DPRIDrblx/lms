-- Migration Script for Ruang ACE (Academic & Educator Center)

-- 1. Table for Teacher Attendance (Presensi dengan GPS)
CREATE TABLE IF NOT EXISTS ace_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('hadir', 'sakit', 'izin')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table for Leave and Duty Requests (Cuti & Dinas Luar)
CREATE TABLE IF NOT EXISTS ace_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cuti', 'dinas_luar')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table for Teacher Performance (E-Kinerja)
CREATE TABLE IF NOT EXISTS ace_performances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL DEFAULT extract(year from current_date),
  phase TEXT NOT NULL DEFAULT 'perencanaan' CHECK (phase IN ('perencanaan', 'pelaksanaan', 'penilaian')),
  plan_document JSONB, -- Stores target and indicators
  observation_notes TEXT,
  principal_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, year)
);

-- Enable RLS
ALTER TABLE ace_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_performances ENABLE ROW LEVEL SECURITY;

-- Policies for ace_attendances
CREATE POLICY "Users can view their own attendances" ON ace_attendances FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Principals and TU can view all attendances" ON ace_attendances FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('principal', 'tu'))
);
CREATE POLICY "Teachers can insert their own attendances" ON ace_attendances FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Policies for ace_leaves
CREATE POLICY "Users can view their own leaves" ON ace_leaves FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Principals and TU can view all leaves" ON ace_leaves FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('principal', 'tu'))
);
CREATE POLICY "Teachers can request leaves" ON ace_leaves FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Principals can update leaves" ON ace_leaves FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- Policies for ace_performances
CREATE POLICY "Users can view their own performance" ON ace_performances FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Principals can view all performances" ON ace_performances FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);
CREATE POLICY "Teachers can create performance plan" ON ace_performances FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their own performance" ON ace_performances FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Principals can update performances" ON ace_performances FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);
