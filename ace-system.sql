-- Migration Script for Ruang ACE (Academic & Educator Center)

-- 1. Table for Teacher Attendance (Presensi dengan GPS)
CREATE TABLE IF NOT EXISTS ace_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('hadir', 'sakit', 'izin')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  photo_url TEXT,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  is_late BOOLEAN NOT NULL DEFAULT false,
  is_overtime BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
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

-- Profiles Extensions for ACE
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS base_salary INTEGER NOT NULL DEFAULT 4500000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_status TEXT NOT NULL DEFAULT 'kontrak';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_hod BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_hod_assistant BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_assessment_head BOOLEAN NOT NULL DEFAULT false;

-- Table for Principal Promotions/Mutations
CREATE TABLE IF NOT EXISTS ace_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ace_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_promotions ENABLE ROW LEVEL SECURITY;

-- Policies for ace_attendances
DROP POLICY IF EXISTS "Users can view their own attendances" ON ace_attendances;
CREATE POLICY "Users can view their own attendances" ON ace_attendances FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Principals and TU can view all attendances" ON ace_attendances;
CREATE POLICY "Principals and TU can view all attendances" ON ace_attendances FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('principal', 'tu'))
);
DROP POLICY IF EXISTS "Teachers can insert their own attendances" ON ace_attendances;
CREATE POLICY "Teachers can insert their own attendances" ON ace_attendances FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Policies for ace_leaves
DROP POLICY IF EXISTS "Users can view their own leaves" ON ace_leaves;
CREATE POLICY "Users can view their own leaves" ON ace_leaves FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Principals and TU can view all leaves" ON ace_leaves;
CREATE POLICY "Principals and TU can view all leaves" ON ace_leaves FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('principal', 'tu'))
);
DROP POLICY IF EXISTS "Teachers can request leaves" ON ace_leaves;
CREATE POLICY "Teachers can request leaves" ON ace_leaves FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Principals can update leaves" ON ace_leaves;
CREATE POLICY "Principals can update leaves" ON ace_leaves FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- Policies for ace_performances
DROP POLICY IF EXISTS "Users can view their own performance" ON ace_performances;
CREATE POLICY "Users can view their own performance" ON ace_performances FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Principals can view all performances" ON ace_performances;
CREATE POLICY "Principals can view all performances" ON ace_performances FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);
DROP POLICY IF EXISTS "Teachers can create performance plan" ON ace_performances;
CREATE POLICY "Teachers can create performance plan" ON ace_performances FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Teachers can update their own performance" ON ace_performances;
CREATE POLICY "Teachers can update their own performance" ON ace_performances FOR UPDATE USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Principals can update performances" ON ace_performances;
CREATE POLICY "Principals can update performances" ON ace_performances FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- Policies for ace_promotions
DROP POLICY IF EXISTS "Users can view own promotions" ON ace_promotions;
CREATE POLICY "Users can view own promotions" ON ace_promotions FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Principals and TU can view all promotions" ON ace_promotions;
CREATE POLICY "Principals and TU can view all promotions" ON ace_promotions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('principal', 'tu'))
);
DROP POLICY IF EXISTS "TU can insert promotions" ON ace_promotions;
CREATE POLICY "TU can insert promotions" ON ace_promotions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu')
);
DROP POLICY IF EXISTS "Principals can update promotions" ON ace_promotions;
CREATE POLICY "Principals can update promotions" ON ace_promotions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- PHASE 2 TABLES

-- 4. Table for Certificates & Training (Diklat)
CREATE TABLE IF NOT EXISTS ace_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  date_issued DATE NOT NULL,
  points INTEGER DEFAULT 0,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table for Teaching Schedules (Roster KBM)
CREATE TABLE IF NOT EXISTS ace_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Senin
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Table for Digital Payslips (Slip Gaji)
CREATE TABLE IF NOT EXISTS ace_payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  is_viewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for Phase 2
ALTER TABLE ace_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_payslips ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "View own certificates" ON ace_certificates;
CREATE POLICY "View own certificates" ON ace_certificates FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Principal view all certificates" ON ace_certificates;
CREATE POLICY "Principal view all certificates" ON ace_certificates FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal'));
DROP POLICY IF EXISTS "Insert own certificates" ON ace_certificates;
CREATE POLICY "Insert own certificates" ON ace_certificates FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "TU manage all certificates" ON ace_certificates;
CREATE POLICY "TU manage all certificates" ON ace_certificates FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));

DROP POLICY IF EXISTS "View all schedules" ON ace_schedules;
CREATE POLICY "View all schedules" ON ace_schedules FOR SELECT USING (true); -- Publicly viewable by logged in users

DROP POLICY IF EXISTS "View own payslips" ON ace_payslips;
CREATE POLICY "View own payslips" ON ace_payslips FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "TU manage payslips" ON ace_payslips;
CREATE POLICY "TU manage payslips" ON ace_payslips FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));

ALTER TABLE ace_leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own leaves" ON ace_leaves;
CREATE POLICY "View own leaves" ON ace_leaves FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Insert own leaves" ON ace_leaves;
CREATE POLICY "Insert own leaves" ON ace_leaves FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "TU manage leaves" ON ace_leaves;
CREATE POLICY "TU manage leaves" ON ace_leaves FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));

-- PHASE 3 TABLES (SUPER-APP)

-- 7. Table for Faculty Passport (Legalitas & Profil)
CREATE TABLE IF NOT EXISTS ace_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('ijazah', 'sk_pengangkatan', 'sertifikat_pendidik', 'lainnya')),
  file_url TEXT NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ace_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own documents" ON ace_documents;
CREATE POLICY "View own documents" ON ace_documents FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Insert own documents" ON ace_documents;
CREATE POLICY "Insert own documents" ON ace_documents FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "TU manage all documents" ON ace_documents;
CREATE POLICY "TU manage all documents" ON ace_documents FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));
DROP POLICY IF EXISTS "Principal view all documents" ON ace_documents;
CREATE POLICY "Principal view all documents" ON ace_documents FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal'));

-- 8. Table for Logbook Mengajar
CREATE TABLE IF NOT EXISTS ace_logbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES ace_schedules(id),
  date DATE NOT NULL,
  materi TEXT NOT NULL,
  siswa_hadir INTEGER NOT NULL,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8.5 Table for Cuti & Dinas Luar (Leaves)
CREATE TABLE IF NOT EXISTS ace_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  leave_type TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Table for Substitusi Guru (Manual Matrix)
CREATE TABLE IF NOT EXISTS ace_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_id UUID REFERENCES ace_leaves(id) ON DELETE CASCADE,
  requestor_id UUID NOT NULL REFERENCES profiles(id),
  substitute_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Table for Plafon Tunjangan
CREATE TABLE IF NOT EXISTS ace_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  package_name TEXT NOT NULL,
  claimed_amount INTEGER DEFAULT 0,
  max_plafond INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Table for TU Helpdesk Tickets
CREATE TABLE IF NOT EXISTS ace_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requestor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('surat', 'sarpras', 'it', 'lainnya')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'blue' CHECK (status IN ('blue', 'yellow', 'green', 'red')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ace_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own tickets" ON ace_tickets;
CREATE POLICY "View own tickets" ON ace_tickets FOR SELECT USING (auth.uid() = requestor_id);
DROP POLICY IF EXISTS "Insert own tickets" ON ace_tickets;
CREATE POLICY "Insert own tickets" ON ace_tickets FOR INSERT WITH CHECK (auth.uid() = requestor_id);
DROP POLICY IF EXISTS "TU manage all tickets" ON ace_tickets;
CREATE POLICY "TU manage all tickets" ON ace_tickets FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));

-- 12. Table for Student Feedbacks (Kinerja)
CREATE TABLE IF NOT EXISTS ace_student_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  criteria_1_score DOUBLE PRECISION NOT NULL CHECK (criteria_1_score >= 1 AND criteria_1_score <= 4),
  criteria_2_score DOUBLE PRECISION NOT NULL CHECK (criteria_2_score >= 1 AND criteria_2_score <= 4),
  criteria_3_score DOUBLE PRECISION NOT NULL CHECK (criteria_3_score >= 1 AND criteria_3_score <= 4),
  semester TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Table for Workload Alerts (Kinerja)
CREATE TABLE IF NOT EXISTS ace_workload_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  days_overdue INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for Phase 3 & 5
ALTER TABLE ace_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_logbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_student_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_workload_alerts ENABLE ROW LEVEL SECURITY;

-- Policies Phase 3 (Simplified for MVP, all authenticated users can insert/view their own, principals/tu can view all)
DROP POLICY IF EXISTS "View own documents" ON ace_documents;
CREATE POLICY "View own documents" ON ace_documents FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Manage own documents" ON ace_documents;
CREATE POLICY "Manage own documents" ON ace_documents FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "TU manage documents" ON ace_documents;
CREATE POLICY "TU manage documents" ON ace_documents FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));

DROP POLICY IF EXISTS "View own logbooks" ON ace_logbooks;
CREATE POLICY "View own logbooks" ON ace_logbooks FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Manage own logbooks" ON ace_logbooks;
CREATE POLICY "Manage own logbooks" ON ace_logbooks FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "View involved substitutions" ON ace_substitutions;
CREATE POLICY "View involved substitutions" ON ace_substitutions FOR SELECT USING (auth.uid() = requestor_id OR auth.uid() = substitute_id);
DROP POLICY IF EXISTS "Manage substitutions" ON ace_substitutions;
CREATE POLICY "Manage substitutions" ON ace_substitutions FOR ALL USING (auth.uid() = requestor_id OR auth.uid() = substitute_id);

DROP POLICY IF EXISTS "View own benefits" ON ace_benefits;
CREATE POLICY "View own benefits" ON ace_benefits FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Manage own benefits" ON ace_benefits;
CREATE POLICY "Manage own benefits" ON ace_benefits FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "TU view benefits" ON ace_benefits;
CREATE POLICY "TU view benefits" ON ace_benefits FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));

DROP POLICY IF EXISTS "View own tickets" ON ace_tickets;
CREATE POLICY "View own tickets" ON ace_tickets FOR SELECT USING (auth.uid() = requestor_id);
DROP POLICY IF EXISTS "Manage own tickets" ON ace_tickets;
CREATE POLICY "Manage own tickets" ON ace_tickets FOR ALL USING (auth.uid() = requestor_id);
DROP POLICY IF EXISTS "TU manage tickets" ON ace_tickets;
CREATE POLICY "TU manage tickets" ON ace_tickets FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));

DROP POLICY IF EXISTS "View own feedbacks" ON ace_student_feedbacks;
CREATE POLICY "View own feedbacks" ON ace_student_feedbacks FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "View own workload alerts" ON ace_workload_alerts;
CREATE POLICY "View own workload alerts" ON ace_workload_alerts FOR SELECT USING (auth.uid() = teacher_id);

-- --------------------------------------------------------
-- Phase 8: HoD (Head of Department) Extensions
-- --------------------------------------------------------

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_hod BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE ace_leaves ADD COLUMN IF NOT EXISTS hod_status TEXT NOT NULL DEFAULT 'pending' CHECK (hod_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE ace_performances ADD COLUMN IF NOT EXISTS hod_score INTEGER;
ALTER TABLE ace_performances ADD COLUMN IF NOT EXISTS hod_notes TEXT;

-- Table for Lesson Plans
CREATE TABLE IF NOT EXISTS ace_lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  topic TEXT NOT NULL,
  objectives TEXT NOT NULL,
  activities TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision_needed')),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ace_lesson_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own or hod lesson plans" ON ace_lesson_plans;
CREATE POLICY "View own or hod lesson plans" ON ace_lesson_plans FOR SELECT USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_hod = true));
DROP POLICY IF EXISTS "Teacher insert lesson plans" ON ace_lesson_plans;
CREATE POLICY "Teacher insert lesson plans" ON ace_lesson_plans FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "HoD update lesson plans" ON ace_lesson_plans;
CREATE POLICY "HoD update lesson plans" ON ace_lesson_plans FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_hod = true));

-- Table for Asset Requests
CREATE TABLE IF NOT EXISTS ace_asset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  estimated_cost INTEGER NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending_hod' CHECK (status IN ('pending_hod', 'approved_hod', 'processed_tu', 'completed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ace_asset_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own or hod asset requests" ON ace_asset_requests;
CREATE POLICY "View own or hod asset requests" ON ace_asset_requests FOR SELECT USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_hod = true));
DROP POLICY IF EXISTS "Teacher insert asset requests" ON ace_asset_requests;
CREATE POLICY "Teacher insert asset requests" ON ace_asset_requests FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "HoD update asset requests" ON ace_asset_requests;
CREATE POLICY "HoD update asset requests" ON ace_asset_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_hod = true));

-- Table for Schedules
CREATE TABLE IF NOT EXISTS ace_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 (Sun) to 6 (Sat)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Logbooks (Berita Acara Mengajar)
CREATE TABLE IF NOT EXISTS ace_logbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES ace_schedules(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  topic_delivered TEXT NOT NULL,
  student_attendance_count INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Exam Questions
CREATE TABLE IF NOT EXISTS ace_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('HOTS', 'LOTS')),
  difficulty TEXT NOT NULL DEFAULT 'Sedang' CHECK (difficulty IN ('Mudah', 'Sedang', 'Sulit')),
  status TEXT NOT NULL DEFAULT 'Dikarantina' CHECK (status IN ('Dikarantina', 'Disahkan', 'Ditolak')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Student Grades
CREATE TABLE IF NOT EXISTS ace_student_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  score INTEGER NOT NULL,
  exam_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Department Budgets
CREATE TABLE IF NOT EXISTS ace_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_name TEXT NOT NULL,
  total_budget INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Exam Vault (Karantina Soal)
CREATE TABLE IF NOT EXISTS ace_exam_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  difficulty_ratio JSONB,
  status TEXT NOT NULL DEFAULT 'dikarantina' CHECK (status IN ('dikarantina', 'disahkan', 'ditolak')),
  watermark_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Grade Deadlines (Pengendali Tenggat Nilai)
CREATE TABLE IF NOT EXISTS ace_grade_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  deadline_date TIMESTAMPTZ NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Remedial Requests (Otorisasi Remedial)
CREATE TABLE IF NOT EXISTS ace_remedial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  old_score INTEGER NOT NULL,
  proposed_score INTEGER NOT NULL,
  scan_evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Report Cards (Konsol Kelayakan Rapor)
CREATE TABLE IF NOT EXISTS ace_report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (academic_status IN ('complete', 'incomplete')),
  extracurricular_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (extracurricular_status IN ('complete', 'incomplete')),
  attendance_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (attendance_status IN ('complete', 'incomplete')),
  hoa_signature BOOLEAN NOT NULL DEFAULT false,
  principal_signature BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Rubric Archives (Evaluasi Mutu Asesmen)
CREATE TABLE IF NOT EXISTS ace_rubric_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  rubric_type TEXT NOT NULL,
  file_url TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP POLICY IF EXISTS "TU manage schedules" ON ace_schedules;
CREATE POLICY "TU manage schedules" ON ace_schedules FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));
DROP POLICY IF EXISTS "Teachers update schedules" ON ace_schedules;
CREATE POLICY "Teachers update schedules" ON ace_schedules FOR UPDATE USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers update attendances" ON ace_attendances;
CREATE POLICY "Teachers update attendances" ON ace_attendances FOR UPDATE USING (auth.uid() = teacher_id);
