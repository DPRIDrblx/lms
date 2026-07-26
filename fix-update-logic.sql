-- 1. Ubah nilai bawaan (default) agar siswa BARU yang mendaftar di masa depan tidak melihat animasi update.
ALTER TABLE profiles 
ALTER COLUMN has_seen_center_update SET DEFAULT true;

-- 2. Jadikan siswa LAMA yang mendaftar sebelum hari ini pukul 20:03 sebagai target animasi update (mereka akan melihatnya saat login)
--    Hanya jika mereka belum pernah melihat animasinya.
UPDATE profiles 
SET has_seen_center_update = false 
WHERE created_at < '2026-07-26 20:03:00+07' 
AND role = 'student';

-- 3. Untuk memastikan siswa baru yang daftar setelah jam 20:03 hari ini tidak melihatnya, kita set true
UPDATE profiles 
SET has_seen_center_update = true 
WHERE created_at >= '2026-07-26 20:03:00+07' 
AND role = 'student';
