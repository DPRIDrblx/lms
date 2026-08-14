export type Subtopic = string;

export interface Topic {
  name: string;
  subtopics: Subtopic[];
}

export interface Subject {
  name: string;
  topics: Topic[];
}

export interface EducationLevel {
  level: string;
  subjects: Subject[];
}

export const TUTORING_TOPICS: EducationLevel[] = [
  {
    level: "SD",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Bilangan & Operasi Hitung", subtopics: ["Mengenal Bilangan Ratusan & Ribuan", "Penjumlahan & Pengurangan Menyimpan", "Perkalian (Tabel 1-10) & Bersusun", "Pembagian Bersusun (Porogapit)", "Operasi Hitung Campuran", "Pecahan Biasa & Campuran", "Penjumlahan & Pengurangan Pecahan", "Perkalian & Pembagian Pecahan", "Desimal & Persen", "KPK (Kelipatan Persekutuan Terkecil)", "FPB (Faktor Persekutuan Terbesar)", "Bilangan Romawi", "Bilangan Pangkat Dua & Akar Kuadrat"] },
          { name: "Geometri Dasar", subtopics: ["Sifat-sifat Bangun Datar", "Keliling & Luas Persegi & Persegi Panjang", "Keliling & Luas Segitiga", "Keliling & Luas Lingkaran", "Sifat-sifat Bangun Ruang (Kubus, Balok, Tabung)", "Volume Kubus & Balok", "Jaring-jaring Kubus & Balok", "Simetri Lipat & Simetri Putar", "Pencerminan Bangun Datar"] },
          { name: "Pengukuran & Skala", subtopics: ["Membaca Jam Analog & Digital", "Operasi Hitung Satuan Waktu (Jam, Menit, Detik)", "Satuan Panjang (km, hm, dam, m, dll)", "Satuan Berat (kg, hg, dag, g, dll)", "Satuan Volume (Liter & Meter Kubik)", "Kecepatan, Jarak, & Waktu", "Debit, Volume, & Waktu", "Membaca Peta & Skala"] },
          { name: "Pengolahan Data", subtopics: ["Mengumpulkan & Mengurutkan Data", "Membaca Diagram Batang", "Membaca Diagram Garis", "Membaca Diagram Lingkaran", "Rata-rata (Mean)", "Nilai Tengah (Median)", "Nilai Paling Sering Muncul (Modus)"] }
        ]
      },
      {
        name: "IPA",
        topics: [
          { name: "Makhluk Hidup & Lingkungannya", subtopics: ["Ciri & Kebutuhan Makhluk Hidup", "Penggolongan Hewan (Herbivora, Karnivora, dll)", "Penggolongan Tumbuhan (Biji, Akar, Batang)", "Rantai Makanan & Jaring-jaring Makanan", "Adaptasi Hewan terhadap Lingkungan", "Adaptasi Tumbuhan terhadap Lingkungan", "Pelestarian Hewan & Tumbuhan Langka", "Ekosistem & Keseimbangan Alam"] },
          { name: "Anatomi & Tubuh Manusia", subtopics: ["Panca Indera & Fungsinya", "Sistem Pencernaan Manusia", "Sistem Pernapasan Manusia", "Sistem Peredaran Darah", "Rangka & Otot Manusia", "Pemeliharaan Kesehatan Organ Tubuh"] },
          { name: "Benda & Sifatnya", subtopics: ["Wujud Benda (Padat, Cair, Gas)", "Sifat-sifat Benda Padat, Cair, Gas", "Perubahan Wujud Benda (Mencair, Membeku, Menguap, dll)", "Suhu & Kalor (Perpindahan Panas)", "Sifat Bahan (Kaca, Kayu, Logam, Plastik, Karet)", "Perubahan Benda (Pembusukan, Perkaratan, Pelapukan)"] },
          { name: "Energi & Gaya", subtopics: ["Macam-macam Gaya (Otot, Gesek, Pegas, Gravitasi, Magnet)", "Pengaruh Gaya terhadap Gerak Benda", "Pesawat Sederhana (Tuas, Katrol, Bidang Miring)", "Sumber Energi & Bentuk Energi", "Perubahan Bentuk Energi", "Energi Alternatif", "Listrik Statis & Dinamis", "Rangkaian Listrik Seri & Paralel", "Sifat-sifat Magnet", "Cahaya & Sifat-sifatnya", "Bunyi & Sifat-sifatnya"] },
          { name: "Bumi & Alam Semesta", subtopics: ["Struktur & Permukaan Bumi", "Daur Air (Siklus Air)", "Cuaca, Musim, & Iklim", "Jenis-jenis Batuan & Tanah", "Tata Surya & Planet", "Rotasi & Revolusi Bumi", "Gerhana Matahari & Gerhana Bulan", "Sumber Daya Alam (Dapat Diperbarui & Tidak)"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Membaca & Memahami Teks", subtopics: ["Menentukan Ide Pokok Paragraf", "Menyimpulkan Isi Teks", "Memahami Cerita Pendek (Cerpen)", "Memahami Dongeng, Fabel, & Legenda", "Menjawab Pertanyaan Berdasarkan Teks (5W+1H)", "Menemukan Informasi Tersurat & Tersirat", "Membaca Denah & Petunjuk Arah"] },
          { name: "Kosakata, Ejaan & Tanda Baca", subtopics: ["Sinonim & Antonim", "Makna Kata & Istilah", "Huruf Kapital & Penggunaannya", "Tanda Baca (Titik, Koma, Tanya, Seru, Petik)", "Kata Dasar & Kata Imbuhan", "Kata Baku & Tidak Baku", "Kata Ulang"] },
          { name: "Menulis & Menyusun Teks", subtopics: ["Menyusun Kalimat Acak Menjadi Paragraf", "Menulis Puisi Sederhana", "Menulis Pantun", "Surat Pribadi & Surat Resmi", "Menulis Laporan Pengamatan", "Teks Prosedur (Petunjuk Penggunaan)", "Teks Deskripsi (Menggambarkan Benda/Tempat)", "Teks Pidato Persuasif Dasar"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Vocabulary & Things Around Us", subtopics: ["Animals (Wild, Tame, Pets)", "Fruits & Vegetables", "Professions & Occupations", "Family Members & Family Tree", "Daily Activities & Routines", "Parts of the Body", "Things in the Classroom", "Things in the House (Living Room, Kitchen, etc.)", "Transportation & Vehicles", "Colors, Shapes, & Numbers (1-100+)", "Days, Months, & Seasons", "Food & Drinks"] },
          { name: "Grammar Basics", subtopics: ["Pronouns (Subject, Object, Possessive)", "To Be (is, am, are, was, were)", "Simple Present Tense (Habits & Facts)", "Present Continuous Tense (-ing)", "There is / There are", "Prepositions of Place (in, on, under, etc.)", "Articles (a, an, the)", "Adjectives (Opposites & Describing Words)", "Plural & Singular Nouns"] },
          { name: "Everyday Expressions", subtopics: ["Greetings & Partings", "Introducing Self & Others", "Asking & Giving Directions", "Expressing Feelings & Emotions", "Polite Requests (Can, May, Could)", "Telling the Time", "Asking & Telling Price", "Inviting & Apologizing"] },
          { name: "Short Texts", subtopics: ["Short Descriptive Text (Describing Pets/People)", "Short Notices & Warnings", "Greeting Cards", "Short Messages"] }
        ]
      },
      {
        name: "PPKN (Pendidikan Pancasila & Kewarganegaraan)",
        topics: [
          { name: "Pancasila", subtopics: ["Sejarah Perumusan Pancasila", "Tokoh Perumus Pancasila", "Lambang Negara & Sila Pancasila", "Nilai-nilai Luhur Sila ke-1 sampai ke-5", "Penerapan Pancasila di Rumah", "Penerapan Pancasila di Sekolah", "Penerapan Pancasila di Masyarakat"] },
          { name: "UUD 1945 & Peraturan", subtopics: ["Pengertian Konstitusi & UUD 1945", "Makna Pembukaan UUD 1945", "Tata Urutan Peraturan Perundang-undangan", "Mematuhi Tata Tertib Sekolah", "Peraturan Lalu Lintas"] },
          { name: "Negara & Pemerintahan", subtopics: ["Bentuk Negara Kesatuan Republik Indonesia (NKRI)", "Sistem Pemerintahan Desa & Kelurahan", "Sistem Pemerintahan Kecamatan", "Sistem Pemerintahan Kabupaten/Kota & Provinsi", "Sistem Pemerintahan Pusat (Presiden, Menteri, MPR, DPR)", "Lembaga-lembaga Negara", "Pemilihan Umum (Pemilu)"] },
          { name: "Hak, Kewajiban & Tanggung Jawab", subtopics: ["Pengertian Hak & Kewajiban", "Hak & Kewajiban Anak di Rumah", "Hak & Kewajiban Siswa di Sekolah", "Hak & Kewajiban Warga Negara", "Tanggung Jawab terhadap Lingkungan"] },
          { name: "Persatuan & Keberagaman", subtopics: ["Sumpah Pemuda", "Bhineka Tunggal Ika", "Suku Bangsa di Indonesia", "Pakaian, Rumah Adat, & Tarian Daerah", "Sikap Toleransi & Menghargai Perbedaan", "Gotong Royong", "Bangga sebagai Bangsa Indonesia"] }
        ]
      },
      {
        name: "IPS",
        topics: [
          { name: "Pengetahuan Geografi Dasar", subtopics: ["Membaca Peta, Atlas, & Globe", "Arah Mata Angin & Denah", "Kondisi Geografis Indonesia (Pulau, Gunung, Laut)", "Batas Wilayah Indonesia", "Kenampakan Alam & Buatan", "Cuaca & Iklim di Indonesia"] },
          { name: "Kehidupan Sosial & Ekonomi", subtopics: ["Kebutuhan Manusia (Primer, Sekunder, Tersier)", "Jenis Pekerjaan Berdasarkan Dataran", "Kegiatan Ekonomi (Produksi, Distribusi, Konsumsi)", "Koperasi di Indonesia", "Sumber Daya Alam & Pemanfaatannya", "Teknologi Transportasi & Komunikasi (Dulu & Kini)"] },
          { name: "Sejarah & Budaya", subtopics: ["Peninggalan Sejarah Masa Hindu, Buddha, & Islam", "Kerajaan-kerajaan Besar di Nusantara", "Tokoh Pahlawan Kemerdekaan", "Sejarah Proklamasi Kemerdekaan RI", "Perjuangan Mempertahankan Kemerdekaan", "Mengenal Negara-negara ASEAN"] }
        ]
      }
    ]
  },
  {
    level: "SMP",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Bilangan & Pecahan", subtopics: ["Operasi Hitung Bilangan Bulat", "Operasi Hitung Bilangan Pecahan", "Perpangkatan Bilangan Bulat", "Bentuk Akar", "Pola Bilangan & Barisan (Aritmatika & Geometri)"] },
          { name: "Aljabar", subtopics: ["Pengenalan Bentuk Aljabar", "Operasi Penjumlahan & Pengurangan Aljabar", "Perkalian & Pembagian Aljabar", "Pemfaktoran Aljabar", "Persamaan Linear Satu Variabel (PLSV)", "Pertidaksamaan Linear Satu Variabel (PtLSV)", "Sistem Persamaan Linear Dua Variabel (SPLDV)", "Persamaan Kuadrat & Pemfaktorannya"] },
          { name: "Aritmatika Sosial", subtopics: ["Nilai Keseluruhan & Per Unit", "Keuntungan, Kerugian, & Persentase", "Diskon (Rabat), Pajak, & Bunga Tunggal", "Bruto, Netto, & Tara"] },
          { name: "Geometri", subtopics: ["Garis & Sudut", "Hubungan Antarsudut (Berpelurus, Berpenyiku, Bertolak Belakang)", "Segitiga (Jenis, Keliling, Luas)", "Segiempat (Persegi, Jajargenjang, Trapesium, Belah Ketupat, Layang-layang)", "Teorema Pythagoras", "Lingkaran (Keliling, Luas, Busur, Juring)", "Garis Singgung Lingkaran", "Bangun Ruang Sisi Datar (Kubus, Balok, Prisma, Limas)", "Bangun Ruang Sisi Lengkung (Tabung, Kerucut, Bola)", "Kesebangunan & Kekongruenan"] },
          { name: "Fungsi, Himpunan & Statistika", subtopics: ["Konsep Himpunan (Irisan, Gabungan, Komplemen)", "Relasi & Fungsi", "Fungsi Linear & Menggambar Grafik", "Persamaan Garis Lurus (Gradien)", "Penyajian Data (Tabel, Diagram)", "Ukuran Pemusatan Data (Mean, Median, Modus)", "Ukuran Penyebaran Data", "Peluang Empiris & Peluang Teoritik"] }
        ]
      },
      {
        name: "IPA Fisika",
        topics: [
          { name: "Pengukuran & Besaran", subtopics: ["Besaran Pokok & Turunan", "Satuan Internasional (SI)", "Alat Ukur (Jangka Sorong, Mikrometer Sekrup)"] },
          { name: "Zat & Kalor", subtopics: ["Sifat Zat Padat, Cair, Gas", "Massa Jenis", "Suhu & Termometer", "Pemuaian Zat", "Kalor & Perpindahan Kalor (Asas Black)"] },
          { name: "Mekanika", subtopics: ["Gerak Lurus Beraturan (GLB)", "Gerak Lurus Berubah Beraturan (GLBB)", "Gaya & Hukum Newton (I, II, III)", "Usaha & Energi", "Pesawat Sederhana (Tuas, Katrol, Bidang Miring)", "Tekanan Zat Padat", "Tekanan Hidrostatis & Hukum Archimedes", "Hukum Pascal & Tekanan Udara"] },
          { name: "Getaran, Gelombang & Optik", subtopics: ["Getaran (Periode, Frekuensi, Amplitudo)", "Gelombang Transversal & Longitudinal", "Bunyi (Infrasonik, Audiosonik, Ultrasonik, Resonansi)", "Cahaya (Pemantulan, Pembiasan)", "Cermin & Lensa", "Alat Optik (Mata, Lup, Mikroskop)"] },
          { name: "Listrik & Magnet", subtopics: ["Listrik Statis (Gaya Coulomb, Medan Listrik)", "Listrik Dinamis (Hukum Ohm, Rangkaian Seri & Paralel)", "Energi & Daya Listrik", "Kemagnetan (Cara Membuat Magnet, Medan Magnet)", "Gaya Lorentz & Induksi Elektromagnetik"] }
        ]
      },
      {
        name: "IPA Biologi",
        topics: [
          { name: "Struktur Kehidupan", subtopics: ["Mikroskop & Keselamatan Kerja", "Sel sebagai Unit Terkecil", "Jaringan pada Hewan & Tumbuhan", "Organ & Sistem Organ"] },
          { name: "Klasifikasi Makhluk Hidup", subtopics: ["Ciri-ciri Benda Tak Hidup & Makhluk Hidup", "Sistem Klasifikasi 5 Kingdom", "Monera, Protista, Fungi", "Plantae (Tumbuhan Berpembuluh & Tidak)", "Animalia (Vertebrata & Invertebrata)"] },
          { name: "Sistem Organ Manusia", subtopics: ["Sistem Gerak (Tulang & Otot, Sendi, Kelainan)", "Sistem Pencernaan (Organ, Enzim, Penyakit)", "Sistem Pernapasan (Mekanisme & Penyakit)", "Sistem Peredaran Darah (Jantung, Pembuluh, Golongan Darah)", "Sistem Ekskresi (Ginjal, Hati, Paru-paru, Kulit)", "Sistem Reproduksi Manusia"] },
          { name: "Tumbuhan", subtopics: ["Struktur & Fungsi Akar, Batang, Daun", "Fotosintesis (Percobaan Sach & Ingenhousz)", "Gerak pada Tumbuhan", "Reproduksi Tumbuhan"] },
          { name: "Ekosistem & Kependudukan", subtopics: ["Komponen Biotik & Abiotik", "Interaksi Makhluk Hidup (Simbiosis, Predasi, Kompetisi)", "Dinamika Populasi & Kepadatan Penduduk", "Pencemaran Lingkungan (Air, Udara, Tanah)", "Pemanasan Global (Greenhouse Effect)"] },
          { name: "Genetika & Bioteknologi", subtopics: ["Kromosom, DNA, RNA", "Hukum Mendel I & II", "Persilangan Monohibrid & Dihibrid", "Kelainan Genetik", "Bioteknologi Konvensional (Fermentasi)", "Bioteknologi Modern"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Tenses & Advanced Grammar", subtopics: ["Simple Present & Present Continuous", "Simple Past & Past Continuous", "Present Perfect Tense", "Simple Future (Will & Be going to)", "Passive Voice (Present & Past)", "Degrees of Comparison (Positive, Comparative, Superlative)", "Question Tags", "Conjunctions (so, because, although, etc.)", "Gerunds & Infinitives"] },
          { name: "Text Types (Genres)", subtopics: ["Descriptive Text", "Recount Text (Personal & Factual)", "Narrative Text (Fairy Tales, Legends, Fables)", "Procedure Text (Recipes, Manuals)", "Report Text", "Notice, Warning & Caution", "Short Message & Announcement", "Label (Food & Drug)"] },
          { name: "Functional Expressions", subtopics: ["Asking for & Giving Opinion", "Expressing Agreement & Disagreement", "Congratulating & Complimenting", "Expressing Hope & Wish", "Asking for & Giving Permission", "Checking for Understanding", "Showing Appreciation", "Inviting, Accepting & Declining Invitation"] },
          { name: "Reading Comprehension Strategy", subtopics: ["Finding Main Idea", "Finding Specific Information", "Understanding Reference Words", "Understanding Synonym/Antonym from Context"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Laporan & Observasi", subtopics: ["Struktur Teks Laporan Hasil Observasi", "Menentukan Gagasan Pokok LHO", "Kebahasaan (Kalimat Definisi & Deskripsi)"] },
          { name: "Teks Eksposisi & Tanggapan", subtopics: ["Struktur Teks Eksposisi (Tesis, Argumen, Penegasan)", "Teks Tanggapan (Kritik & Pujian)", "Teks Persuasi (Ajakan, Fakta, Pendapat)"] },
          { name: "Teks Naratif & Sastra", subtopics: ["Teks Cerita Fantasi", "Teks Fabel", "Teks Cerpen (Unsur Intrinsik & Ekstrinsik)", "Puisi Rakyat (Pantun, Gurindam, Syair)", "Teks Puisi Modern", "Teks Drama (Dialog, Tokoh, Latar)", "Teks Ulasan/Resensi (Buku & Film)"] },
          { name: "Teks Informatif", subtopics: ["Teks Berita (Unsur ADiKSiMBa)", "Teks Prosedur (Tujuan, Bahan, Langkah)", "Teks Eksplanasi (Proses Fenomena Alam/Sosial)", "Teks Biografi (Perjalanan Hidup Tokoh)", "Teks Diskusi (Argumen Pro & Kontra)"] },
          { name: "Kaidah Kebahasaan", subtopics: ["Kalimat Aktif Transitif & Intransitif", "Kalimat Langsung & Tidak Langsung", "Kata Kerja Mental & Material", "Konjungsi Temporal & Kausalitas", "Gaya Bahasa / Majas (Personifikasi, Metafora, Hiperbola, dll)", "Ejaan & Tanda Baca (PUEBI)"] }
        ]
      },
      {
        name: "IPS Terpadu",
        topics: [
          { name: "Geografi & Interaksi Ruang", subtopics: ["Pemahaman Lokasi Melalui Peta", "Letak Astronomis & Geografis Indonesia", "Potensi Sumber Daya Alam Indonesia", "Dinamika Kependudukan Indonesia", "Kondisi Alam Negara-Negara ASEAN", "Interaksi Antarruang Negara ASEAN", "Karakteristik Benua Asia & Benua Lainnya", "Dampak Perdagangan Internasional"] },
          { name: "Sosiologi (Interaksi Sosial)", subtopics: ["Bentuk-bentuk Interaksi Sosial (Asosiatif & Disosiatif)", "Lembaga Sosial (Keluarga, Agama, Pendidikan, Ekonomi, Politik)", "Mobilitas Sosial (Vertikal & Horizontal)", "Pluralitas Masyarakat Indonesia (Agama, Budaya, Suku)", "Konflik & Integrasi Sosial", "Perubahan Sosial Budaya", "Dampak Globalisasi"] },
          { name: "Ekonomi", subtopics: ["Kelangkaan & Skala Prioritas", "Kebutuhan & Alat Pemuas Kebutuhan", "Tindakan, Motif, & Prinsip Ekonomi", "Kegiatan Ekonomi (Produksi, Distribusi, Konsumsi)", "Permintaan, Penawaran, & Harga Keseimbangan (Pasar)", "Peran Pelaku Ekonomi (RTK, RTP, Pemerintah, Luar Negeri)", "Perdagangan Antardaerah & Antarpulau", "Perdagangan Internasional (Ekspor & Impor)", "Ekonomi Kreatif"] },
          { name: "Sejarah Nusantara & Nasional", subtopics: ["Masa Praaksara di Indonesia", "Masa Hindu-Buddha di Nusantara", "Masa Islam di Nusantara", "Kedatangan Bangsa Barat (Kolonialisme)", "Masa Pendudukan Jepang", "Pergerakan Nasional (Budi Utomo, Sumpah Pemuda)", "Persiapan & Proklamasi Kemerdekaan RI", "Mempertahankan Kemerdekaan", "Masa Demokrasi Liberal & Terpimpin", "Masa Orde Baru & Reformasi"] }
        ]
      },
      {
        name: "PPKN (Pendidikan Pancasila & Kewarganegaraan)",
        topics: [
          { name: "Pancasila sebagai Dasar Negara", subtopics: ["Sejarah Perumusan Pancasila sebagai Dasar Negara", "Penetapan Pancasila", "Semangat Pendiri Negara dalam Merumuskan Pancasila", "Dinamika Perwujudan Pancasila dari Masa ke Masa", "Pancasila sebagai Ideologi Terbuka", "Nilai-nilai Pancasila dalam Kehidupan Sehari-hari"] },
          { name: "Konstitusi & UUD 1945", subtopics: ["Perumusan & Pengesahan UUD NRI Tahun 1945", "Makna Alinea Pembukaan UUD 1945", "Pokok Pikiran Pembukaan UUD 1945", "Tata Urutan Peraturan Perundang-undangan di Indonesia", "Proses Pembuatan Undang-Undang"] },
          { name: "Norma, Hukum, & Keadilan", subtopics: ["Macam-macam Norma (Agama, Kesusilaan, Kesopanan, Hukum)", "Pentingnya Norma dalam Kehidupan Bermasyarakat", "Sistem Hukum & Peradilan di Indonesia", "Sikap Taat terhadap Hukum"] },
          { name: "Negara Kesatuan Republik Indonesia (NKRI)", subtopics: ["Makna Persatuan & Kesatuan", "Daerah dalam Kerangka NKRI", "Peran Daerah dalam Perjuangan Kemerdekaan", "Otonomi Daerah", "Ancaman terhadap NKRI & Strategi Mengatasinya", "Bela Negara"] },
          { name: "Kebangkitan Nasional & Sumpah Pemuda", subtopics: ["Latar Belakang Kebangkitan Nasional (Budi Utomo)", "Makna Sumpah Pemuda 1928", "Nilai Semangat Sumpah Pemuda", "Semangat & Komitmen Kebangsaan Pendiri Negara"] },
          { name: "Keberagaman Suku, Agama, Ras, dan Antargolongan (SARA)", subtopics: ["Faktor Penyebab Keberagaman Masyarakat Indonesia", "Keberagaman Suku, Agama, Ras, dan Budaya", "Makna Bhinneka Tunggal Ika", "Toleransi dalam Keberagaman", "Penyelesaian Konflik dalam Masyarakat Beragam"] }
        ]
      }
    ]
  },
  {
    level: "SMA/K",
    subjects: [
      {
        name: "Matematika Wajib",
        topics: [
          { name: "Persamaan & Pertidaksamaan Nilai Mutlak", subtopics: ["Konsep Nilai Mutlak", "Persamaan Linear Nilai Mutlak Satu Variabel", "Pertidaksamaan Linear Nilai Mutlak Satu Variabel"] },
          { name: "Sistem Persamaan & Pertidaksamaan", subtopics: ["Sistem Persamaan Linear Tiga Variabel (SPLTV)", "Sistem Persamaan Linear Kuadrat (SPLK)", "Pertidaksamaan Rasional & Irasional", "Sistem Pertidaksamaan Dua Variabel (Linear-Kuadrat, Kuadrat-Kuadrat)"] },
          { name: "Relasi & Fungsi", subtopics: ["Domain, Kodomain, Range", "Fungsi Linear, Kuadrat, Rasional", "Fungsi Komposisi", "Fungsi Invers"] },
          { name: "Trigonometri", subtopics: ["Ukuran Sudut (Derajat & Radian)", "Perbandingan Trigonometri Segitiga Siku-siku", "Sudut Berelasi di Berbagai Kuadran", "Aturan Sinus & Cosinus", "Luas Segitiga dengan Trigonometri", "Grafik Fungsi Trigonometri (Sin, Cos, Tan)"] },
          { name: "Barisan & Deret", subtopics: ["Barisan & Deret Aritmatika", "Barisan & Deret Geometri", "Deret Geometri Tak Hingga", "Aplikasi Barisan & Deret (Bunga Majemuk, Pertumbuhan, Peluruhan)"] },
          { name: "Matriks", subtopics: ["Konsep & Jenis Matriks", "Operasi Matriks (Penjumlahan, Perkalian)", "Determinan Matriks Ordo 2x2 & 3x3", "Invers Matriks", "Penyelesaian SPLDV dengan Matriks"] },
          { name: "Program Linear", subtopics: ["Pertidaksamaan Linear Dua Variabel", "Sistem Pertidaksamaan Linear Dua Variabel", "Nilai Optimum Fungsi Objektif", "Model Matematika Program Linear"] },
          { name: "Kalkulus Dasar", subtopics: ["Limit Fungsi Aljabar (Metode Substitusi, Pemfaktoran, Akar Sekawan)", "Limit di Tak Hingga", "Turunan Fungsi Aljabar (Aturan Rantai)", "Aplikasi Turunan (Persamaan Garis Singgung, Fungsi Naik/Turun, Nilai Maks/Min)", "Integral Tak Tentu Fungsi Aljabar", "Integral Tentu & Luas Daerah"] },
          { name: "Geometri Ruang (Dimensi Tiga)", subtopics: ["Kedudukan Titik, Garis, Bidang", "Jarak Titik ke Titik, Garis, Bidang", "Sudut antara Garis dan Bidang, Bidang dan Bidang"] },
          { name: "Statistika & Peluang", subtopics: ["Penyajian Data (Tabel Distribusi Frekuensi, Histogram, Poligon, Ogive)", "Ukuran Pemusatan Data Berkelompok (Mean, Median, Modus)", "Ukuran Letak & Penyebaran Data Berkelompok (Kuartil, Simpangan Baku)", "Kaidah Pencacahan (Aturan Penjumlahan, Perkalian)", "Permutasi (Unsur Sama, Siklis)", "Kombinasi", "Peluang Kejadian Saling Lepas, Bebas, Bersyarat"] }
        ]
      },
      {
        name: "Matematika Peminatan (IPA)",
        topics: [
          { name: "Fungsi Eksponensial & Logaritma", subtopics: ["Sifat-sifat Eksponen & Logaritma", "Fungsi & Grafik Eksponensial", "Persamaan & Pertidaksamaan Eksponensial", "Fungsi & Grafik Logaritma", "Persamaan & Pertidaksamaan Logaritma"] },
          { name: "Vektor", subtopics: ["Konsep Vektor (Aljabar & Geometri)", "Operasi Vektor di R2 dan R3", "Perkalian Skalar Dua Vektor (Dot Product)", "Proyeksi Ortogonal Vektor"] },
          { name: "Persamaan Trigonometri", subtopics: ["Persamaan Trigonometri Dasar", "Persamaan Trigonometri Bentuk a cos x + b sin x = c"] },
          { name: "Rumus-rumus Trigonometri", subtopics: ["Rumus Jumlah & Selisih Dua Sudut", "Rumus Sudut Ganda & Sudut Pertengahan", "Rumus Perkalian, Jumlah, & Selisih Sinus dan Cosinus"] },
          { name: "Lingkaran", subtopics: ["Persamaan Lingkaran Pusat (0,0) & (a,b)", "Bentuk Umum Persamaan Lingkaran", "Kedudukan Titik, Garis, & Lingkaran terhadap Lingkaran", "Persamaan Garis Singgung Lingkaran"] },
          { name: "Polinomial (Suku Banyak)", subtopics: ["Operasi Polinomial", "Nilai Polinomial (Substitusi & Horner)", "Teorema Sisa & Teorema Faktor", "Akar-akar Persamaan Polinomial"] },
          { name: "Kalkulus Lanjut", subtopics: ["Limit Fungsi Trigonometri", "Limit Menuju Tak Hingga Fungsi Trigonometri", "Turunan Fungsi Trigonometri", "Aplikasi Turunan Trigonometri (Garis Singgung, Titik Stasioner)", "Integral Parsial & Substitusi", "Integral Trigonometri"] },
          { name: "Distribusi Probabilitas", subtopics: ["Variabel Acak Diskrit", "Distribusi Binomial", "Distribusi Normal (Kurva Normal Z)"] }
        ]
      },
      {
        name: "Fisika",
        topics: [
          { name: "Pengukuran & Vektor", subtopics: ["Besaran, Satuan & Dimensi", "Ketidakpastian Pengukuran & Angka Penting", "Vektor (Penjumlahan, Resultan, Uraian Vektor)"] },
          { name: "Kinematika Gerak", subtopics: ["Gerak Lurus (GLB, GLBB, Gerak Jatuh Bebas, Vertikal)", "Gerak Parabola (Proyektil)", "Gerak Melingkar Beraturan (GMB & GMBB)", "Hubungan Roda-roda"] },
          { name: "Dinamika Partikel", subtopics: ["Hukum I, II, III Newton", "Gaya Berat, Gaya Normal, Gaya Gesek, Gaya Tegangan Tali", "Aplikasi Hukum Newton pada Bidang Datar & Miring", "Hukum Gravitasi Newton & Hukum Kepler"] },
          { name: "Usaha, Energi, Momentum, & Impuls", subtopics: ["Usaha & Gaya", "Energi Kinetik, Energi Potensial, Energi Mekanik", "Hukum Kekekalan Energi Mekanik", "Daya", "Momentum & Impuls", "Hukum Kekekalan Momentum", "Tumbukan (Lenting Sempurna, Sebagian, Tidak Lenting)"] },
          { name: "Dinamika Rotasi & Kesetimbangan Tegar", subtopics: ["Momen Gaya (Torsi)", "Momen Inersia", "Hukum II Newton untuk Rotasi", "Energi Kinetik Rotasi & Menggelinding", "Momentum Sudut", "Titik Berat", "Kesetimbangan Benda Tegar"] },
          { name: "Elastisitas & Fluida", subtopics: ["Tegangan, Regangan, Modulus Young", "Hukum Hooke & Susunan Pegas", "Fluida Statis (Tekanan Hidrostatis, Hukum Pascal, Archimedes)", "Tegangan Permukaan & Kapilaritas", "Fluida Dinamis (Asas Kontinuitas, Hukum Bernoulli & Aplikasinya)"] },
          { name: "Suhu, Kalor, & Termodinamika", subtopics: ["Termometer & Pemuaian", "Kalor, Perubahan Wujud, & Asas Black", "Perpindahan Kalor (Konduksi, Konveksi, Radiasi)", "Teori Kinetik Gas Ideal (Hukum Boyle, Charles, Gay-Lussac, Persamaan Gas Ideal)", "Energi Dalam Gas", "Termodinamika (Proses Isotermik, Isokhorik, Isobarik, Adiabatik)", "Hukum I & II Termodinamika", "Siklus Carnot & Mesin Pendingin"] },
          { name: "Gelombang & Optik", subtopics: ["Gelombang Mekanik (Transversal, Longitudinal)", "Gelombang Berjalan & Stasioner", "Gelombang Bunyi (Intensitas, Taraf Intensitas, Efek Doppler, Dawai, Pipa Organa)", "Cahaya (Interferensi, Difraksi, Polarisasi)", "Alat Optik (Mata, Kacamata, Kamera, Lup, Mikroskop, Teropong)"] },
          { name: "Listrik & Magnet", subtopics: ["Listrik Dinamis Arus Searah (DC, Hukum Ohm, Hukum I & II Kirchhoff)", "Listrik Statis (Gaya Coulomb, Medan Listrik, Potensial Listrik, Kapasitor)", "Medan Magnet (Kawat Lurus, Melingkar, Solenoida, Toroida)", "Gaya Lorentz", "Induksi Elektromagnetik (Hukum Faraday, Lenz, Generator, Transformator)", "Listrik Arus Bolak-balik (AC, Resistor, Induktor, Kapasitor, Rangkaian RLC)"] },
          { name: "Fisika Modern", subtopics: ["Radiasi Benda Hitam & Hipotesis Planck", "Efek Fotolistrik & Efek Compton", "Relativitas Khusus (Dilatasi Waktu, Kontraksi Panjang, Massa & Energi Relativistik)", "Inti Atom (Defek Massa, Energi Ikat, Reaksi Fisi & Fusi)", "Radioaktivitas (Sinar Alfa, Beta, Gamma, Waktu Paruh)", "Teknologi Digital & Transmisi Data"] }
        ]
      },
      {
        name: "Kimia",
        topics: [
          { name: "Pengenalan Kimia & Struktur Atom", subtopics: ["Hakikat Ilmu Kimia & Metode Ilmiah", "Perkembangan Model Atom (Dalton - Mekanika Kuantum)", "Partikel Penyusun Atom (Proton, Elektron, Neutron)", "Isotop, Isobar, Isoton", "Konfigurasi Elektron (Bohr & Mekanika Kuantum, Bilangan Kuantum)"] },
          { name: "Sistem Periodik Unsur (SPU) & Ikatan Kimia", subtopics: ["Perkembangan SPU & Letak Unsur (Golongan & Periode)", "Sifat Keperiodikan Unsur (Jari-jari, Energi Ionisasi, Afinitas, Keelektronegatifan)", "Kestabilan Unsur & Struktur Lewis", "Ikatan Ion & Ikatan Kovalen (Polar/Nonpolar)", "Ikatan Logam", "Bentuk Molekul (VSEPR & Domain Elektron)", "Gaya Antarmolekul (London, Dipol, Ikatan Hidrogen)"] },
          { name: "Stoikiometri (Hitungan Kimia)", subtopics: ["Tata Nama Senyawa Anorganik & Organik Sederhana", "Persamaan Reaksi Kimia", "Hukum Dasar Kimia (Lavoisier, Proust, Dalton, Gay-Lussac, Avogadro)", "Konsep Mol (Massa Molar, Volume Molar, Molaritas)", "Rumus Empiris & Rumus Molekul", "Stoikiometri Reaksi & Pereaksi Pembatas", "Air Kristal / Hidrat"] },
          { name: "Larutan Elektrolit & Redoks Dasar", subtopics: ["Larutan Elektrolit Kuat, Lemah, & Non-Elektrolit", "Daya Hantar Listrik Larutan", "Konsep Reaksi Redoks (Oksigen, Elektron, Biloks)", "Menentukan Bilangan Oksidasi (Biloks)", "Tata Nama Senyawa Redoks (IUPAC)"] },
          { name: "Hidrokarbon & Minyak Bumi", subtopics: ["Kekhasan Atom Karbon & Atom C Primer, Sekunder, Tersier, Kuartener", "Alkana, Alkena, Alkuna (Tata Nama, Isomer, Sifat, Reaksi)", "Minyak Bumi & Fraksi-fraksinya", "Bensin & Bilangan Oktan", "Dampak Pembakaran Hidrokarbon"] },
          { name: "Termokimia", subtopics: ["Reaksi Eksoterm & Endoterm", "Persamaan Termokimia & Entalpi Standar (Pembentukan, Penguraian, Pembakaran)", "Penentuan Entalpi Reaksi (Kalorimetri, Hukum Hess, Data Entalpi Pembentukan, Energi Ikatan)"] },
          { name: "Laju Reaksi & Kesetimbangan Kimia", subtopics: ["Konsep Laju Reaksi & Molaritas", "Faktor-faktor yang Mempengaruhi Laju Reaksi (Teori Tumbukan)", "Orde Reaksi & Persamaan Laju", "Konsep Kesetimbangan Dinamis & Reaksi Reversibel", "Tetapan Kesetimbangan (Kc & Kp)", "Pergeseran Kesetimbangan (Asas Le Chatelier)"] },
          { name: "Kimia Larutan", subtopics: ["Teori Asam Basa (Arrhenius, Bronsted-Lowry, Lewis)", "pH Asam Basa Kuat & Lemah", "Titrasi Asam Basa & Kurva Titrasi", "Larutan Penyangga (Buffer) & Perhitungan pH", "Hidrolisis Garam & Perhitungan pH", "Kelarutan (s) & Hasil Kali Kelarutan (Ksp)", "Prediksi Pengendapan (Qc vs Ksp)"] },
          { name: "Sistem Koloid", subtopics: ["Sistem Dispersi (Larutan, Koloid, Suspensi)", "Jenis-jenis Koloid", "Sifat-sifat Koloid (Efek Tyndall, Gerak Brown, Adsorpsi, Koagulasi)", "Koloid Liofil & Liofob", "Pembuatan Koloid"] },
          { name: "Sifat Koligatif Larutan", subtopics: ["Konsentrasi Larutan (Molalitas, Fraksi Mol)", "Penurunan Tekanan Uap (Hukum Raoult)", "Kenaikan Titik Didih & Penurunan Titik Beku", "Tekanan Osmotik", "Sifat Koligatif Larutan Elektrolit (Faktor Van't Hoff)"] },
          { name: "Redoks Lanjut & Elektrokimia", subtopics: ["Penyetaraan Reaksi Redoks (Metode Setengah Reaksi & Biloks)", "Sel Volta / Galvani (Potensial Sel, Deret Volta)", "Baterai & Aki", "Korosi & Pencegahannya", "Sel Elektrolisis (Reaksi di Katoda & Anoda)", "Hukum Faraday I & II"] },
          { name: "Kimia Unsur", subtopics: ["Kelimpahan Unsur di Alam", "Sifat, Pembuatan & Kegunaan Unsur Golongan Utama (Gas Mulia, Halogen, Alkali, Alkali Tanah, dll)", "Unsur Transisi Periode 4", "Senyawa Kompleks"] },
          { name: "Senyawa Karbon Turunan Alkana", subtopics: ["Gugus Fungsi", "Alkohol & Eter (Tata Nama, Isomer, Sifat, Reaksi)", "Aldehid & Keton", "Asam Karboksilat & Ester (Reaksi Esterifikasi)", "Haloalkana"] },
          { name: "Benzena & Makromolekul", subtopics: ["Struktur & Resonansi Benzena", "Turunan Benzena & Tata Namanya", "Sifat & Kegunaan Benzena", "Polimer (Adisi & Kondensasi)", "Karbohidrat, Protein, Lipid (Lemak)"] }
        ]
      },
      {
        name: "Biologi",
        topics: [
          { name: "Ruang Lingkup Biologi & Keanekaragaman Hayati", subtopics: ["Cabang-cabang Biologi & Kerja Ilmiah", "Tingkat Organisasi Kehidupan", "Tingkat Keanekaragaman Hayati (Gen, Jenis, Ekosistem)", "Keanekaragaman Hayati Indonesia (Garis Wallace & Weber)", "Upaya Pelestarian Keanekaragaman Hayati", "Klasifikasi Makhluk Hidup (Sistem 5 Kingdom, Kladogram)"] },
          { name: "Virus & Monera", subtopics: ["Ciri-ciri & Struktur Virus", "Reproduksi Virus (Daur Litik & Lisogenik)", "Peranan Virus dalam Kehidupan (Penyakit & Vaksin)", "Bakteri (Archaebacteria & Eubacteria)", "Struktur, Bentuk, & Reproduksi Bakteri", "Peranan Bakteri"] },
          { name: "Protista & Fungi", subtopics: ["Protista Mirip Hewan (Protozoa)", "Protista Mirip Tumbuhan (Alga/Ganggang)", "Protista Mirip Jamur", "Ciri & Struktur Fungi (Jamur)", "Klasifikasi Fungi (Zygomycota, Ascomycota, Basidiomycota, Deuteromycota)", "Simbiosis Jamur (Mikoriza, Lichen)"] },
          { name: "Plantae (Dunia Tumbuhan)", subtopics: ["Ciri Umum Plantae", "Tumbuhan Lumut (Bryophyta)", "Tumbuhan Paku (Pteridophyta)", "Tumbuhan Berbiji (Spermatophyta: Gymnospermae & Angiospermae)", "Metagenesis (Daur Hidup Tumbuhan)"] },
          { name: "Animalia (Dunia Hewan)", subtopics: ["Ciri Umum Animalia & Simetri Tubuh", "Invertebrata (Porifera, Coelenterata, Vermes, Arthropoda, Mollusca, Echinodermata)", "Vertebrata (Pisces, Amphibia, Reptilia, Aves, Mammalia)"] },
          { name: "Ekosistem & Lingkungan", subtopics: ["Komponen Ekosistem", "Aliran Energi (Rantai, Jaring Makanan, Piramida Ekologi)", "Daur Biogeokimia (Karbon, Nitrogen, Air, Fosfor)", "Perubahan Lingkungan & Limbah", "Polusi & Pemanasan Global"] },
          { name: "Sel", subtopics: ["Teori Sel", "Struktur & Fungsi Organel Sel (Hewan & Tumbuhan)", "Transport Membran (Difusi, Osmosis, Transpor Aktif, Endositosis, Eksositosis)"] },
          { name: "Jaringan Tumbuhan & Hewan", subtopics: ["Jaringan Meristem & Dewasa (Epidermis, Parenkim, Penyokong, Pengangkut)", "Organ Tumbuhan (Akar, Batang, Daun, Bunga)", "Jaringan Epitel, Ikat, Otot, Saraf pada Hewan", "Sistem Organ Manusia & Hewan"] },
          { name: "Sistem Organ Manusia", subtopics: ["Sistem Gerak (Tulang, Sendi, Otot, Gangguan)", "Sistem Peredaran Darah (Jantung, Pembuluh, Darah, Sistem Limfa, Gangguan)", "Sistem Pencernaan (Zat Makanan, Organ, Enzim, Ruminansia, Gangguan)", "Sistem Pernapasan (Mekanisme, Volume, Gangguan)", "Sistem Ekskresi (Ginjal, Kulit, Paru-paru, Hati, Proses Pembentukan Urine)", "Sistem Koordinasi (Sistem Saraf, Otak, Sumsum Tulang Belakang)", "Sistem Endokrin (Hormon)", "Sistem Indera (Mata, Telinga, Hidung, Lidah, Kulit)", "Sistem Reproduksi Manusia (Pria & Wanita, Spermatogenesis, Oogenesis, Menstruasi)", "Sistem Pertahanan Tubuh (Imunitas Spesifik & Non-spesifik)"] },
          { name: "Pertumbuhan & Perkembangan", subtopics: ["Perkecambahan & Tipe Perkecambahan", "Pertumbuhan Primer & Sekunder", "Faktor Internal (Hormon) & Eksternal yang Mempengaruhi", "Pertumbuhan pada Hewan (Metamorfosis)"] },
          { name: "Metabolisme", subtopics: ["Enzim (Struktur, Sifat, Cara Kerja, Faktor Pengaruh)", "Katabolisme Karbohidrat (Respirasi Aerob: Glikolisis, Dekarboksilasi Oksidatif, Siklus Krebs, Transpor Elektron)", "Respirasi Anaerob (Fermentasi Asam Laktat & Alkohol)", "Anabolisme (Fotosintesis: Reaksi Terang & Gelap/Siklus Calvin)", "Kemosintesis", "Keterkaitan Metabolisme Karbohidrat, Lemak, Protein"] },
          { name: "Substansi Genetika & Pembelahan Sel", subtopics: ["Kromosom, Gen, Alel", "Struktur DNA & RNA", "Replikasi DNA", "Sintesis Protein (Transkripsi & Translasi)", "Siklus Sel (Interfase & Mitosis)", "Meiosis I & II", "Gametogenesis (Spermatogenesis, Oogenesis, Mikro/Megasporogenesis)"] },
          { name: "Hukum Mendel & Pewarisan Sifat", subtopics: ["Persilangan Monohibrid & Dihibrid", "Hukum Mendel I (Segregasi) & II (Asortasi)", "Penyimpangan Semu Hukum Mendel (Atavisme, Kriptomeri, Polimeri, Epistasis-Hipostasis, Komplementer)", "Pautan, Pindah Silang, Gagal Berpisah, Gen Letal", "Pewarisan Sifat pada Manusia (Golongan Darah, Buta Warna, Hemofilia, Albino)"] },
          { name: "Mutasi & Evolusi", subtopics: ["Mutasi Gen (Substitusi, Delesi, Insersi)", "Mutasi Kromosom (Aneuploidi, Euploidi, Aberasi Kromosom)", "Penyebab Mutasi (Mutagen)", "Teori Evolusi Darwin vs Lamarck", "Petunjuk Evolusi (Fosil, Homologi, Analogi, Embriologi, Biokimia)", "Mekanisme Evolusi & Hukum Hardy-Weinberg", "Spesiasi"] },
          { name: "Bioteknologi", subtopics: ["Bioteknologi Konvensional (Mikroorganisme dalam Pangan)", "Bioteknologi Modern (Rekayasa Genetika, Plasmid, Kloning)", "Kultur Jaringan", "Antibodi Monoklonal, Bayi Tabung, Transgenik", "Dampak Positif & Negatif Bioteknologi"] }
        ]
      },
      {
        name: "PPKN (Pendidikan Pancasila & Kewarganegaraan)",
        topics: [
          { name: "Pancasila", subtopics: ["Pancasila dalam Praktik Penyelenggaraan Negara", "Pancasila sebagai Ideologi Terbuka", "Pelanggaran & Penegakan HAM dalam Perspektif Pancasila", "Dinamika Penerapan Pancasila", "Ancaman terhadap Integrasi Nasional & Pancasila"] },
          { name: "Konstitusi & UUD 1945", subtopics: ["Sistem Pembagian Kekuasaan Negara RI", "Kedudukan & Fungsi Kementerian Negara RI", "Nilai-nilai Konstitusional UUD NRI 1945", "Sistem Pemerintahan Indonesia dari Masa ke Masa", "Pengelolaan Keuangan Negara & Kekuasaan Kehakiman"] },
          { name: "Hak Asasi Manusia (HAM)", subtopics: ["Kasus Pelanggaran HAM di Indonesia & Dunia", "Upaya Penegakan HAM", "Instrumen HAM Nasional & Internasional", "Peradilan HAM di Indonesia"] },
          { name: "Demokrasi & Sistem Hukum", subtopics: ["Sistem & Dinamika Demokrasi Pancasila", "Perkembangan Demokrasi di Indonesia", "Sistem Hukum & Peradilan Nasional", "Peran Lembaga Penegak Hukum (Polri, Kejaksaan, KPK, Hakim, Advokat)", "Perlindungan & Penegakan Hukum di Indonesia"] },
          { name: "Hubungan Internasional", subtopics: ["Peran Indonesia dalam Perdamaian Dunia", "Hubungan Internasional & Politik Luar Negeri Bebas Aktif", "Organisasi Internasional (PBB, ASEAN, GNB)"] },
          { name: "Wawasan Nusantara & Geopolitik", subtopics: ["Wawasan Nusantara dalam Konteks NKRI", "Asas & Kedudukan Wawasan Nusantara", "Trigatra & Pancagatra", "Geopolitik & Geostrategi Indonesia (Ketahanan Nasional)"] },
          { name: "Hak & Kewajiban Warga Negara", subtopics: ["Kasus Pelanggaran Hak & Pengingkaran Kewajiban Warga Negara", "Warga Negara dalam Demokrasi", "Penanganan Pelanggaran Hak & Kewajiban"] }
        ]
      },
      {
        name: "Ekonomi",
        topics: [
          { name: "Konsep Dasar Ilmu Ekonomi", subtopics: ["Kebutuhan, Kelangkaan, & Biaya Peluang (Opportunity Cost)", "Prinsip & Motif Ekonomi", "Pembagian Ilmu Ekonomi", "Sistem Ekonomi (Tradisional, Komando, Pasar, Campuran)"] },
          { name: "Kegiatan & Pelaku Ekonomi", subtopics: ["Produksi, Distribusi, Konsumsi", "Circular Flow Diagram (2, 3, 4 Sektor)", "Perilaku Konsumen (Pendekatan Kardinal & Ordinal)", "Perilaku Produsen (Teori Produksi & Biaya Produksi)"] },
          { name: "Pasar & Terbentuknya Harga Pasar", subtopics: ["Permintaan (Demand) & Penawaran (Supply)", "Hukum & Kurva Permintaan/Penawaran", "Faktor Pergeseran Kurva", "Harga Keseimbangan (Equilibrium)", "Elastisitas Permintaan & Penawaran", "Struktur Pasar (Persaingan Sempurna, Monopoli, Oligopoli, Monopolistik)"] },
          { name: "Lembaga Jasa Keuangan & Bank Sentral", subtopics: ["Otoritas Jasa Keuangan (OJK)", "Bank Sentral (Bank Indonesia) - Tugas & Wewenang", "Bank Umum, BPR, Bank Syariah", "Lembaga Keuangan Bukan Bank (Asuransi, Pegadaian, Dana Pensiun, Pasar Modal)", "Alat Pembayaran (Tunai & Non-tunai)"] },
          { name: "Manajemen & Badan Usaha", subtopics: ["Unsur, Fungsi, & Bidang Manajemen", "BUMN, BUMD, BUMS (Ciri, Peran, Bentuk)", "Koperasi (Asas, Prinsip, Perangkat, SHU)"] },
          { name: "Pendapatan Nasional & Pertumbuhan Ekonomi", subtopics: ["Konsep Pendapatan Nasional (GDP, GNP, NNP, NNI, PI, DI)", "Metode Perhitungan Pendapatan Nasional (Produksi, Pendapatan, Pengeluaran)", "Pendapatan Per Kapita", "Pertumbuhan Ekonomi vs Pembangunan Ekonomi", "Teori Pertumbuhan Ekonomi", "Indikator Pembangunan Ekonomi"] },
          { name: "Ketenagakerjaan & Indeks Harga", subtopics: ["Angkatan Kerja, Tenaga Kerja, Kesempatan Kerja", "Sistem Upah & Pengangguran (Jenis & Cara Mengatasi)", "Indeks Harga", "Inflasi (Penyebab, Jenis, Dampak, Cara Mengatasi)"] },
          { name: "Kebijakan Ekonomi (Moneter & Fiskal)", subtopics: ["Kebijakan Moneter (Instrumen: Diskonto, Pasar Terbuka, Cadangan Kas)", "Kebijakan Fiskal (Pajak & Pengeluaran Pemerintah)"] },
          { name: "APBN & APBD", subtopics: ["Fungsi & Tujuan APBN/APBD", "Sumber Penerimaan & Jenis Pengeluaran", "Mekanisme Penyusunan APBN/APBD", "Pajak (Fungsi, Asas, Jenis, PPh, PBB, PPN)"] },
          { name: "Perdagangan & Kerja Sama Internasional", subtopics: ["Teori Perdagangan Internasional (Keunggulan Mutlak & Komparatif)", "Kebijakan Perdagangan Internasional (Tarif, Kuota, Subsidi, Dumping)", "Neraca Pembayaran & Devisa", "Bentuk-bentuk Kerja Sama Ekonomi Internasional", "Lembaga Ekonomi Internasional (IMF, World Bank, WTO, ASEAN)"] },
          { name: "Akuntansi Perusahaan Jasa", subtopics: ["Persamaan Dasar Akuntansi", "Bukti Transaksi & Aturan Debit/Kredit", "Jurnal Umum & Buku Besar", "Neraca Saldo", "Jurnal Penyesuaian", "Kertas Kerja (Worksheet)", "Laporan Keuangan (Laba/Rugi, Perubahan Modal, Neraca)", "Jurnal Penutup & Pembalik"] },
          { name: "Akuntansi Perusahaan Dagang", subtopics: ["Karakteristik Perusahaan Dagang & Syarat Pembayaran", "Jurnal Khusus (Pembelian, Penjualan, Penerimaan Kas, Pengeluaran Kas)", "Buku Besar Utama & Pembantu", "Harga Pokok Penjualan (HPP)", "Jurnal Penyesuaian Perusahaan Dagang (Metode Ikhtisar L/R & HPP)", "Laporan Keuangan Perusahaan Dagang", "Jurnal Penutup & Neraca Saldo Setelah Penutupan"] }
        ]
      },
      {
        name: "Geografi",
        topics: [
          { name: "Pengetahuan Dasar Geografi", subtopics: ["Ruang Lingkup & Objek Studi Geografi", "Konsep Esensial Geografi (Lokasi, Jarak, Keterjangkauan, dll)", "Prinsip Geografi (Distribusi, Interelasi, Deskripsi, Korologi)", "Pendekatan Geografi (Keruangan, Kelingkungan, Kompleks Wilayah)"] },
          { name: "Pemetaan, Penginderaan Jauh, & SIG", subtopics: ["Peta (Komponen, Skala, Proyeksi)", "Penginderaan Jauh (Komponen, Citra, Interpretasi)", "Sistem Informasi Geografis / SIG (Komponen, Subsistem, Manfaat)"] },
          { name: "Dinamika Litosfer", subtopics: ["Struktur Lapisan Bumi", "Tenaga Endogen (Tektonisme, Vulkanisme, Seisme)", "Tenaga Eksogen (Pelapukan, Erosi, Mass Wasting, Sedimentasi)", "Siklus Batuan", "Pembentukan & Jenis Tanah"] },
          { name: "Dinamika Atmosfer", subtopics: ["Lapisan Atmosfer & Manfaatnya", "Unsur Cuaca & Iklim (Suhu, Tekanan, Angin, Kelembapan, Curah Hujan)", "Klasifikasi Iklim (Koppen, Junghuhn, Schmidt-Ferguson)", "El Nino & La Nina", "Lembaga BMKG"] },
          { name: "Dinamika Hidrosfer", subtopics: ["Siklus Hidrologi", "Perairan Darat (Sungai, Danau, Air Tanah, Rawa)", "Perairan Laut (Zona Laut, Relief Dasar Laut, Arus Laut)", "Potensi & Pelestarian Perairan Indonesia"] },
          { name: "Dinamika Biosfer (Flora & Fauna)", subtopics: ["Faktor Persebaran Flora & Fauna", "Persebaran Bioma di Dunia", "Persebaran Flora & Fauna di Indonesia (Asiatis, Peralihan, Australis)", "Konservasi Flora & Fauna (Taman Nasional, Cagar Alam)"] },
          { name: "Dinamika Antroposfer (Kependudukan)", subtopics: ["Sumber Data Kependudukan (Sensus, Survei, Registrasi)", "Kuantitas Penduduk (Kelahiran, Kematian, Migrasi)", "Kualitas Penduduk", "Piramida Penduduk & Bonus Demografi"] },
          { name: "Sumber Daya Alam (SDA)", subtopics: ["Klasifikasi SDA", "Potensi & Persebaran SDA Indonesia (Kehutanan, Pertambangan, Kelautan, Pariwisata)", "AMDAL & Pembangunan Berkelanjutan"] },
          { name: "Mitigasi Bencana Alam", subtopics: ["Jenis & Karakteristik Bencana Alam", "Siklus Penanggulangan Bencana", "Mitigasi Gempa, Tsunami, Gunung Meletus, Banjir, Tanah Longsor"] },
          { name: "Wilayah & Perwilayahan", subtopics: ["Konsep Wilayah (Formal & Fungsional)", "Pusat Pertumbuhan (Teori Tempat Sentral, Kutub Pertumbuhan)", "Perencanaan Tata Ruang Nasional"] },
          { name: "Interaksi Desa & Kota", subtopics: ["Struktur Keruangan Desa & Kota", "Teori Interaksi Kota (Gravitasi, Titik Henti, Grafik)", "Dampak Interaksi Desa-Kota (Urbanisasi)"] },
          { name: "Negara Maju & Berkembang", subtopics: ["Karakteristik & Indikator Negara Maju & Berkembang", "Persebaran Negara Maju & Berkembang di Dunia", "Bentuk Kerja Sama Negara Maju & Berkembang"] }
        ]
      },
      {
        name: "Sosiologi",
        topics: [
          { name: "Fungsi Sosiologi", subtopics: ["Sosiologi sebagai Ilmu Pengetahuan", "Objek Kajian Sosiologi", "Fungsi Sosiologi dalam Pemecahan Masalah & Pembangunan", "Peran Sosiolog"] },
          { name: "Individu, Kelompok, & Hubungan Sosial", subtopics: ["Tindakan Sosial", "Interaksi Sosial (Syarat & Faktor Pendorong)", "Bentuk Interaksi Asosiatif & Disosiatif", "Nilai & Norma Sosial", "Sosialisasi (Tahap, Agen, Tipe)", "Keteraturan Sosial"] },
          { name: "Gejala Sosial & Masalah Sosial", subtopics: ["Ragam Gejala Sosial di Masyarakat", "Kemiskinan, Kriminalitas, Kesenjangan Sosial", "Perilaku Menyimpang & Teori Penyimpangan", "Pengendalian Sosial (Preventif, Represif)"] },
          { name: "Kelompok Sosial", subtopics: ["Syarat & Ciri Kelompok Sosial", "Tipe Kelompok Sosial (Klasifikasi Durkheim, Tonnies, Cooley, dll)", "Dinamika Kelompok Sosial"] },
          { name: "Struktur Sosial & Multikulturalisme", subtopics: ["Diferensiasi Sosial (Agama, Suku, Ras, Profesi)", "Stratifikasi Sosial (Sifat, Dasar, Bentuk)", "Masyarakat Multikultural (Karakteristik & Konsekuensi)", "Interseksi & Konsolidasi"] },
          { name: "Konflik, Kekerasan, & Perdamaian", subtopics: ["Faktor Penyebab & Bentuk Konflik Sosial", "Dampak Konflik & Kekerasan", "Resolusi Konflik (Akomodasi, Mediasi, Arbitrase)", "Integrasi Sosial & Reintegrasi"] },
          { name: "Mobilitas Sosial", subtopics: ["Bentuk Mobilitas Sosial (Vertikal, Horizontal, Antargenerasi)", "Faktor Pendorong & Penghambat", "Saluran Mobilitas Sosial", "Dampak Mobilitas Sosial"] },
          { name: "Perubahan Sosial & Globalisasi", subtopics: ["Teori & Bentuk Perubahan Sosial", "Faktor Pendorong & Penghambat Perubahan", "Dampak Globalisasi & Modernisasi", "Westernisasi, Hedonisme, Konsumerisme", "Kearifan Lokal dalam Menghadapi Globalisasi"] },
          { name: "Penelitian Sosial", subtopics: ["Jenis Penelitian Sosial (Kualitatif & Kuantitatif)", "Rancangan Penelitian (Topik, Rumusan Masalah, Variabel)", "Teknik Pengumpulan Data (Angket, Wawancara, Observasi)", "Pengolahan & Analisis Data", "Penyusunan Laporan Penelitian Sosial"] }
        ]
      },
      {
        name: "Sejarah",
        topics: [
          { name: "Konsep Dasar Sejarah", subtopics: ["Pengertian & Unsur Sejarah", "Konsep Ruang & Waktu dalam Sejarah", "Berpikir Diakronik, Sinkronik, Kronologis", "Sumber, Bukti, & Fakta Sejarah", "Penelitian Sejarah (Heuristik, Kritik, Interpretasi, Historiografi)"] },
          { name: "Masa Praaksara", subtopics: ["Asal Usul Nenek Moyang Bangsa Indonesia", "Manusia Purba di Indonesia & Dunia", "Corak Kehidupan Masa Praaksara (Berburu, Bercocok Tanam, Perundagian)", "Hasil Budaya Praaksara (Megalitikum)"] },
          { name: "Masa Peradaban Kuno Dunia", subtopics: ["Peradaban Mesopotamia & Mesir Kuno", "Peradaban India & Tiongkok Kuno", "Peradaban Yunani & Romawi Kuno"] },
          { name: "Masa Hindu-Buddha", subtopics: ["Teori Masuknya Hindu-Buddha", "Kerajaan-kerajaan Hindu-Buddha di Nusantara (Kutai, Tarumanegara, Sriwijaya, Majapahit, dll)", "Peninggalan Budaya Hindu-Buddha (Candi, Prasasti, Kitab)"] },
          { name: "Masa Kerajaan Islam", subtopics: ["Teori Masuknya Islam ke Nusantara", "Kerajaan-kerajaan Islam (Samudera Pasai, Demak, Mataram Islam, Ternate-Tidore, dll)", "Akulturasi Kebudayaan Islam & Lokal"] },
          { name: "Penjelajahan Samudra & Kolonialisme", subtopics: ["Latar Belakang Penjelajahan Samudra (3G)", "Masa Kekuasaan VOC & Kebijakannya", "Masa Hindia Belanda (Daendels, Raffles, Tanam Paksa, Politik Etis)", "Perlawanan Rakyat Daerah terhadap Kolonialisme (Pangeran Diponegoro, Imam Bonjol, Pattimura, dll)"] },
          { name: "Pergerakan Nasional", subtopics: ["Faktor Pendorong Pergerakan Nasional", "Organisasi Pergerakan (Budi Utomo, Sarekat Islam, Indische Partij, PNI)", "Sumpah Pemuda 1928", "Masa Pendudukan Jepang (Organisasi Militer, Semimiliter, Romusha, Perlawanan Rakyat)"] },
          { name: "Proklamasi Kemerdekaan", subtopics: ["Peristiwa Rengasdengklok", "Perumusan Teks Proklamasi", "Makna Proklamasi & Pembentukan Kelengkapan Negara (PPKI)"] },
          { name: "Mempertahankan Kemerdekaan", subtopics: ["Perjuangan Fisik/Bersenjata (Pertempuran Surabaya, Ambarawa, Bandung Lautan Api)", "Perjuangan Diplomasi (Linggajati, Renville, Roem-Royen, KMB)", "Agresi Militer Belanda I & II"] },
          { name: "Ancaman Disintegrasi Bangsa", subtopics: ["Pemberontakan PKI Madiun, DI/TII", "Pemberontakan APRA, Andi Azis, RMS", "PRRI/Permesta, G30S/PKI"] },
          { name: "Demokrasi Liberal & Terpimpin", subtopics: ["Sistem Kabinet Masa Demokrasi Liberal", "Pemilu 1955", "Dekrit Presiden 1959", "Dinamika Politik & Ekonomi Demokrasi Terpimpin"] },
          { name: "Orde Baru & Reformasi", subtopics: ["Lahirnya Orde Baru (Supersemar)", "Kebijakan Politik & Ekonomi Orde Baru", "Krisis Moneter 1997 & Jatuhnya Soeharto", "Masa Reformasi (Habibie, Gus Dur, Megawati, SBY)"] },
          { name: "Peran Indonesia di Tingkat Global", subtopics: ["Konferensi Asia Afrika (KAA)", "Gerakan Non-Blok (GNB)", "Misi Garuda & ASEAN", "Perkembangan IPTEK di Era Globalisasi"] },
          { name: "Peristiwa Kontemporer Dunia", subtopics: ["Perang Dingin (Blok Barat vs Blok Timur)", "Runtuhnya Uni Soviet, Jerman Timur, Yugoslavia", "Konflik Timur Tengah & Apartheid di Afrika Selatan"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Advanced Tenses & Grammar", subtopics: ["Review 16 Tenses", "Passive Voice (All Tenses)", "Conditional Sentences (Type 1, 2, 3)", "Subjunctive (Wish, If only, As if, Would rather)", "Causative Verbs (Have, Get, Make, Let)", "Direct & Indirect Speech (Reported Speech)", "Relative Clauses & Adjective Clauses", "Participles (Present & Past Participle)", "Inversion in Sentences"] },
          { name: "Text Types (Advanced)", subtopics: ["Narrative Text (Short Story, Novel Extract)", "Analytical Exposition Text", "Hortatory Exposition Text", "Explanation Text", "Discussion Text", "Review Text (Movies, Books)", "News Item Text", "Formal Letters (Application, Inquiry)"] },
          { name: "Reading Comprehension & Literacy", subtopics: ["Main Idea & Topic Sentence", "Explicit & Implicit Information", "Inference (Drawing Conclusions)", "Reference Words", "Vocabulary in Context (Synonym/Antonym)"] },
          { name: "Listening & Speaking Expressions", subtopics: ["Offering Help & Services", "Giving Suggestions & Advice", "Expressing Cause & Effect", "Expressing Satisfaction & Dissatisfaction", "Expressing Persuasion & Argumentation", "Presenting a Proposal or Report"] },
          { name: "TOEFL/UTBK Preparation", subtopics: ["Structure & Written Expression (Error Recognition)", "Reading Comprehension Strategies (Skimming & Scanning)", "Vocabulary Mastery for UTBK", "Literasi Bahasa Inggris (SNBT)"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Prosedur & Eksplanasi", subtopics: ["Struktur & Kebahasaan Teks Prosedur Kompleks", "Struktur & Kebahasaan Teks Eksplanasi (Fenomena)", "Menyusun Teks Prosedur & Eksplanasi"] },
          { name: "Teks Ceramah & Pidato", subtopics: ["Unsur & Struktur Teks Ceramah", "Kaidah Kebahasaan Teks Ceramah", "Teknik Berpidato/Berceramah"] },
          { name: "Teks Cerpen, Novel & Resensi", subtopics: ["Unsur Intrinsik & Ekstrinsik Cerpen/Novel", "Nilai-nilai dalam Karya Sastra (Moral, Sosial, Budaya)", "Struktur Teks Resensi/Ulasan", "Menulis Resensi Buku/Film"] },
          { name: "Teks Negosiasi & Debat", subtopics: ["Struktur & Kebahasaan Teks Negosiasi", "Unsur-unsur Debat (Mosi, Tim Afirmasi, Oposisi, Netral)", "Tata Cara & Ragam Bahasa Debat"] },
          { name: "Teks Biografi & Puisi", subtopics: ["Struktur Teks Biografi (Orientasi, Peristiwa, Reorientasi)", "Kaidah Kebahasaan Biografi", "Unsur Pembangun Puisi (Fisik & Batin)", "Mendemonstrasikan & Menulis Puisi"] },
          { name: "Teks Editorial & Opini", subtopics: ["Fakta & Opini dalam Teks Editorial (Tajuk Rencana)", "Struktur & Kebahasaan Teks Editorial", "Menulis Artikel Opini/Jurnalistik"] },
          { name: "Karya Tulis Ilmiah", subtopics: ["Sistematika Karya Ilmiah (Makalah, Proposal)", "Penulisan Daftar Pustaka & Kutipan", "Kaidah Kebahasaan Karya Ilmiah (Kata Baku, Kalimat Efektif)"] },
          { name: "Teks Kritik Sastra & Esai", subtopics: ["Perbedaan Kritik Sastra & Esai", "Struktur & Kebahasaan Kritik Sastra", "Menyusun Esai Pribadi"] },
          { name: "Literasi & Pemahaman Teks UTBK", subtopics: ["Gagasan Utama & Kesimpulan Paragraf", "Makna Kata, Istilah, & Frasa", "Kalimat Efektif & Padu", "Ejaan Bahasa Indonesia (PUEBI)", "Kepaduan Paragraf & Analisis Teks Panjang (SNBT)"] }
        ]
      }
    ]
  }
];
