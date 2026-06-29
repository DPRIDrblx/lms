-- Menambahkan kolom file_url untuk menampung link file PDF RPP
ALTER TABLE ace_lesson_plans ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Mengubah kolom teks yang tadinya wajib (NOT NULL) menjadi opsional (Boleh NULL)
-- karena dalam konteks unggah PDF, guru tidak perlu mengetik ini secara manual.
ALTER TABLE ace_lesson_plans ALTER COLUMN topic DROP NOT NULL;
ALTER TABLE ace_lesson_plans ALTER COLUMN objectives DROP NOT NULL;
ALTER TABLE ace_lesson_plans ALTER COLUMN activities DROP NOT NULL;

-- Memuat ulang schema cache agar PostgREST (API Supabase) mengenali kolom baru
NOTIFY pgrst, 'reload schema';
