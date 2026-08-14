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
          { name: "Bilangan & Operasi Hitung", subtopics: ["Penjumlahan & Pengurangan", "Perkalian & Pembagian", "Pecahan Biasa & Campuran", "Desimal & Persen", "KPK & FPB"] },
          { name: "Geometri Dasar", subtopics: ["Sifat Bangun Datar", "Keliling & Luas Bangun Datar", "Sifat Bangun Ruang", "Volume Kubus & Balok"] },
          { name: "Pengukuran", subtopics: ["Waktu & Jam", "Panjang & Berat", "Kecepatan & Debit"] },
          { name: "Pengolahan Data", subtopics: ["Membaca Diagram Batang/Garis", "Rata-rata (Mean)", "Modus & Median"] }
        ]
      },
      {
        name: "IPA",
        topics: [
          { name: "Makhluk Hidup", subtopics: ["Ciri & Kebutuhan Makhluk Hidup", "Penggolongan Hewan & Tumbuhan", "Rantai Makanan & Jaring-jaring", "Sistem Pencernaan & Pernapasan Manusia"] },
          { name: "Benda & Sifatnya", subtopics: ["Wujud Benda (Padat, Cair, Gas)", "Perubahan Wujud Benda", "Suhu & Kalor", "Sifat Bahan"] },
          { name: "Energi & Gaya", subtopics: ["Macam-macam Gaya", "Pengaruh Gaya terhadap Benda", "Bentuk Energi & Perubahannya", "Listrik & Magnet Dasar"] },
          { name: "Bumi & Alam Semesta", subtopics: ["Struktur Bumi", "Daur Air", "Tata Surya & Planet", "Gerhana Matahari & Bulan"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Membaca & Memahami Teks", subtopics: ["Mencari Ide Pokok", "Kesimpulan Teks", "Memahami Cerita Pendek/Dongeng"] },
          { name: "Kosakata & Ejaan", subtopics: ["Sinonim & Antonim", "Tanda Baca (Titik, Koma)", "Huruf Kapital", "Kata Imbuhan"] },
          { name: "Menulis", subtopics: ["Menyusun Kalimat Acak", "Menulis Puisi Dasar", "Surat Resmi & Pribadi Dasar"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Vocabulary Builder", subtopics: ["Animals", "Fruits & Vegetables", "Professions", "Family Members", "Daily Activities", "Parts of the Body"] },
          { name: "Grammar Basics", subtopics: ["Pronouns (I, You, They, We)", "To Be (is, am, are)", "Simple Present Tense", "There is / There are"] },
          { name: "Expressions", subtopics: ["Greetings & Partings", "Introducing Self", "Asking & Giving Directions", "Expressing Feelings"] }
        ]
      },
      {
        name: "PKn (Pendidikan Kewarganegaraan)",
        topics: [
          { name: "Pancasila & UUD 1945", subtopics: ["Lambang & Sila Pancasila", "Penerapan Sila dalam Kehidupan", "Tokoh Perumus Pancasila"] },
          { name: "Pemerintahan & Negara", subtopics: ["Sistem Pemerintahan Desa & Kecamatan", "Kabupaten & Provinsi", "Sistem Pemerintahan Pusat"] },
          { name: "Hak & Kewajiban", subtopics: ["Di Rumah", "Di Sekolah", "Di Lingkungan Masyarakat"] },
          { name: "Keberagaman Budaya", subtopics: ["Suku Bangsa di Indonesia", "Pakaian & Rumah Adat", "Sikap Toleransi"] }
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
          { name: "Bilangan & Aljabar", subtopics: ["Operasi Bilangan Bulat & Pecahan", "Bentuk Aljabar", "Persamaan & Pertidaksamaan Linear Satu Variabel (PLSV & PtLSV)", "Sistem Persamaan Linear Dua Variabel (SPLDV)", "Himpunan"] },
          { name: "Aritmatika Sosial", subtopics: ["Keuntungan & Kerugian", "Diskon & Pajak", "Bunga Tunggal", "Bruto, Netto, Tara"] },
          { name: "Geometri", subtopics: ["Garis & Sudut", "Segitiga & Segiempat", "Teorema Pythagoras", "Lingkaran", "Bangun Ruang Sisi Datar", "Bangun Ruang Sisi Lengkung"] },
          { name: "Fungsi & Peluang", subtopics: ["Relasi & Fungsi", "Fungsi Linear & Persamaan Garis Lurus", "Pola Bilangan & Barisan", "Peluang Empiris & Teoritik"] }
        ]
      },
      {
        name: "IPA Fisika",
        topics: [
          { name: "Pengukuran & Zat", subtopics: ["Besaran & Satuan", "Sifat Zat & Massa Jenis", "Suhu & Pemuaian"] },
          { name: "Mekanika", subtopics: ["Gerak Lurus (GLB & GLBB)", "Gaya & Hukum Newton", "Usaha & Energi", "Pesawat Sederhana", "Tekanan Zat Padat & Cair"] },
          { name: "Gelombang & Listrik", subtopics: ["Getaran & Gelombang", "Bunyi", "Cahaya & Alat Optik", "Listrik Statis", "Listrik Dinamis (Hukum Ohm & Kirchhoff)", "Kemagnetan"] }
        ]
      },
      {
        name: "IPA Biologi",
        topics: [
          { name: "Organisasi Kehidupan", subtopics: ["Sel, Jaringan, Organ", "Sistem Pencernaan Manusia", "Sistem Pernapasan", "Sistem Ekskresi", "Sistem Peredaran Darah", "Sistem Gerak (Rangka & Otot)"] },
          { name: "Makhluk Hidup & Lingkungan", subtopics: ["Klasifikasi Makhluk Hidup", "Ekosistem & Jaring Makanan", "Pencemaran Lingkungan & Pemanasan Global"] },
          { name: "Pewarisan Sifat", subtopics: ["Materi Genetik", "Hukum Mendel", "Persilangan Monohibrid & Dihibrid"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Tenses & Grammar", subtopics: ["Simple Present & Continuous", "Simple Past & Past Continuous", "Present Perfect", "Future Tense", "Passive Voice", "Degrees of Comparison"] },
          { name: "Text Types", subtopics: ["Descriptive Text", "Recount Text", "Narrative Text", "Procedure Text", "Report Text"] },
          { name: "Conversational Expressions", subtopics: ["Asking for Opinion", "Expressing Agreement/Disagreement", "Congratulating & Complimenting", "Expressing Hope & Wish"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Laporan & Berita", subtopics: ["Struktur Teks Berita", "Teks Eksplanasi", "Teks Laporan Hasil Observasi"] },
          { name: "Teks Sastra", subtopics: ["Puisi Kontemporer", "Cerpen (Unsur Intrinsik & Ekstrinsik)", "Teks Ulasan/Resensi", "Drama"] },
          { name: "Kebahasaan", subtopics: ["Kalimat Aktif & Pasif", "Konjungsi (Kata Hubung)", "Gaya Bahasa / Majas", "Kata Baku & Tidak Baku"] }
        ]
      },
      {
        name: "IPS Terpadu",
        topics: [
          { name: "Geografi", subtopics: ["Peta, Atlas & Globe", "Kondisi Geografis Indonesia", "Interaksi Antarruang ASEAN"] },
          { name: "Sosiologi", subtopics: ["Interaksi Sosial", "Lembaga Sosial", "Mobilitas Sosial", "Konflik & Integrasi Sosial"] },
          { name: "Ekonomi", subtopics: ["Kelangkaan & Kebutuhan Manusia", "Kegiatan Ekonomi (Produksi, Distribusi, Konsumsi)", "Permintaan & Penawaran", "Peran Pelaku Ekonomi"] },
          { name: "Sejarah", subtopics: ["Masa Praaksara di Indonesia", "Kerajaan Hindu-Buddha & Islam", "Pergerakan Nasional & Kemerdekaan RI"] }
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
          { name: "Aljabar", subtopics: ["Eksponen & Logaritma", "Sistem Persamaan Linear Tiga Variabel (SPLTV)", "Fungsi Komposisi & Invers", "Matriks", "Program Linear"] },
          { name: "Kalkulus Dasar", subtopics: ["Limit Fungsi Aljabar", "Turunan Fungsi Aljabar", "Integral Tak Tentu & Tentu", "Aplikasi Turunan (Nilai Maks/Min)"] },
          { name: "Trigonometri", subtopics: ["Perbandingan Trigonometri", "Aturan Sinus & Cosinus", "Grafik Fungsi Trigonometri"] },
          { name: "Statistika & Peluang", subtopics: ["Penyajian Data & Histogram", "Ukuran Pemusatan & Penyebaran", "Kaidah Pencacahan (Permutasi & Kombinasi)", "Peluang Kejadian Majemuk"] }
        ]
      },
      {
        name: "Matematika Peminatan (IPA)",
        topics: [
          { name: "Trigonometri Lanjut", subtopics: ["Persamaan Trigonometri", "Rumus Jumlah & Selisih Sinus Cosinus"] },
          { name: "Polinomial", subtopics: ["Operasi Polinomial", "Teorema Sisa & Faktor"] },
          { name: "Kalkulus Lanjut", subtopics: ["Limit Fungsi Trigonometri", "Turunan & Integral Trigonometri", "Aplikasi Turunan Trigonometri"] },
          { name: "Geometri Analitik", subtopics: ["Persamaan Lingkaran", "Irisan Kerucut (Parabola, Elips, Hiperbola)"] }
        ]
      },
      {
        name: "Fisika",
        topics: [
          { name: "Mekanika Klasik", subtopics: ["Kinematika (Gerak Parabola & Melingkar)", "Dinamika Partikel (Hukum Newton)", "Usaha, Energi & Daya", "Momentum & Impuls", "Dinamika Rotasi & Kesetimbangan Benda Tegar"] },
          { name: "Fluida & Termodinamika", subtopics: ["Fluida Statis & Dinamis", "Suhu, Kalor, & Perpindahan Kalor", "Teori Kinetik Gas", "Hukum Termodinamika"] },
          { name: "Gelombang & Optik", subtopics: ["Gelombang Mekanik & Berjalan", "Gelombang Bunyi & Efek Doppler", "Optik Fisis & Geometri"] },
          { name: "Listrik, Magnet & Fisika Modern", subtopics: ["Listrik Statis (Hukum Coulomb, Medan Listrik)", "Listrik Dinamis AC & DC", "Medan Magnet & Induksi Elektromagnetik", "Fisika Kuantum & Relativitas Khusus", "Inti Atom & Radioaktivitas"] }
        ]
      },
      {
        name: "Kimia",
        topics: [
          { name: "Struktur Atom & SPU", subtopics: ["Model Atom Bohr & Mekanika Kuantum", "Konfigurasi Elektron", "Sistem Periodik Unsur", "Ikatan Kimia (Ion, Kovalen, Logam)"] },
          { name: "Stoikiometri & Larutan", subtopics: ["Tata Nama Senyawa & Persamaan Reaksi", "Hukum Dasar Kimia & Konsep Mol", "Larutan Asam Basa & pH", "Larutan Penyangga (Buffer)", "Hidrolisis Garam", "Titrasi Asam Basa"] },
          { name: "Termokimia & Kinetika", subtopics: ["Entalpi & Hukum Hess", "Laju Reaksi", "Kesetimbangan Kimia"] },
          { name: "Redoks & Elektrokimia", subtopics: ["Reaksi Reduksi & Oksidasi", "Sel Volta & Hukum Faraday", "Korosi & Perlindungan Katodik"] },
          { name: "Kimia Organik & Makromolekul", subtopics: ["Senyawa Hidrokarbon (Alkana, Alkena, Alkuna)", "Turunan Alkana (Alkohol, Eter, Ester)", "Polimer, Karbohidrat & Protein"] }
        ]
      },
      {
        name: "Biologi",
        topics: [
          { name: "Keanekaragaman & Klasifikasi", subtopics: ["Keanekaragaman Hayati", "Virus & Monera", "Fungi & Protista", "Plantae & Animalia"] },
          { name: "Anatomi & Fisiologi", subtopics: ["Struktur & Fungsi Jaringan Tumbuhan", "Jaringan Hewan", "Sistem Peredaran Darah Manusia", "Sistem Saraf & Endokrin", "Sistem Reproduksi"] },
          { name: "Sel & Genetika", subtopics: ["Struktur & Organel Sel", "Metabolisme (Respirasi Sel & Fotosintesis)", "Substansi Genetika (DNA/RNA, Sintesis Protein)", "Pembelahan Sel (Mitosis/Meiosis)", "Pewarisan Sifat (Hukum Mendel & Penyimpangan)", "Mutasi"] },
          { name: "Evolusi & Bioteknologi", subtopics: ["Teori Evolusi Darwin", "Mekanisme Evolusi", "Bioteknologi Konvensional & Modern"] }
        ]
      },
      {
        name: "Ekonomi",
        topics: [
          { name: "Konsep Dasar & Mikroekonomi", subtopics: ["Masalah Ekonomi & Sistem Ekonomi", "Peran Pelaku Ekonomi", "Pasar (Persaingan Sempurna & Tidak Sempurna)", "Elastisitas Permintaan & Penawaran"] },
          { name: "Makroekonomi", subtopics: ["Pendapatan Nasional", "Ketenagakerjaan & Pengangguran", "Inflasi & Indeks Harga", "Kebijakan Moneter & Fiskal"] },
          { name: "Keuangan & Akuntansi", subtopics: ["Lembaga Jasa Keuangan (Bank & Non-Bank)", "APBN & APBD", "Perdagangan Internasional", "Siklus Akuntansi Perusahaan Jasa & Dagang"] }
        ]
      },
      {
        name: "Geografi",
        topics: [
          { name: "Pengetahuan Dasar", subtopics: ["Konsep & Pendekatan Geografi", "Pengetahuan Dasar Pemetaan", "Sistem Informasi Geografis (SIG) & Penginderaan Jauh"] },
          { name: "Bumi & Antariksa", subtopics: ["Dinamika Litosfer & Pedosfer", "Dinamika Atmosfer (Iklim & Cuaca)", "Dinamika Hidrosfer (Laut & Air Tanah)"] },
          { name: "Kependudukan & Lingkungan", subtopics: ["Antroposfer (Dinamika Penduduk)", "Biosfer (Persebaran Flora & Fauna)", "Pengelolaan Sumber Daya Alam", "Mitigasi Bencana Alam"] }
        ]
      },
      {
        name: "Sosiologi",
        topics: [
          { name: "Konsep Dasar Sosiologi", subtopics: ["Nilai & Norma Sosial", "Interaksi Sosial", "Sosialisasi & Pembentukan Kepribadian", "Perilaku Menyimpang & Pengendalian Sosial"] },
          { name: "Struktur & Dinamika Sosial", subtopics: ["Struktur Sosial & Diferensiasi Sosial", "Stratifikasi Sosial", "Mobilitas Sosial", "Konflik, Kekerasan, & Perdamaian", "Kelompok Sosial & Multikulturalisme"] },
          { name: "Perubahan Sosial & Penelitian", subtopics: ["Faktor Perubahan Sosial", "Dampak Perubahan Sosial & Globalisasi", "Metode Penelitian Sosial", "Pengumpulan & Analisis Data"] }
        ]
      },
      {
        name: "Sejarah",
        topics: [
          { name: "Masa Klasik", subtopics: ["Konsep Berpikir Sejarah", "Masa Praaksara", "Kerajaan Hindu-Buddha di Nusantara", "Perkembangan Islam di Nusantara"] },
          { name: "Penjajahan & Pergerakan Nasional", subtopics: ["Kolonialisme & Imperialisme Eropa", "Perlawanan Bangsa Indonesia", "Masa Pendudukan Jepang", "Pergerakan Nasional Indonesia"] },
          { name: "Kemerdekaan & Kontemporer", subtopics: ["Proklamasi Kemerdekaan", "Perjuangan Mempertahankan Kemerdekaan", "Demokrasi Liberal & Terpimpin", "Orde Baru & Reformasi", "Peristiwa Kontemporer Dunia"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Advanced Tenses", subtopics: ["Past Perfect & Future Perfect", "Conditional Sentences (Type 1, 2, 3)", "Subjunctive & Wish", "Direct & Indirect Speech"] },
          { name: "Text Types (Advanced)", subtopics: ["Analytical Exposition", "Hortatory Exposition", "Explanation Text", "Discussion Text", "Review Text"] },
          { name: "Reading Comprehension", subtopics: ["Main Idea & Specific Information", "Inference & Reference", "Synonym in Context", "TOEFL/IELTS Basic Reading Strategies"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Eksposisi & Argumentasi", subtopics: ["Teks Eksposisi", "Teks Argumentasi", "Teks Anekdot", "Teks Negosiasi"] },
          { name: "Teks Karya Ilmiah & Jurnalistik", subtopics: ["Karya Tulis Ilmiah", "Teks Editorial/Tajuk Rencana", "Artikel Opini"] },
          { name: "Karya Sastra Lanjut", subtopics: ["Hikayat & Cerita Rakyat", "Novel (Unsur Intrinsik & Ekstrinsik)", "Kritik Sastra & Esai"] }
        ]
      }
    ]
  }
];
