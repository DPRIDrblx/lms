-- 1. Tambahkan kolomnya terlebih dahulu jika belum ada
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_seen_center_update BOOLEAN DEFAULT true;

-- 2. Pastikan kolomnya diset ke TRUE secara default untuk siswa baru (masa depan)
ALTER TABLE profiles 
ALTER COLUMN has_seen_center_update SET DEFAULT true;

-- 3. Reset flag untuk semua siswa lama (yang dibuat sebelum ini) agar mereka bisa melihat animasinya!
UPDATE profiles 
SET has_seen_center_update = false 
WHERE created_at < NOW() 
AND role = 'student';

-- 4. Tabel tambahan untuk Center (Jadwal dan Modul) -- Pastikan ini juga ada!
CREATE TABLE IF NOT EXISTS e_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  drive_link TEXT NOT NULL,
  grade_level VARCHAR(50),
  class_id UUID REFERENCES classes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS center_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  schedule_time TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
