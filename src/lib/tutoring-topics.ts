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
          { name: "Bilangan Cacah & Pecahan", subtopics: ["Operasi Hitung", "FPB & KPK", "Pecahan Senilai"] },
          { name: "Geometri", subtopics: ["Keliling & Luas Bangun Datar", "Volume Bangun Ruang", "Sifat Bangun Datar"] },
          { name: "Pengukuran", subtopics: ["Satuan Waktu", "Satuan Berat", "Satuan Panjang & Jarak"] },
          { name: "Penyajian Data", subtopics: ["Membaca Diagram", "Rata-rata (Mean)", "Modus & Median"] }
        ]
      },
      {
        name: "IPA",
        topics: [
          { name: "Makhluk Hidup", subtopics: ["Ciri-ciri Makhluk Hidup", "Rantai Makanan", "Sistem Pencernaan"] },
          { name: "Benda & Sifatnya", subtopics: ["Perubahan Wujud Benda", "Sifat Bahan (Kaca, Kayu, dll)", "Suhu & Kalor"] },
          { name: "Energi & Gaya", subtopics: ["Gaya Gesek & Gravitasi", "Sumber Energi", "Listrik Sederhana"] },
          { name: "Bumi & Alam Semesta", subtopics: ["Tata Surya", "Gerhana Bulan & Matahari", "Daur Air"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Vocabulary", subtopics: ["Animals", "Fruits & Vegetables", "Professions", "Daily Activities"] },
          { name: "Grammar Basics", subtopics: ["Pronouns", "To Be (is, am, are)", "Simple Present Tense"] },
          { name: "Expressions", subtopics: ["Greetings", "Introducing Self", "Asking for Help"] }
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
          { name: "Aljabar", subtopics: ["Bentuk Aljabar", "PLSV & PtLSV", "Sistem Persamaan Linear Dua Variabel (SPLDV)"] },
          { name: "Aritmatika Sosial", subtopics: ["Keuntungan & Kerugian", "Bunga Tunggal & Pajak", "Bruto, Netto, Tara"] },
          { name: "Geometri", subtopics: ["Teorema Pythagoras", "Lingkaran", "Bangun Ruang Sisi Datar & Lengkung"] },
          { name: "Relasi & Fungsi", subtopics: ["Fungsi Linear", "Persamaan Garis Lurus", "Pola Bilangan"] }
        ]
      },
      {
        name: "IPA",
        topics: [
          { name: "Fisika", subtopics: ["Gerak Lurus (GLB & GLBB)", "Usaha & Pesawat Sederhana", "Listrik Statis & Dinamis", "Kemagnetan"] },
          { name: "Biologi", subtopics: ["Sistem Organisasi Kehidupan", "Sistem Pencernaan", "Sistem Ekskresi", "Pewarisan Sifat"] },
          { name: "Kimia", subtopics: ["Asam, Basa, & Garam", "Unsur, Senyawa, Campuran", "Zat Aditif & Adiktif"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Tenses", subtopics: ["Simple Present", "Present Continuous", "Simple Past", "Present Perfect"] },
          { name: "Text Types", subtopics: ["Descriptive Text", "Recount Text", "Narrative Text", "Procedure Text"] },
          { name: "Expressions", subtopics: ["Asking for Opinion", "Congratulating", "Expressing Agreement/Disagreement"] }
        ]
      }
    ]
  },
  {
    level: "SMA/K",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Kalkulus Dasar", subtopics: ["Limit Fungsi", "Turunan", "Integral Tak Tentu"] },
          { name: "Aljabar Lanjut", subtopics: ["Matriks", "Sistem Persamaan Tiga Variabel", "Fungsi Komposisi & Invers"] },
          { name: "Trigonometri", subtopics: ["Perbandingan Trigonometri", "Aturan Sinus & Cosinus", "Persamaan Trigonometri"] },
          { name: "Statistika & Peluang", subtopics: ["Ukuran Pemusatan Data", "Kaidah Pencacahan", "Peluang Kejadian Majemuk"] }
        ]
      },
      {
        name: "Fisika",
        topics: [
          { name: "Mekanika", subtopics: ["Gerak Parabola", "Hukum Newton", "Momentum & Impuls", "Dinamika Rotasi"] },
          { name: "Termodinamika", subtopics: ["Suhu & Kalor", "Teori Kinetik Gas", "Hukum Termodinamika"] },
          { name: "Gelombang & Optik", subtopics: ["Gelombang Berjalan", "Optik Fisis & Geometri", "Bunyi"] }
        ]
      },
      {
        name: "Biologi",
        topics: [
          { name: "Sel & Molekuler", subtopics: ["Struktur Sel", "Enzim & Metabolisme", "Sintesis Protein"] },
          { name: "Genetika", subtopics: ["Hukum Mendel", "Mutasi", "Bioteknologi"] },
          { name: "Fisiologi Manusia", subtopics: ["Sistem Koordinasi", "Sistem Reproduksi", "Sistem Imunitas"] }
        ]
      },
      {
        name: "Kimia",
        topics: [
          { name: "Kimia Fisik", subtopics: ["Termokimia", "Laju Reaksi", "Kesetimbangan Kimia"] },
          { name: "Larutan", subtopics: ["Asam Basa", "Sifat Koligatif Larutan", "Redoks & Elektrokimia"] },
          { name: "Kimia Organik", subtopics: ["Hidrokarbon", "Minyak Bumi", "Gugus Fungsi (Alkohol, Eter, dll)"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Advanced Tenses", subtopics: ["Past Perfect", "Future Perfect", "Conditional Sentences"] },
          { name: "Text Types", subtopics: ["Analytical Exposition", "Hortatory Exposition", "Discussion Text"] },
          { name: "Special Topics", subtopics: ["Passive Voice", "Reported Speech", "Application Letters & CV"] }
        ]
      }
    ]
  }
];
