-- 1. Tambahkan kolom enrollment_code ke tabel classes jika belum ada
ALTER TABLE classes ADD COLUMN IF NOT EXISTS enrollment_code text UNIQUE;

-- 2. Buat kode kelas acak untuk kelas yang sudah ada (Opsional, tapi penting agar kode unik tidak null jika diperlukan)
UPDATE classes SET enrollment_code = 'KODE-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6)) WHERE enrollment_code IS NULL;

-- 3. (Khusus Kelas 9D) Set kode kelas yang spesifik agar mudah dites
UPDATE classes SET enrollment_code = 'JOIN-9D' WHERE name = '9D';

-- 4. Update function handle_new_user agar otomatis memasukkan siswa ke kelas sesuai kode
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_class_id uuid;
  v_class_code text;
BEGIN
  -- Ambil class_code dari metadata yang dikirim saat Sign Up
  v_class_code := new.raw_user_meta_data->>'class_code';

  -- Jika ada class_code, cari class_id yang sesuai
  IF v_class_code IS NOT NULL AND v_class_code != '' THEN
    SELECT id INTO v_class_id FROM classes WHERE enrollment_code = v_class_code LIMIT 1;
  END IF;

  -- Insert profile baru
  INSERT INTO public.profiles (id, full_name, role, class_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    v_class_id
  );
  
  RETURN new;
END;
$$;

-- 5. Tambahkan kolom is_online untuk fitur Kelas Online
ALTER TABLE center_schedules ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
