-- Seed Skill Up Missions and Tasks (Run this in Supabase SQL Editor after create-skillup.sql)

-- Clear existing data (optional, but good for fresh seed)
DELETE FROM public.skillup_tasks;
DELETE FROM public.skillup_missions;

-- 1. Misi 1: Keterampilan Komunikasi Dasar (SD)
INSERT INTO public.skillup_missions (id, title, description, class_level, order_index) VALUES 
('m1000000-0000-0000-0000-000000000001', 'Keterampilan Komunikasi Dasar', 'Belajar berani berbicara di depan kelas dan menjadi pendengar yang baik.', 'SD', 1);

INSERT INTO public.skillup_tasks (mission_id, title, description, reward_coins, order_index) VALUES 
('m1000000-0000-0000-0000-000000000001', 'Berani Berbicara di Depan Kelas', 'Praktik memperkenalkan diri di depan cermin.', 10, 1),
('m1000000-0000-0000-0000-000000000001', 'Mendengarkan Teman Bercerita', 'Mendengarkan cerita teman tanpa memotong.', 15, 2);


-- 2. Misi 2: Literasi Finansial Dasar (SD/SMP)
INSERT INTO public.skillup_missions (id, title, description, class_level, order_index) VALUES 
('m1000000-0000-0000-0000-000000000002', 'Literasi Finansial Dasar', 'Bedakan kebutuhan dan keinginan agar uang jajanmu awet!', 'All', 2);

INSERT INTO public.skillup_tasks (mission_id, title, description, reward_coins, order_index) VALUES 
('m1000000-0000-0000-0000-000000000002', 'Bedanya Kebutuhan dan Keinginan', 'Tulis 3 barang kebutuhan dan 3 barang keinginan.', 10, 1),
('m1000000-0000-0000-0000-000000000002', 'Simulasi Jajan Cerdas', 'Catat pengeluaran uang jajanmu selama 3 hari.', 20, 2),
('m1000000-0000-0000-0000-000000000002', 'Mulai Menabung', 'Masukkan sisa uang jajan ke dalam celengan pertamamu.', 30, 3);


-- 3. Misi 3: Literasi Digital & Anti-Hoax (SMP/SMA)
INSERT INTO public.skillup_missions (id, title, description, class_level, order_index) VALUES 
('m1000000-0000-0000-0000-000000000003', 'Literasi Digital & Anti-Hoax', 'Jadilah warganet yang cerdas, aman, dan bertanggung jawab.', 'SMP/SMA', 3);

INSERT INTO public.skillup_tasks (mission_id, title, description, reward_coins, order_index) VALUES 
('m1000000-0000-0000-0000-000000000003', 'Cara Membedakan Fakta dan Opini', 'Cari 1 berita fakta dan 1 berita opini di internet.', 15, 1),
('m1000000-0000-0000-0000-000000000003', 'Mengecek Kebenaran Berita Viral', 'Gunakan Google Fact Check untuk mengecek 1 isu viral.', 20, 2),
('m1000000-0000-0000-0000-000000000003', 'Melindungi Password Sendiri', 'Ubah password media sosialmu menjadi kombinasi angka dan huruf yang kuat.', 25, 3);


-- 4. Misi 4: Manajemen Waktu Belajar (SMP/SMA)
INSERT INTO public.skillup_missions (id, title, description, class_level, order_index) VALUES 
('m1000000-0000-0000-0000-000000000004', 'Manajemen Waktu Belajar', 'Atur waktumu, kurangi menunda-nunda, dan jadilah lebih produktif!', 'SMP/SMA', 4);

INSERT INTO public.skillup_tasks (mission_id, title, description, reward_coins, order_index) VALUES 
('m1000000-0000-0000-0000-000000000004', 'Membuat Jadwal Belajar Mingguan', 'Tulis jadwal belajarmu selama satu minggu.', 20, 1),
('m1000000-0000-0000-0000-000000000004', 'Teknik Pomodoro', 'Cobalah belajar 25 menit fokus tanpa gangguan HP.', 25, 2),
('m1000000-0000-0000-0000-000000000004', 'Skala Prioritas', 'Urutkan 3 tugas sekolahmu dari yang paling penting dan mendesak.', 15, 3);


-- 5. Misi 5: Pemahaman Emosi & Kesehatan Mental (All)
INSERT INTO public.skillup_missions (id, title, description, class_level, order_index) VALUES 
('m1000000-0000-0000-0000-000000000005', 'Kesehatan Mental & Emosi', 'Kenali emosimu dan pelajari cara menenangkan diri saat stres ujian.', 'All', 5);

INSERT INTO public.skillup_tasks (mission_id, title, description, reward_coins, order_index) VALUES 
('m1000000-0000-0000-0000-000000000005', 'Latihan Pernapasan 4-7-8', 'Lakukan teknik tarik napas 4 detik, tahan 7 detik, buang 8 detik.', 10, 1),
('m1000000-0000-0000-0000-000000000005', 'Mengenal Stres Ujian', 'Tulis 2 hal yang paling membuatmu takut saat ujian.', 15, 2),
('m1000000-0000-0000-0000-000000000005', 'Journaling Kebaikan', 'Tulis 3 hal yang kamu syukuri hari ini.', 20, 3);


-- 6. Misi 6: Kepemimpinan & Kerja Sama (All)
INSERT INTO public.skillup_missions (id, title, description, class_level, order_index) VALUES 
('m1000000-0000-0000-0000-000000000006', 'Kepemimpinan & Kerja Sama', 'Tingkatkan jiwa kepemimpinanmu dan kolaborasi dengan tim.', 'All', 6);

INSERT INTO public.skillup_tasks (mission_id, title, description, reward_coins, order_index) VALUES 
('m1000000-0000-0000-0000-000000000006', 'Menyatukan Pendapat', 'Lakukan diskusi kelompok dan rangkum 2 pendapat berbeda.', 20, 1),
('m1000000-0000-0000-0000-000000000006', 'Membantu Teman Kesulitan', 'Bantu 1 orang temanmu yang kesulitan memahami pelajaran.', 30, 2);


-- 7. Misi 7: Dasar Pemrograman & Logika (SMP/SMA)
INSERT INTO public.skillup_missions (id, title, description, class_level, order_index) VALUES 
('m1000000-0000-0000-0000-000000000007', 'Dasar Logika & Komputasi', 'Berpikir kritis seperti komputer dalam menyelesaikan masalah.', 'SMP/SMA', 7);

INSERT INTO public.skillup_tasks (mission_id, title, description, reward_coins, order_index) VALUES 
('m1000000-0000-0000-0000-000000000007', 'Algoritma Kehidupan', 'Tulis langkah-langkah detail cara membuat mie instan secara terurut.', 15, 1),
('m1000000-0000-0000-0000-000000000007', 'Mencoba Game Logika', 'Selesaikan 1 level di Code.org atau game logika serupa.', 25, 2);

-- Tampilkan Misi yang berhasil dimasukkan
SELECT * FROM skillup_missions;
