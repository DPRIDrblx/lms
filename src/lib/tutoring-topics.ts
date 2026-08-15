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
  // ==========================================
  // JENJANG SD (Kelas 1 - 6)
  // ==========================================
  {
    level: "Kelas 1 SD",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Mengenal Bilangan 1-20", subtopics: ["Membilang banyak benda 1-10", "Membilang banyak benda 11-20", "Membaca dan menulis lambang bilangan", "Membandingkan dua bilangan", "Mengurutkan bilangan dari terkecil & terbesar"] },
          { name: "Penjumlahan & Pengurangan", subtopics: ["Penjumlahan bilangan 1-10", "Penjumlahan bilangan 11-20", "Pengurangan bilangan 1-10", "Pengurangan bilangan 11-20", "Soal cerita penjumlahan", "Soal cerita pengurangan"] },
          { name: "Mengenal Waktu & Panjang", subtopics: ["Mengenal nama-nama hari", "Mengenal nama-nama bulan", "Membaca jam analog (tepat)", "Mengukur panjang dengan satuan tidak baku (jengkal, langkah)"] },
          { name: "Bangun Datar & Ruang Sederhana", subtopics: ["Mengenal segitiga, segi empat, dan lingkaran", "Mengenal kubus, balok, tabung, bola", "Mengelompokkan bangun datar", "Mengelompokkan bangun ruang"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Membaca Permulaan", subtopics: ["Mengenal huruf abjad (A-Z)", "Mengeja suku kata (ba-bi-bu)", "Membaca kata sederhana (dua suku kata)", "Membaca kalimat pendek"] },
          { name: "Menulis Permulaan", subtopics: ["Menulis huruf tegak bersambung (dasar)", "Menyalin kata dari papan tulis", "Menulis nama sendiri dan teman", "Menulis kalimat sederhana dengan huruf kapital di awal"] },
          { name: "Bercerita & Mendengarkan", subtopics: ["Mendengarkan dongeng fabel (hewan)", "Menjawab pertanyaan dari cerita yang didengar", "Menceritakan pengalaman liburan", "Memperkenalkan diri sendiri"] }
        ]
      },
      {
        name: "Pendidikan Pancasila (PPKN)",
        topics: [
          { name: "Pancasila & Simbolnya", subtopics: ["Mengenal Burung Garuda", "Simbol Sila 1 sampai 5", "Menghafal teks Pancasila", "Contoh sikap Sila 1 (Berdoa sebelum belajar)"] },
          { name: "Aturan & Tata Tertib", subtopics: ["Aturan di rumah (tidur tepat waktu, merapikan mainan)", "Aturan di sekolah (seragam, masuk kelas)", "Akibat tidak mematuhi aturan"] },
          { name: "Kebersamaan dalam Keberagaman", subtopics: ["Keberagaman di keluarga (usia, jenis kelamin)", "Menghargai teman di sekolah", "Bermain bersama tanpa membeda-bedakan"] }
        ]
      },
      {
        name: "IPAS (Ilmu Pengetahuan Alam & Sosial)",
        topics: [
          { name: "Mengenal Anggota Tubuh", subtopics: ["Nama-nama panca indra", "Fungsi mata, hidung, telinga, lidah, kulit", "Cara merawat kebersihan tubuh", "Makanan sehat dan bergizi"] },
          { name: "Benda di Sekitarku", subtopics: ["Mengenal benda hidup (hewan, tumbuhan, manusia)", "Mengenal benda tak hidup (meja, buku, batu)", "Ciri-ciri benda (warna, bentuk, ukuran)"] },
          { name: "Lingkungan Sehat & Tidak Sehat", subtopics: ["Ciri rumah yang bersih", "Ciri rumah yang kotor", "Cara menjaga kebersihan lingkungan sekolah"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Keterampilan Komunikasi Dasar", subtopics: ["Pertemuan 1: Berani Berbicara di Depan Kelas", "Pertemuan 2: Mendengarkan Teman Bercerita"] },
          { name: "Bulan 2: Kreativitas Tanpa Batas", subtopics: ["Pertemuan 1: Mewarnai Imajinasi", "Pertemuan 2: Membuat Kerajinan dari Barang Bekas"] },
          { name: "Bulan 3: Kebiasaan Baik Sehari-hari", subtopics: ["Pertemuan 1: Menjaga Kebersihan Diri", "Pertemuan 2: Aturan di Rumah dan Sekolah"] },
          { name: "Bulan 4: Kerja Sama Tim", subtopics: ["Pertemuan 1: Bermain Bersama Tanpa Bertengkar", "Pertemuan 2: Gotong Royong Membersihkan Kelas"] },
          { name: "Bulan 5: Mengenal Emosi", subtopics: ["Pertemuan 1: Apa Itu Marah dan Sedih?", "Pertemuan 2: Cara Menenangkan Diri"] },
          { name: "Bulan 6: Problem Solving Sederhana", subtopics: ["Pertemuan 1: Mencari Solusi Saat Kehilangan Barang", "Pertemuan 2: Meminta Bantuan yang Tepat"] },
          { name: "Bulan 7: Etika dan Sopan Santun", subtopics: ["Pertemuan 1: Mengucapkan Tolong, Maaf, dan Terima Kasih", "Pertemuan 2: Menghormati Guru dan Orang Tua"] },
          { name: "Bulan 8: Mengenal Alam Sitar", subtopics: ["Pertemuan 1: Mengapa Harus Menjaga Tanaman?", "Pertemuan 2: Membuang Sampah pada Tempatnya"] },
          { name: "Bulan 9: Konsentrasi dan Fokus", subtopics: ["Pertemuan 1: Permainan Melatih Fokus Mata", "Pertemuan 2: Belajar Tanpa Mudah Teralihkan"] },
          { name: "Bulan 10: Pengenalan Hobi", subtopics: ["Pertemuan 1: Mengenal Berbagai Macam Hobi", "Pertemuan 2: Menceritakan Hobi Sendiri"] },
          { name: "Bulan 11: Kemandirian", subtopics: ["Pertemuan 1: Merapikan Alat Tulis Sendiri", "Pertemuan 2: Memakai Sepatu Sendiri"] },
          { name: "Bulan 12: Apresiasi Diri", subtopics: ["Pertemuan 1: Bangga Terhadap Diri Sendiri", "Pertemuan 2: Merayakan Keberhasilan Kecil"] }
        ]
      }
    ]
  },
  {
    level: "Kelas 2 SD",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Bilangan Cacah Sampai 500", subtopics: ["Membaca lambang bilangan 100-500", "Nilai tempat (ratusan, puluhan, satuan)", "Membandingkan bilangan tiga angka", "Mengurutkan bilangan ratusan"] },
          { name: "Penjumlahan & Pengurangan (Bersusun)", subtopics: ["Penjumlahan tanpa menyimpan", "Penjumlahan dengan menyimpan", "Pengurangan tanpa meminjam", "Pengurangan dengan meminjam", "Soal cerita campuran"] },
          { name: "Perkalian & Pembagian Dasar", subtopics: ["Konsep perkalian sebagai penjumlahan berulang (tabel 1-5)", "Konsep pembagian sebagai pengurangan berulang", "Hubungan perkalian dan pembagian"] },
          { name: "Pengukuran Panjang & Berat", subtopics: ["Alat ukur baku (penggaris, meteran)", "Satuan panjang (cm, m)", "Alat ukur berat (timbangan)", "Satuan berat (gram, kilogram)"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Permintaan Maaf & Tolong", subtopics: ["Menulis kalimat permintaan tolong yang sopan", "Menulis kalimat permintaan maaf", "Bermain peran (Roleplay) ungkapan maaf & tolong"] },
          { name: "Puisi & Pantun Anak", subtopics: ["Membaca puisi anak dengan lafal dan intonasi", "Menulis puisi sederhana tentang alam", "Mengenal ciri pantun anak-anak"] },
          { name: "Menulis Tegak Bersambung", subtopics: ["Menulis kalimat dengan huruf tegak bersambung", "Penggunaan huruf kapital pada nama orang", "Penggunaan huruf kapital pada awal kalimat dan nama hari"] }
        ]
      },
      {
        name: "Pendidikan Pancasila (PPKN)",
        topics: [
          { name: "Penerapan Sila Pancasila", subtopics: ["Penerapan Sila 1 dan 2 di rumah dan sekolah", "Penerapan Sila 3, 4, dan 5 saat bermain", "Bermusyawarah menentukan ketua kelas"] },
          { name: "Persatuan dalam Keberagaman", subtopics: ["Keberagaman agama di Indonesia", "Cara menghargai teman berbeda agama", "Kerja bakti membersihkan kelas"] }
        ]
      },
      {
        name: "IPAS",
        topics: [
          { name: "Hewan & Tumbuhan di Sekitarku", subtopics: ["Bagian-bagian tubuh hewan", "Bagian-bagian tumbuhan (akar, batang, daun)", "Hewan peliharaan dan cara merawatnya", "Hewan liar dan berbahaya"] },
          { name: "Wujud & Sifat Benda", subtopics: ["Ciri benda padat", "Ciri benda cair", "Ciri benda gas", "Perubahan wujud (es mencair)"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Percaya Diri", subtopics: ["Pertemuan 1: Tampil Membaca Puisi", "Pertemuan 2: Berani Menjawab Pertanyaan Guru"] },
          { name: "Bulan 2: Empati dan Kepedulian", subtopics: ["Pertemuan 1: Menolong Teman yang Jatuh", "Pertemuan 2: Berbagi Makanan"] },
          { name: "Bulan 3: Etika Digital Sederhana", subtopics: ["Pertemuan 1: Waktu yang Tepat Bermain Gadget", "Pertemuan 2: Menjaga Mata dari Layar"] },
          { name: "Bulan 4: Berpikir Kritis Dasar", subtopics: ["Pertemuan 1: Mengapa Langit Berwarna Biru?", "Pertemuan 2: Bertanya 'Mengapa' pada Hal Baru"] },
          { name: "Bulan 5: Mengelola Waktu", subtopics: ["Pertemuan 1: Kapan Waktu Bermain dan Belajar", "Pertemuan 2: Membuat Jadwal Harian Sederhana"] },
          { name: "Bulan 6: Menyelesaikan Konflik", subtopics: ["Pertemuan 1: Memaafkan Teman", "Pertemuan 2: Cara Meminta Maaf yang Benar"] },
          { name: "Bulan 7: Pengenalan Uang", subtopics: ["Pertemuan 1: Mengenal Nilai Uang", "Pertemuan 2: Belajar Menabung di Celengan"] },
          { name: "Bulan 8: Keterampilan Bercerita", subtopics: ["Pertemuan 1: Menyusun Cerita dari Gambar", "Pertemuan 2: Menceritakan Dongeng Kesukaan"] },
          { name: "Bulan 9: Kerja Kelompok", subtopics: ["Pertemuan 1: Membagi Tugas dengan Adil", "Pertemuan 2: Menerima Pendapat Teman"] },
          { name: "Bulan 10: Kebiasaan Sehat", subtopics: ["Pertemuan 1: Pentingnya Cuci Tangan", "Pertemuan 2: Makan Sayur dan Buah"] },
          { name: "Bulan 11: Keamanan Diri", subtopics: ["Pertemuan 1: Mengenal Bagian Tubuh yang Tidak Boleh Disentuh Orang Lain", "Pertemuan 2: Menghindari Orang Tidak Dikenal"] },
          { name: "Bulan 12: Resolusi Sederhana", subtopics: ["Pertemuan 1: Apa yang Ingin Dicapai Tahun Depan?", "Pertemuan 2: Menggambar Cita-cita"] }
        ]
      }
    ]
  },
  {
    level: "Kelas 3 SD",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Bilangan Sampai 1.000", subtopics: ["Operasi hitung bilangan ribuan", "Garis bilangan", "Penaksiran ratusan terdekat", "Perkalian tabel 6-10", "Pembagian bersusun (Porogapit dasar)"] },
          { name: "Pecahan Sederhana", subtopics: ["Mengenal pecahan 1/2, 1/3, 1/4", "Pecahan senilai dengan gambar", "Membandingkan pecahan sederhana"] },
          { name: "Uang", subtopics: ["Mengenal nilai mata uang Rupiah", "Kesetaraan nilai pecahan uang", "Soal cerita jual beli sederhana"] },
          { name: "Bangun Datar", subtopics: ["Sifat persegi, persegi panjang, segitiga", "Menghitung keliling bangun datar dengan kotak satuan", "Simetri lipat pada bangun datar", "Simetri putar"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Informasi Teks & Paragraf", subtopics: ["Menemukan gagasan pokok", "Menceritakan kembali isi dongeng", "Menulis cerita berdasarkan gambar seri"] },
          { name: "Kosakata Baru & Kamus", subtopics: ["Mencari arti kata dalam kamus", "Menemukan sinonim dan antonim", "Penggunaan tanda baca koma (,) dan titik (.)"] },
          { name: "Wawancara Sederhana", subtopics: ["Membuat daftar pertanyaan wawancara (Adiksimba)", "Melakukan wawancara dengan teman/guru", "Menulis laporan hasil wawancara singkat"] }
        ]
      },
      {
        name: "Pendidikan Pancasila (PPKN)",
        topics: [
          { name: "Sumpah Pemuda", subtopics: ["Sejarah singkat Sumpah Pemuda", "Makna Satu Nusa, Satu Bangsa, Satu Bahasa", "Menerapkan semangat Sumpah Pemuda di sekolah"] },
          { name: "Hak & Kewajiban di Rumah", subtopics: ["Kewajiban anak membantu orang tua", "Hak anak mendapatkan kasih sayang", "Hak & kewajiban terkait makanan dan pakaian"] },
          { name: "Hak & Kewajiban di Sekolah", subtopics: ["Kewajiban menjaga fasilitas sekolah", "Kewajiban mengerjakan piket", "Hak mendapat pelajaran dari guru"] }
        ]
      },
      {
        name: "IPAS",
        topics: [
          { name: "Cuaca & Iklim", subtopics: ["Jenis-jenis cuaca (Cerah, Berawan, Mendung, Hujan)", "Pengaruh cuaca terhadap kegiatan manusia", "Pakaian & makanan yang cocok untuk berbagai cuaca"] },
          { name: "Energi & Perubahannya", subtopics: ["Sumber energi terbesar (Matahari)", "Energi angin dan air", "Perubahan energi listrik menjadi panas/cahaya/gerak", "Cara menghemat energi listrik"] },
          { name: "Perkembangbiakan Makhluk Hidup", subtopics: ["Daur hidup kupu-kupu & katak", "Pertumbuhan ayam & kucing", "Cara tumbuhan berkembang biak (Biji, Tunas)"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Publik Speaking Pemula", subtopics: ["Pertemuan 1: Memperkenalkan Teman Sebangku", "Pertemuan 2: Menceritakan Pengalaman Liburan dengan Detail"] },
          { name: "Bulan 2: Literasi Digital", subtopics: ["Pertemuan 1: Menonton YouTube yang Bermanfaat", "Pertemuan 2: Bahaya Menyebarkan Informasi Palsu (Hoax Sederhana)"] },
          { name: "Bulan 3: Berpikir Kreatif", subtopics: ["Pertemuan 1: Mencari Kegunaan Lain dari Benda Sehari-hari", "Pertemuan 2: Membuat Cerita dari 3 Kata Acak"] },
          { name: "Bulan 4: Tanggung Jawab", subtopics: ["Pertemuan 1: Mengerjakan PR Tepat Waktu", "Pertemuan 2: Menjaga Barang Pinjaman"] },
          { name: "Bulan 5: Literasi Finansial Dasar", subtopics: ["Pertemuan 1: Bedanya Kebutuhan dan Keinginan", "Pertemuan 2: Simulasi Jajan Cerdas"] },
          { name: "Bulan 6: Pemecahan Masalah", subtopics: ["Pertemuan 1: Jika Tertinggal di Tempat Umum", "Pertemuan 2: Mengatasi Rasa Bosan Tanpa Gadget"] },
          { name: "Bulan 7: Kesadaran Lingkungan", subtopics: ["Pertemuan 1: Memisahkan Sampah Plastik dan Kertas", "Pertemuan 2: Berhemat Air dan Listrik"] },
          { name: "Bulan 8: Pemahaman Emosi Lanjutan", subtopics: ["Pertemuan 1: Mengekspresikan Kekecewaan Tanpa Menyakiti", "Pertemuan 2: Mengenali Emosi Orang Lain"] },
          { name: "Bulan 9: Kepemimpinan Diri", subtopics: ["Pertemuan 1: Menjadi Ketua Kelas Sehari", "Pertemuan 2: Memimpin Doa atau Barisan"] },
          { name: "Bulan 10: Kerja Sama Lanjutan", subtopics: ["Pertemuan 1: Membuat Proyek Seni Bersama", "Pertemuan 2: Membantu Teman yang Kesulitan Belajar"] },
          { name: "Bulan 11: Kemampuan Mengingat", subtopics: ["Pertemuan 1: Trik Mengingat Nama dan Benda", "Pertemuan 2: Permainan Memori Visual"] },
          { name: "Bulan 12: Evaluasi Diri", subtopics: ["Pertemuan 1: Apa Sifat Baikku?", "Pertemuan 2: Apa Sifat yang Harus Aku Perbaiki?"] }
        ]
      }
    ]
  },
  {
    level: "Kelas 4 SD",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Pecahan Lanjut", subtopics: ["Pecahan biasa, campuran, desimal, dan persen", "Mengubah bentuk pecahan (biasa ke desimal, dsb)", "Penjumlahan & Pengurangan pecahan penyebut sama", "Penaksiran hasil hitung pecahan"] },
          { name: "KPK & FPB", subtopics: ["Faktor & Kelipatan suatu bilangan", "Bilangan Prima & Faktor Prima", "Pohon Faktor", "Mencari FPB (Faktor Persekutuan Terbesar)", "Mencari KPK (Kelipatan Persekutuan Terkecil)", "Soal cerita KPK dan FPB"] },
          { name: "Pengukuran Sudut & Panjang", subtopics: ["Mengenal sudut (lancip, siku-siku, tumpul)", "Mengukur sudut dengan busur derajat", "Pembulatan hasil pengukuran panjang dan berat"] },
          { name: "Keliling & Luas Bangun Datar", subtopics: ["Rumus Luas Persegi & Persegi Panjang", "Rumus Keliling Persegi & Persegi Panjang", "Luas & Keliling Segitiga", "Penyelesaian masalah bangun datar"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Petunjuk (Prosedur)", subtopics: ["Ciri-ciri teks petunjuk (kalimat perintah)", "Membuat poster hemat energi", "Menulis teks petunjuk penggunaan alat"] },
          { name: "Gagasan Pokok & Pendukung", subtopics: ["Menentukan kalimat utama dalam paragraf", "Menemukan gagasan pendukung", "Merangkum bacaan"] },
          { name: "Puisi Lama & Baru", subtopics: ["Menulis puisi tentang cita-cita", "Makna kiasan dalam puisi", "Mendeklamasikan puisi dengan ekspresi"] }
        ]
      },
      {
        name: "Pendidikan Pancasila (PPKN)",
        topics: [
          { name: "Pemerintahan Desa & Kecamatan", subtopics: ["Struktur perangkat desa (Kepala Desa, Sekdes, dll)", "Struktur pemerintahan kelurahan", "Struktur pemerintahan kecamatan"] },
          { name: "Keragaman Sosial & Budaya", subtopics: ["Suku-suku di Indonesia (Batak, Minang, Jawa, Asmat)", "Rumah Adat dan Pakaian Tradisional", "Tarian Daerah", "Sikap toleransi antar suku bangsa"] }
        ]
      },
      {
        name: "IPAS (Fokus IPA)",
        topics: [
          { name: "Gaya & Gerak", subtopics: ["Gaya otot, gaya gesek, dan gaya gravitasi", "Pengaruh gaya terhadap gerak benda", "Pengaruh gaya terhadap bentuk benda", "Gaya magnet (kutub utara & selatan)"] },
          { name: "Bunyi & Cahaya", subtopics: ["Syarat terjadinya bunyi", "Sifat-sifat bunyi (merambat, memantul, menyerap)", "Sifat-sifat cahaya (merambat lurus, menembus benda bening, dipantulkan, dibiaskan)", "Alat optik sederhana (Lup, Periskop)"] }
        ]
      },
      {
        name: "IPAS (Fokus IPS)",
        topics: [
          { name: "Sumber Daya Alam", subtopics: ["SDA yang dapat diperbarui (Tumbuhan, Hewan, Air, Angin)", "SDA yang tidak dapat diperbarui (Batu bara, Minyak bumi, Emas)", "Pemanfaatan SDA untuk ekonomi", "Dampak eksploitasi SDA berlebihan"] },
          { name: "Kerajaan Hindu-Buddha & Islam", subtopics: ["Peninggalan kerajaan Tarumanegara & Kutai", "Peninggalan kerajaan Sriwijaya & Majapahit", "Kerajaan Samudera Pasai & Demak", "Tokoh-tokoh pahlawan masa kerajaan"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Keterampilan Presentasi", subtopics: ["Pertemuan 1: Postur Tubuh Saat Presentasi", "Pertemuan 2: Menggunakan Alat Peraga Sederhana"] },
          { name: "Bulan 2: Logika dan Komputasi Dasar", subtopics: ["Pertemuan 1: Bermain Game Instruksi (Algoritma Tanpa Komputer)", "Pertemuan 2: Memecahkan Teka-Teki Logika"] },
          { name: "Bulan 3: Literasi Membaca", subtopics: ["Pertemuan 1: Membaca Cepat dan Menemukan Ide Pokok", "Pertemuan 2: Merangkum Isi Buku Cerita"] },
          { name: "Bulan 4: Keterampilan Menulis Cermat", subtopics: ["Pertemuan 1: Menulis Jurnal Harian", "Pertemuan 2: Membuat Surat untuk Teman/Keluarga"] },
          { name: "Bulan 5: Etika di Internet Sederhana", subtopics: ["Pertemuan 1: Kata-kata Baik di Media Sosial", "Pertemuan 2: Melindungi Password Diri Sendiri"] },
          { name: "Bulan 6: Manajemen Waktu Belajar", subtopics: ["Pertemuan 1: Membuat Jadwal Belajar Mingguan", "Pertemuan 2: Mengatur Alarm Belajar (Teknik Pomodoro Anak)"] },
          { name: "Bulan 7: Sikap Pantang Menyerah (Resilience)", subtopics: ["Pertemuan 1: Apa yang Harus Dilakukan Saat Gagal Ujian?", "Pertemuan 2: Cerita Tokoh Sukses yang Pernah Gagal"] },
          { name: "Bulan 8: Kemandirian Mengurus Diri", subtopics: ["Pertemuan 1: Menyiapkan Buku Pelajaran Sendiri", "Pertemuan 2: Membantu Pekerjaan Rumah Sederhana"] },
          { name: "Bulan 9: Mengenal Keragaman Budaya", subtopics: ["Pertemuan 1: Makanan dan Pakaian Tradisional", "Pertemuan 2: Belajar Toleransi Antar Suku/Agama"] },
          { name: "Bulan 10: Dasar Kewirausahaan", subtopics: ["Pertemuan 1: Ide Barang Bekas yang Bisa Dijual", "Pertemuan 2: Simulasi Jual Beli di Kelas"] },
          { name: "Bulan 11: Kesehatan Mental Anak", subtopics: ["Pertemuan 1: Mengapa Kita Merasa Cemas Sebelum Ujian?", "Pertemuan 2: Cara Mengurangi Rasa Gugup"] },
          { name: "Bulan 12: Refleksi Pencapaian", subtopics: ["Pertemuan 1: Menulis Surat untuk Diri Sendiri di Masa Depan", "Pertemuan 2: Membuat Papan Visi (Vision Board)"] }
        ]
      }
    ]
  },
  {
    level: "Kelas 5 SD",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Operasi Hitung Pecahan", subtopics: ["Penjumlahan pecahan beda penyebut", "Pengurangan pecahan beda penyebut", "Perkalian pecahan biasa dan campuran", "Pembagian pecahan", "Penjumlahan & pengurangan desimal"] },
          { name: "Jarak, Kecepatan, Debit", subtopics: ["Rumus Jarak = Kecepatan x Waktu", "Rumus Debit = Volume / Waktu", "Konversi satuan waktu (Jam, Menit, Detik)", "Konversi satuan volume (Liter, cc, cm3)"] },
          { name: "Skala & Denah", subtopics: ["Membaca mata angin pada denah", "Menentukan titik koordinat sederhana", "Rumus Skala = Jarak Peta / Jarak Sebenarnya", "Mencari Jarak Sebenarnya"] },
          { name: "Volume Bangun Ruang", subtopics: ["Jaring-jaring kubus dan balok", "Menghitung Volume Kubus (s x s x s)", "Menghitung Volume Balok (p x l x t)", "Akar pangkat tiga (Mencari sisi kubus jika volume diketahui)"] },
          { name: "Pengumpulan & Penyajian Data", subtopics: ["Membuat tabel frekuensi", "Membaca Piktogram (Diagram Gambar)", "Membuat & membaca Diagram Batang", "Membaca Diagram Garis"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Narasi Sejarah", subtopics: ["Menentukan aspek 5W+1H dari teks sejarah", "Menggali informasi penting dari teks penjajahan", "Kata baku dan tidak baku"] },
          { name: "Iklan & Pantun", subtopics: ["Ciri-ciri bahasa iklan media cetak", "Iklan layanan masyarakat", "Ciri-ciri pantun (Sajak a-b-a-b, Sampiran, Isi)", "Membalas pantun"] },
          { name: "Surat Undangan", subtopics: ["Bagian-bagian surat resmi (Kop, Nomor, Lampiran)", "Surat undangan setengah resmi", "Surat undangan tidak resmi (Ulang tahun)"] }
        ]
      },
      {
        name: "Pendidikan Pancasila (PPKN)",
        topics: [
          { name: "Nilai-nilai Pancasila", subtopics: ["Nilai Ketuhanan & Kemanusiaan dalam kehidupan", "Nilai Persatuan, Kerakyatan, Keadilan", "Gotong royong di masyarakat", "Sikap tanggung jawab sebagai warga masyarakat"] },
          { name: "Keutuhan NKRI", subtopics: ["Pengertian NKRI", "Batas wilayah Indonesia", "Ancaman terhadap persatuan bangsa", "Cara menjaga keutuhan NKRI"] }
        ]
      },
      {
        name: "IPAS (Fokus IPA)",
        topics: [
          { name: "Sistem Organ Manusia & Hewan", subtopics: ["Alat gerak hewan vertebrata & avertebrata", "Sistem pernapasan manusia (Hidung, Tenggorokan, Paru-paru)", "Sistem pencernaan manusia (Mulut, Kerongkongan, Lambung, Usus)", "Sistem peredaran darah manusia (Jantung & Pembuluh darah)"] },
          { name: "Ekosistem & Jaring Makanan", subtopics: ["Rantai makanan (Produsen, Konsumen, Pengurai)", "Jaring-jaring makanan", "Simbiosis Mutualisme, Komensalisme, Parasitisme"] },
          { name: "Suhu, Kalor, & Air", subtopics: ["Perpindahan kalor: Konduksi, Konveksi, Radiasi", "Siklus air (Evaporasi, Kondensasi, Presipitasi)", "Faktor yang mempengaruhi kualitas air bersih"] }
        ]
      },
      {
        name: "IPAS (Fokus IPS)",
        topics: [
          { name: "Geografi Indonesia", subtopics: ["Letak geografis & astronomis Indonesia", "Kondisi geografis pulau-pulau besar (Sumatra, Jawa, Kalimantan, dll)", "Dampak letak geografis (Iklim & Flora Fauna)"] },
          { name: "Sejarah Penjajahan & Proklamasi", subtopics: ["Masa penjajahan Belanda & VOC", "Masa penjajahan Jepang (Romusha)", "Persiapan kemerdekaan (BPUPKI & PPKI)", "Peristiwa Rengasdengklok & Detik-detik Proklamasi"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Public Speaking & Storytelling", subtopics: ["Pertemuan 1: Mengatur Intonasi Suara", "Pertemuan 2: Bercerita dengan Gaya Menarik"] },
          { name: "Bulan 2: Pemahaman Berita (Anti-Hoax)", subtopics: ["Pertemuan 1: Cara Membedakan Fakta dan Opini", "Pertemuan 2: Mengecek Kebenaran Berita yang Viral"] },
          { name: "Bulan 3: Kolaborasi Digital", subtopics: ["Pertemuan 1: Menggunakan Google Docs Bersama", "Pertemuan 2: Etika Mengirim Email/Pesan ke Guru"] },
          { name: "Bulan 4: Kreativitas dalam Seni", subtopics: ["Pertemuan 1: Menggambar Mind Map (Peta Konsep)", "Pertemuan 2: Desain Poster Sederhana (Manual)"] },
          { name: "Bulan 5: Kepemimpinan Kelompok", subtopics: ["Pertemuan 1: Mengatur Diskusi Kelompok", "Pertemuan 2: Menyatukan Pendapat yang Berbeda"] },
          { name: "Bulan 6: Financial Literacy (Menabung)", subtopics: ["Pertemuan 1: Menyisihkan Uang Jajan Secara Konsisten", "Pertemuan 2: Membuat Catatan Pengeluaran Sederhana"] },
          { name: "Bulan 7: Empati Sosial", subtopics: ["Pertemuan 1: Memahami Sudut Pandang Teman yang Dibully", "Pertemuan 2: Menjadi Pembela (Upstander) Melawan Bullying"] },
          { name: "Bulan 8: Pemahaman Diri (Self-Awareness)", subtopics: ["Pertemuan 1: Mengetahui Kekuatan dan Kelemahan Diri", "Pertemuan 2: Gaya Belajar: Visual, Auditori, atau Kinestetik?"] },
          { name: "Bulan 9: Basic Coding Mindset", subtopics: ["Pertemuan 1: Pengenalan Algoritma dalam Resep Masakan", "Pertemuan 2: Mencoba Game Logika (Code.org)"] },
          { name: "Bulan 10: Berpikir Kritis Terhadap Iklan", subtopics: ["Pertemuan 1: Mengapa Iklan Dibuat Menarik?", "Pertemuan 2: Menghindari Pola Konsumtif Akibat Iklan"] },
          { name: "Bulan 11: Kemandirian Transportasi", subtopics: ["Pertemuan 1: Aturan Keselamatan di Jalan Raya", "Pertemuan 2: Mengenal Rambu Lalu Lintas Utama"] },
          { name: "Bulan 12: Menghadapi Transisi Kelas", subtopics: ["Pertemuan 1: Persiapan Menjadi Kakak Kelas (Kelas 6)", "Pertemuan 2: Menyusun Target Nilai"] }
        ]
      }
    ]
  },
  {
    level: "Kelas 6 SD",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Bilangan Bulat Negatif", subtopics: ["Mengenal bilangan bulat negatif pada garis bilangan", "Penjumlahan & Pengurangan bilangan bulat positif & negatif", "Perkalian & Pembagian bilangan bulat negatif", "Operasi hitung campuran bilangan bulat"] },
          { name: "Operasi Hitung Campuran (Lanjut)", subtopics: ["Urutan pengerjaan operasi campuran (KUKABATAKU)", "Campuran bilangan cacah, pecahan, & desimal", "Menyelesaikan soal cerita OSN dasar"] },
          { name: "Lingkaran", subtopics: ["Unsur-unsur lingkaran (Pusat, Jari-jari, Diameter, Busur, Tali busur, Tembereng, Juring)", "Rumus Keliling Lingkaran (2πr atau πd)", "Rumus Luas Lingkaran (πr²)", "Luas & Keliling gabungan bangun datar (setengah lingkaran + persegi panjang)"] },
          { name: "Bangun Ruang (Prisma, Limas, Kerucut, Bola)", subtopics: ["Sifat-sifat Prisma & Limas", "Volume Prisma Segitiga & Limas Segiempat", "Volume Tabung & Kerucut", "Volume Bola", "Luas Permukaan Bangun Ruang (Dasar)"] },
          { name: "Statistika Dasar", subtopics: ["Menentukan Mean (Rata-rata)", "Menentukan Median (Nilai Tengah)", "Menentukan Modus (Nilai yang paling sering muncul)", "Membaca diagram lingkaran dalam Persen & Derajat"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Laporan Hasil Pengamatan", subtopics: ["Struktur teks LHO (Pernyataan umum, Deskripsi bagian)", "Menyimpulkan isi laporan", "Kata baku, sinonim, antonim dalam laporan"] },
          { name: "Teks Eksplanasi & Pidato", subtopics: ["Menggali informasi penting dari teks eksplanasi ilmiah", "Menentukan unsur teks pidato (Pembuka, Isi, Penutup)", "Menulis teks pidato persuasif (ajakan)"] },
          { name: "Teks Fiksi & Formulir", subtopics: ["Unsur intrinsik cerita (Tokoh, Latar, Watak, Amanat)", "Mengisi formulir pendaftaran, wesel pos, daftar riwayat hidup", "Membuat ringkasan cerita"] }
        ]
      },
      {
        name: "Pendidikan Pancasila (PPKN)",
        topics: [
          { name: "Penerapan Pancasila dalam Kehidupan", subtopics: ["Sikap yang sesuai dengan Sila ke-1 sampai ke-5", "Studi kasus penerapan Pancasila di lingkungan sekolah & masyarakat", "Pancasila sebagai dasar negara"] },
          { name: "Kerja Sama ASEAN", subtopics: ["Sejarah berdirinya ASEAN & Tokoh Pendiri", "Peran Indonesia di ASEAN dalam bidang Ekonomi", "Peran Indonesia di ASEAN dalam bidang Politik & Sosial Budaya"] }
        ]
      },
      {
        name: "IPAS (Fokus IPA)",
        topics: [
          { name: "Perkembangbiakan Mahluk Hidup", subtopics: ["Perkembangbiakan Tumbuhan Generatif (Bunga)", "Perkembangbiakan Tumbuhan Vegetatif Alami (Tunas, Umbi, Rizoma)", "Perkembangbiakan Tumbuhan Vegetatif Buatan (Cangkok, Stek)", "Perkembangbiakan Hewan (Ovipar, Vivipar, Ovovivipar)"] },
          { name: "Adaptasi Mahluk Hidup", subtopics: ["Ciri khusus hewan & fungsinya (Kelelawar, Cicak, Unta, dll)", "Ciri khusus tumbuhan (Kaktus, Teratai, Kantong Semar)"] },
          { name: "Listrik & Magnet", subtopics: ["Komponen listrik sederhana", "Rangkaian Seri & Rangkaian Paralel", "Cara membuat magnet (Gosok, Induksi, Elektromagnet)", "Sifat-sifat magnet"] },
          { name: "Tata Surya", subtopics: ["Urutan planet dalam Tata Surya", "Karakteristik setiap planet", "Rotasi Bumi & Akibatnya (Siang & Malam, Perbedaan Waktu)", "Revolusi Bumi & Akibatnya (Pergantian Musim)", "Gerhana Matahari & Gerhana Bulan"] }
        ]
      },
      {
        name: "IPAS (Fokus IPS)",
        topics: [
          { name: "Negara-negara ASEAN", subtopics: ["Letak geografis & batas wilayah ASEAN", "Ibukota & Mata uang negara ASEAN", "Keadaan alam, ekonomi, & budaya negara ASEAN"] },
          { name: "Peran Indonesia Era Globalisasi", subtopics: ["Dampak positif & negatif globalisasi", "Barang ekspor & impor Indonesia", "Kerja sama internasional Indonesia (PBB, GNB)"] },
          { name: "Perjuangan Mempertahankan Kemerdekaan", subtopics: ["Pertempuran 10 November di Surabaya", "Bandung Lautan Api & Ambarawa", "Perjanjian Linggajati, Renville, Roem-Royen", "Konferensi Meja Bundar (KMB)"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Persiapan Mental Ujian Akhir", subtopics: ["Pertemuan 1: Mengelola Stres Ujian", "Pertemuan 2: Teknik Relaksasi Pernapasan"] },
          { name: "Bulan 2: Teknik Belajar Efektif (Study Skills)", subtopics: ["Pertemuan 1: Cara Membuat Ringkasan yang Baik", "Pertemuan 2: Teknik Pomodoro untuk Fokus"] },
          { name: "Bulan 3: Keterampilan Debat Pemula", subtopics: ["Pertemuan 1: Menyampaikan Pendapat dengan Alasan Logis", "Pertemuan 2: Menghargai Argumen Lawan Bicara"] },
          { name: "Bulan 4: Pembuatan Keputusan (Decision Making)", subtopics: ["Pertemuan 1: Menimbang Pro dan Kontra", "Pertemuan 2: Memilih Sekolah Lanjutan (SMP)"] },
          { name: "Bulan 5: Kewarganegaraan Global", subtopics: ["Pertemuan 1: Isu Pemanasan Global Sederhana", "Pertemuan 2: Apa yang Bisa Kita Lakukan untuk Bumi?"] },
          { name: "Bulan 6: Literasi Data Sederhana", subtopics: ["Pertemuan 1: Membaca Grafik dan Tabel", "Pertemuan 2: Membuat Survei Sederhana di Kelas"] },
          { name: "Bulan 7: Manajemen Konflik Lanjutan", subtopics: ["Pertemuan 1: Mediasi Perkelahian Teman", "Pertemuan 2: Mengendalikan Amarah Saat Diprovokasi"] },
          { name: "Bulan 8: Dasar Desain Grafis Digital", subtopics: ["Pertemuan 1: Pengenalan Aplikasi Canva", "Pertemuan 2: Membuat Presentasi Menarik"] },
          { name: "Bulan 9: Etika Media Sosial", subtopics: ["Pertemuan 1: Jejak Digital Tidak Bisa Dihapus", "Pertemuan 2: Bahaya Oversharing Data Pribadi"] },
          { name: "Bulan 10: Pengenalan Bakat", subtopics: ["Pertemuan 1: Menemukan Bakat Tersembunyi", "Pertemuan 2: Cara Mengembangkan Bakat"] },
          { name: "Bulan 11: Financial Literacy (Target Menabung)", subtopics: ["Pertemuan 1: Menabung untuk Membeli Barang Impian", "Pertemuan 2: Menghindari Hutang / Pinjam Uang Teman"] },
          { name: "Bulan 12: Farewell & Future Outlook", subtopics: ["Pertemuan 1: Mengenang Masa SD dengan Positif", "Pertemuan 2: Persiapan Menghadapi Dunia SMP"] }
        ]
      }
    ]
  },

  // ==========================================
  // JENJANG SMP (Kelas 7 - 9)
  // ==========================================
  {
    level: "Kelas 7 SMP",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Bilangan Bulat & Pecahan", subtopics: ["Operasi bilangan bulat (Kabataku)", "Sifat komutatif, asosiatif, distributif", "Operasi pecahan biasa, desimal, dan persen", "Menyelesaikan masalah HOTS bilangan"] },
          { name: "Himpunan", subtopics: ["Konsep Himpunan, anggota, dan notasi", "Himpunan semesta dan himpunan kosong", "Diagram Venn", "Irisan, Gabungan, Komplemen, dan Selisih Himpunan", "Soal cerita himpunan (survei)"] },
          { name: "Bentuk Aljabar", subtopics: ["Mengenal variabel, koefisien, konstanta, suku", "Penjumlahan & Pengurangan Aljabar", "Perkalian & Pembagian Aljabar", "Menyederhanakan pecahan aljabar"] },
          { name: "Persamaan & Pertidaksamaan Linear 1 Variabel", subtopics: ["Konsep Persamaan Linear Satu Variabel (PLSV)", "Penyelesaian PLSV", "Konsep Pertidaksamaan Linear Satu Variabel (PtLSV)", "Penyelesaian dan grafik PtLSV", "Model matematika soal cerita"] },
          { name: "Perbandingan & Skala", subtopics: ["Perbandingan senilai", "Perbandingan berbalik nilai", "Penerapan skala peta dan foto"] },
          { name: "Aritmatika Sosial", subtopics: ["Harga Beli, Harga Jual, Untung, Rugi", "Persentase Keuntungan dan Kerugian", "Diskon (Rabat), Pajak UMKM/PPN", "Bunga Tunggal Bank", "Bruto, Netto, Tara"] },
          { name: "Garis & Sudut", subtopics: ["Hubungan titik, garis, bidang", "Sudut berpelurus, berpenyiku, bertolak belakang", "Hubungan sudut pada dua garis sejajar dipotong garis lain (sehadap, berseberangan, sepihak)"] },
          { name: "Segiempat & Segitiga", subtopics: ["Sifat, Keliling, Luas Persegi & Persegi Panjang", "Jajargenjang, Belah Ketupat, Layang-layang, Trapesium", "Garis istimewa pada segitiga (tinggi, bagi, berat)"] }
        ]
      },
      {
        name: "IPA Terpadu",
        topics: [
          { name: "Besaran & Pengukuran (Fisika)", subtopics: ["Besaran pokok dan turunan (SI)", "Mengukur dengan Jangka Sorong & Mikrometer Sekrup", "Angka penting dan notasi ilmiah"] },
          { name: "Zat & Wujudnya (Fisika)", subtopics: ["Sifat partikel zat padat, cair, gas", "Kohesi, Adhesi, Kapilaritas", "Massa jenis dan terapung/tenggelam"] },
          { name: "Suhu, Kalor, Pemuaian (Fisika)", subtopics: ["Termometer (Celcius, Reamur, Fahrenheit, Kelvin)", "Asas Black (Campuran Kalor)", "Pemuaian panjang, luas, volume"] },
          { name: "Organisasi Kehidupan (Biologi)", subtopics: ["Sel hewan dan sel tumbuhan", "Jaringan pada tumbuhan (Xilem, Floem, Meristem)", "Jaringan pada hewan (Epitel, Otot, Saraf, Ikat)", "Organ, Sistem Organ, Organisme"] },
          { name: "Klasifikasi Makhluk Hidup (Biologi)", subtopics: ["Ciri-ciri makhluk hidup vs tak hidup", "Kunci determinasi & Taksonomi", "Sistem 5 Kingdom (Monera, Protista, Fungi, Plantae, Animalia)", "Mikroskop (Bagian dan Cara Pakai)"] },
          { name: "Interaksi Ekosistem (Biologi)", subtopics: ["Komponen Biotik & Abiotik", "Simbiosis, Predasi, Antibiosis", "Rantai & Jaring makanan tingkat lanjut", "Pencemaran lingkungan & Pemanasan Global"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Greetings & Introductions", subtopics: ["Formal & Informal Greetings", "Leave taking", "Introducing oneself & others", "Pronouns (Subject, Object, Possessive)"] },
          { name: "Things & Places Around Us", subtopics: ["Prepositions of place (in, on, under, behind, next to)", "There is / There are", "Articles (a, an, the)", "Describing rooms and public places"] },
          { name: "Descriptive Text", subtopics: ["Adjectives (Physical appearance, personality)", "Simple Present Tense (Verbs, To Be)", "Describing people, animals, things", "WH-Questions"] },
          { name: "Daily Routines", subtopics: ["Telling time (past, to, half, quarter)", "Days & Months", "Adverbs of frequency (always, usually, sometimes, never)"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Deskripsi", subtopics: ["Struktur teks deskripsi (Identifikasi, Deskripsi Bagian)", "Penggunaan kalimat panca indra", "Kata depan di- dan awalan di-"] },
          { name: "Teks Narasi (Cerita Fantasi)", subtopics: ["Ciri teks cerita fantasi", "Struktur narasi (Orientasi, Komplikasi, Resolusi)", "Penggunaan konjungsi urutan waktu"] },
          { name: "Teks Prosedur", subtopics: ["Struktur teks prosedur", "Kalimat imperatif (perintah), deklaratif, interogatif", "Kata keterangan alat, tujuan, dan cara"] },
          { name: "Teks Laporan Hasil Observasi", subtopics: ["Struktur (Pernyataan Umum, Deskripsi Bagian, Simpulan)", "Kalimat definisi vs kalimat klasifikasi", "Penggunaan istilah teknis"] },
          { name: "Buku Fiksi & Nonfiksi", subtopics: ["Perbedaan fiksi & nonfiksi", "Unsur buku fiksi", "Unsur buku nonfiksi", "Membuat ringkasan buku"] }
        ]
      },
      {
        name: "IPS Terpadu",
        topics: [
          { name: "Ruang & Interaksi Antarruang", subtopics: ["Letak & Luas Indonesia (Astronomis, Geografis, Geologis)", "Potensi SDA (Hutan, Tambang, Laut)", "Dinamika Kependudukan Indonesia"] },
          { name: "Interaksi Sosial", subtopics: ["Syarat Interaksi Sosial (Kontak & Komunikasi)", "Bentuk Interaksi Asosiatif (Kerja sama, Akomodasi, Asimilasi)", "Bentuk Interaksi Disosiatif (Persaingan, Kontravensi, Konflik)", "Lembaga Sosial (Keluarga, Agama, Ekonomi, Politik, Pendidikan)"] },
          { name: "Aktivitas Manusia Penuhi Kebutuhan", subtopics: ["Kelangkaan & Skala Prioritas", "Tindakan, Motif, & Prinsip Ekonomi", "Kegiatan Produksi, Distribusi, Konsumsi", "Permintaan, Penawaran, Pasar, & Harga"] },
          { name: "Kehidupan Masa Praaksara & Hindu-Buddha", subtopics: ["Pembagian Zaman Praaksara", "Jenis Manusia Purba di Indonesia", "Teori Masuknya Hindu-Buddha", "Kerajaan Tarumanegara, Sriwijaya, Majapahit"] }
        ]
      },
      {
        name: "PPKN",
        topics: [
          { name: "Perumusan Pancasila", subtopics: ["Sidang BPUPKI & PPKI", "Usulan rumusan Pancasila (Soekarno, Yamin, Soepomo)", "Semangat & komitmen kebangsaan pendiri negara"] },
          { name: "Norma dalam Masyarakat", subtopics: ["Norma Agama, Kesusilaan, Kesopanan, Hukum", "Sanksi pelanggaran norma", "Pentingnya norma untuk keadilan"] },
          { name: "Keberagaman SARA", subtopics: ["Faktor keberagaman di Indonesia", "Suku, Agama, Ras, Antargolongan", "Toleransi & Bhinneka Tunggal Ika"] },
          { name: "Daerah dalam NKRI", subtopics: ["Makna otonomi daerah", "Peran daerah melawan penjajah", "Menjaga keutuhan NKRI"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Adaptasi Lingkungan Baru", subtopics: ["Pertemuan 1: Menghadapi Perubahan dari SD ke SMP", "Pertemuan 2: Membangun Lingkaran Pertemanan Sehat"] },
          { name: "Bulan 2: Manajemen Waktu Remaja", subtopics: ["Pertemuan 1: Skala Prioritas (Penting vs Mendesak)", "Pertemuan 2: Mengatasi Prokrastinasi (Suka Menunda)"] },
          { name: "Bulan 3: Digital Citizenship", subtopics: ["Pertemuan 1: UU ITE Sederhana dan Etika Berkomentar", "Pertemuan 2: Menghindari Cyberbullying di Grup Chat"] },
          { name: "Bulan 4: Keterampilan Merangkum (Mind Mapping)", subtopics: ["Pertemuan 1: Struktur Mind Map yang Efektif", "Pertemuan 2: Meringkas Bab Sejarah Menggunakan Mind Map"] },
          { name: "Bulan 5: Dasar Pemrograman (Pengenalan Logika)", subtopics: ["Pertemuan 1: Konsep Algoritma Kehidupan", "Pertemuan 2: Flowchart Sederhana Memecahkan Masalah"] },
          { name: "Bulan 6: Kesadaran Emosional Remaja", subtopics: ["Pertemuan 1: Memahami Perubahan Emosi Masa Pubertas", "Pertemuan 2: Mengomunikasikan Perasaan ke Orang Tua"] },
          { name: "Bulan 7: Critical Thinking (Identifikasi Hoax)", subtopics: ["Pertemuan 1: Anatomi Berita Hoax", "Pertemuan 2: Tools untuk Fact Checking"] },
          { name: "Bulan 8: Keterampilan Presentasi SMP", subtopics: ["Pertemuan 1: Menyusun Slide Presentasi Minimalis", "Pertemuan 2: Mengatasi Stage Fright (Demam Panggung)"] },
          { name: "Bulan 9: Literasi Finansial (Uang Saku)", subtopics: ["Pertemuan 1: Mengelola Uang Saku Bulanan/Mingguan", "Pertemuan 2: Membedakan Diskon Asli dan Trik Marketing"] },
          { name: "Bulan 10: Kerjasama Tim dalam Proyek", subtopics: ["Pertemuan 1: Pembagian Peran dalam Kerja Kelompok", "Pertemuan 2: Menghadapi Teman yang 'Free Rider' (Tidak Kerja)"] },
          { name: "Bulan 11: Kemandirian dan Tanggung Jawab", subtopics: ["Pertemuan 1: Mencuci Pakaian dan Sepatu Sendiri", "Pertemuan 2: Mengakui Kesalahan Tanpa Mencari Alasan"] },
          { name: "Bulan 12: Evaluasi Akhir Tahun", subtopics: ["Pertemuan 1: Merefleksikan Nilai Rapor", "Pertemuan 2: Menyusun Strategi Belajar untuk Kelas 8"] }
        ]
      }
    ]
  },
  {
    level: "Kelas 8 SMP",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Pola Bilangan", subtopics: ["Mengenal pola konfigurasi objek", "Pola bilangan genap, ganjil, persegi, segitiga, Pascal", "Barisan Aritmatika (Suku ke-n)", "Barisan Geometri (Suku ke-n)"] },
          { name: "Koordinat Kartesius", subtopics: ["Posisi titik terhadap sumbu-X dan sumbu-Y", "Kuadran I, II, III, IV", "Posisi titik terhadap titik asal (0,0) dan titik tertentu (a,b)", "Posisi garis sejajar & tegak lurus"] },
          { name: "Relasi & Fungsi", subtopics: ["Pengertian relasi & penyajiannya (Diagram panah, himpunan, grafik)", "Pengertian Fungsi (Pemetaan)", "Domain, Kodomain, Range", "Menentukan nilai fungsi ( f(x) = ax + b )", "Korespondensi Satu-Satu"] },
          { name: "Persamaan Garis Lurus", subtopics: ["Grafik persamaan garis lurus", "Menentukan Gradien (kemiringan garis)", "Persamaan garis jika diketahui gradien dan 1 titik", "Persamaan garis yang melalui 2 titik", "Garis Sejajar & Garis Tegak Lurus"] },
          { name: "Sistem Persamaan Linear Dua Variabel (SPLDV)", subtopics: ["Membuat model matematika SPLDV", "Metode Substitusi", "Metode Eliminasi", "Metode Campuran", "Penyelesaian soal cerita aplikasi SPLDV"] },
          { name: "Teorema Pythagoras", subtopics: ["Pembuktian Teorema Pythagoras", "Mencari panjang sisi miring (hipotenusa) atau sisi siku-siku", "Tripel Pythagoras", "Menentukan jenis segitiga (lancip, siku-siku, tumpul)", "Penerapan Pythagoras dalam ruang/bidang"] },
          { name: "Lingkaran", subtopics: ["Keliling dan Luas Lingkaran", "Panjang Busur & Luas Juring", "Hubungan Sudut Pusat dan Sudut Keliling", "Garis Singgung Persekutuan Dalam (GSPD)", "Garis Singgung Persekutuan Luar (GSPL)"] },
          { name: "Bangun Ruang Sisi Datar", subtopics: ["Kubus & Balok (Jaring, Luas Permukaan, Volume)", "Prisma (Luas Permukaan, Volume)", "Limas (Luas Permukaan, Volume)", "Bangun ruang sisi datar gabungan"] },
          { name: "Statistika", subtopics: ["Menganalisis data (Mean, Median, Modus data tunggal/tabel)", "Jangkauan, Kuartil (Q1, Q2, Q3), Simpangan Kuartil"] },
          { name: "Peluang", subtopics: ["Ruang Sampel & Titik Sampel (Koin, Dadu, Kartu)", "Peluang Empiris", "Peluang Teoritik (Peluang suatu kejadian)"] }
        ]
      },
      {
        name: "IPA Fisika",
        topics: [
          { name: "Gerak Benda", subtopics: ["Jarak vs Perpindahan", "Kelajuan vs Kecepatan", "Gerak Lurus Beraturan (GLB)", "Gerak Lurus Berubah Beraturan (GLBB)", "Gaya & Hukum Newton I, II, III", "Penerapan Hukum Newton"] },
          { name: "Usaha & Pesawat Sederhana", subtopics: ["Konsep Usaha (W = F x s)", "Daya", "Tuas / Pengungkit (Jenis 1, 2, 3)", "Katrol (Tetap, Bebas, Majemuk)", "Bidang Miring", "Keuntungan Mekanis"] },
          { name: "Tekanan", subtopics: ["Tekanan Zat Padat (P = F/A)", "Tekanan Hidrostatis", "Hukum Archimedes (Mengapung, Melayang, Tenggelam)", "Hukum Pascal (Dongkrak Hidrolik)", "Tekanan Udara & Hukum Boyle"] },
          { name: "Getaran & Gelombang", subtopics: ["Periode & Frekuensi Getaran", "Gelombang Transversal & Longitudinal", "Rumus Cepat Rambat Gelombang (v = λ x f)", "Pemantulan Gelombang"] },
          { name: "Bunyi", subtopics: ["Syarat terdengar bunyi (Infrasonik, Audiosonik, Ultrasonik)", "Resonansi", "Pemantulan Bunyi (Gaung, Gema)", "Efek Doppler (Dasar)"] },
          { name: "Cahaya & Optik", subtopics: ["Pemantulan Cahaya (Hukum Snellius, Cermin Datar, Cekung, Cembung)", "Sinar Istimewa & Pembentukan Bayangan pada Cermin", "Pembiasan Cahaya (Lensa Cembung & Cekung)", "Kekuatan Lensa", "Alat Optik (Mata, Cacat Mata & Kacamata, Lup, Mikroskop)"] }
        ]
      },
      {
        name: "IPA Biologi",
        topics: [
          { name: "Sistem Gerak Manusia", subtopics: ["Fungsi Rangka", "Tulang Rawan & Tulang Keras", "Jenis Sendi (Engsel, Peluru, Putar, Pelana)", "Macam-macam Otot (Polos, Lurik, Jantung)", "Kelainan Tulang (Kifosis, Lordosis, Skoliosis, Osteoporosis)"] },
          { name: "Struktur & Fungsi Tumbuhan", subtopics: ["Jaringan Epidermis, Parenkim, Penyokong", "Xilem & Floem", "Akar, Batang, Daun (Monokotil vs Dikotil)", "Struktur Bunga", "Teknologi terinspirasi struktur tumbuhan"] },
          { name: "Sistem Pencernaan Manusia", subtopics: ["Zat Makanan (Karbohidrat, Protein, Lemak, Vitamin)", "Uji Makanan (Lugol, Biuret, Benedict)", "Organ Pencernaan (Mulut, Lambung, Usus Halus, Usus Besar)", "Enzim Pencernaan (Ptialin, Pepsin, Lipase, dll)", "Penyakit Pencernaan"] },
          { name: "Zat Aditif & Adiktif", subtopics: ["Pewarna, Pemanis, Pengawet, Penyedap Alami vs Buatan", "Narkotika, Psikotropika, Zat Psikoaktif lainnya (Kopi, Rokok)", "Dampak negatif & Pencegahan"] },
          { name: "Sistem Peredaran Darah Manusia", subtopics: ["Komponen Darah (Eritrosit, Leukosit, Trombosit, Plasma)", "Golongan Darah", "Jantung & Pembuluh Darah (Arteri vs Vena)", "Peredaran Darah Besar & Kecil", "Penyakit (Anemia, Hipertensi, Jantung Koroner)"] },
          { name: "Sistem Pernapasan Manusia", subtopics: ["Organ Pernapasan", "Mekanisme Pernapasan Dada & Perut", "Volume Udara Pernapasan (Tidal, Cadangan, Residu)", "Penyakit (Asma, TBC, Bronkitis)"] },
          { name: "Sistem Ekskresi Manusia", subtopics: ["Ginjal (Proses pembentukan urine: Filtrasi, Reabsorpsi, Augmentasi)", "Kulit, Paru-paru, Hati sebagai alat ekskresi", "Penyakit (Batu ginjal, Diabetes melitus, Albuminuria)"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Modals & Obligations", subtopics: ["Must vs Should (Obligation vs Advice)", "Can vs Will (Ability vs Willingness)", "Rules in class/school"] },
          { name: "Present Continuous & Past Tense", subtopics: ["Present Continuous (What are you doing?)", "Past Continuous", "Simple Past Tense (Regular & Irregular Verbs)", "Telling past experiences"] },
          { name: "Degrees of Comparison", subtopics: ["Positive degree (as ... as)", "Comparative degree (-er / more)", "Superlative degree (-est / most)"] },
          { name: "Recount & Narrative Text", subtopics: ["Personal Recount (Holiday experience)", "Narrative Text (Fairy tales, fables)", "Generic structure of Recount & Narrative"] },
          { name: "Short Messages & Notices", subtopics: ["Greeting cards", "Short message / SMS", "Notice / Warning / Caution in public places"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Berita", subtopics: ["Unsur berita (5W+1H / ADiKSiMBa)", "Struktur berita (Kepala, Tubuh, Ekor berita)", "Kaidah kebahasaan (Kalimat langsung, konjungsi bahwa)"] },
          { name: "Teks Iklan, Slogan, Poster", subtopics: ["Perbedaan Iklan, Slogan, Poster", "Unsur pembentuk iklan", "Menulis & mendesain poster/slogan persuasif"] },
          { name: "Teks Eksposisi", subtopics: ["Struktur teks eksposisi (Tesis, Argumentasi, Penegasan Ulang)", "Fakta vs Opini dalam teks", "Kata ganti (pronomina) & konjungsi kausalitas"] },
          { name: "Puisi", subtopics: ["Unsur pembangun puisi (Diksi, Imaji, Majas, Rima, Tema, Amanat)", "Majas personifikasi, metafora, hiperbola", "Menulis puisi"] },
          { name: "Teks Eksplanasi", subtopics: ["Struktur (Identifikasi fenomena, Deretan penjelas, Ulasan)", "Fenomena alam, sosial, budaya", "Kaidah kebahasaan (Kata teknis, konjungsi kausal/temporal)"] },
          { name: "Teks Ulasan (Resensi)", subtopics: ["Struktur ulasan (Identitas, Orientasi, Sinopsis, Evaluasi)", "Keunggulan & kelemahan karya (Film, Buku)", "Konjungsi penerang (bahwa, yakni) & penyebaban"] },
          { name: "Teks Persuasi", subtopics: ["Struktur teks persuasi", "Kalimat ajakan, bujukan, larangan", "Fakta untuk memperkuat argumen persuasif"] },
          { name: "Teks Drama", subtopics: ["Unsur drama (Prolog, Dialog, Epilog, Tokoh, Latar)", "Jenis-jenis drama", "Menulis naskah drama pendek"] }
        ]
      },
      {
        name: "IPS Terpadu",
        topics: [
          { name: "Keunggulan Lokasi ASEAN", subtopics: ["Letak koordinat & geografis negara ASEAN", "Iklim & Bentang Alam", "Kerja sama antarnegara ASEAN (Ekonomi, Politik, Sosial, Budaya)"] },
          { name: "Mobilitas Sosial", subtopics: ["Pengertian & Bentuk Mobilitas (Vertikal Naik/Turun, Horizontal)", "Faktor Pendorong & Penghambat Mobilitas", "Saluran Mobilitas Sosial", "Dampak Mobilitas Sosial"] },
          { name: "Pluralitas Masyarakat Indonesia", subtopics: ["Perbedaan Agama, Budaya, Suku Bangsa, Pekerjaan", "Peran & Fungsi Keragaman Budaya", "Konflik & Integrasi Sosial (Penyebab konflik & cara mengatasi)"] },
          { name: "Keunggulan & Keterbatasan Antarruang", subtopics: ["Peran Pelaku Ekonomi (RTK, RTP, Pemerintah, Luar Negeri)", "Perdagangan Antardaerah & Antarpulau", "Perdagangan Internasional (Ekspor, Impor)", "Pengembangan Ekonomi Maritim & Agrikultur"] },
          { name: "Kedatangan Bangsa Barat", subtopics: ["Latar Belakang Kedatangan Bangsa Eropa (3G)", "Masa VOC & Kebijakannya (Monopoli, Ekstirpasi)", "Kebijakan Daendels, Raffles, & Tanam Paksa (Cultuurstelsel)", "Perlawanan Rakyat (Diponegoro, Pattimura, Sultan Hasanuddin)"] },
          { name: "Pergerakan Nasional", subtopics: ["Faktor Internal & Eksternal Kebangkitan Nasional", "Organisasi Pergerakan (Budi Utomo, Sarekat Islam, PNI)", "Sumpah Pemuda", "Masa Pendudukan Jepang"] }
        ]
      },
      {
        name: "Pendidikan Pancasila (PPKN)",
        topics: [
          { name: "Kedudukan dan Makna Pancasila", subtopics: ["Pancasila sebagai Dasar Negara", "Pancasila sebagai Pandangan Hidup Bangsa", "Membiasakan Perilaku Sesuai Nilai-nilai Pancasila"] },
          { name: "Bentuk dan Kedaulatan Negara", subtopics: ["Makna Kedaulatan", "Teori Kedaulatan", "Bentuk Kedaulatan yang Dianut Indonesia", "Prinsip-prinsip Kedaulatan Negara RI"] },
          { name: "Tata Urutan Peraturan Perundang-undangan", subtopics: ["Makna Tata Urutan Perundang-undangan", "Proses Pembuatan Peraturan Perundang-undangan", "Sikap Kepatuhan Terhadap Hukum"] },
          { name: "Kebangkitan Nasional 1908", subtopics: ["Kondisi Bangsa Indonesia Sebelum 1908", "Perintis Kebangkitan Nasional", "Mewujudkan Persatuan dan Kebanggaan Nasional"] },
          { name: "Sumpah Pemuda dalam Bingkai Bhinneka Tunggal Ika", subtopics: ["Arti dan Makna Sumpah Pemuda", "Memaknai Semangat Kejuangan Pemuda", "Nilai Semangat Sumpah Pemuda Masa Kini"] }
        ]
      },
      {
        name: "Dasar Pemrograman (Python & Scratch)",
        topics: [
          { name: "Pengenalan Scratch", subtopics: ["Antarmuka & Blok Kode Scratch", "Menggerakkan Sprite & Animasi", "Event & Trigger (When Flag Clicked)", "Variabel & Scoring dalam Game Sederhana", "Looping & Kondisional (If-Else) di Scratch"] },
          { name: "Pengenalan Python", subtopics: ["Instalasi Python & Editor (IDLE/VS Code)", "Sintaks Dasar & Fungsi print()", "Tipe Data (Integer, String, Float, Boolean)", "Variabel & Input dari User"] },
          { name: "Struktur Kontrol Python", subtopics: ["Percabangan (If, Elif, Else)", "Operator Logika (And, Or, Not)", "Perulangan (For Loop & While Loop)", "Break & Continue"] },
          { name: "Struktur Data Dasar Python", subtopics: ["List (Menambah, Menghapus, Mengakses Elemen)", "Tuple & Perbedaannya dengan List", "Dictionary (Key-Value Pair)"] },
          { name: "Fungsi (Function) Python", subtopics: ["Mendefinisikan Fungsi (def)", "Parameter & Argumen", "Return Value (Nilai Kembalian)"] },
          { name: "Mini Project Pemrograman", subtopics: ["Membuat Kalkulator Sederhana", "Game Tebak Angka", "Aplikasi Kuis Interaktif Berbasis Teks"] }
        ]
      },
      {
        name: "Pengembangan Game Komputer Dasar",
        topics: [
          { name: "Konsep Dasar Game Development", subtopics: ["Genre Game & Game Mechanics", "Alur Pembuatan Game (Pre-production, Production, Post)", "Aset Game (Sprite, Sound, Music, UI)"] },
          { name: "Game Engine Pemula (Construct 3 / GDevelop)", subtopics: ["Pengenalan Interface & Workspace", "Memasukkan Objek & Karakter", "Menambahkan Behavior (Platformer, 8-Direction)"] },
          { name: "Logika Event dalam Game", subtopics: ["Event Sheet & Actions", "Sistem Tabrakan (Collision Detection)", "Spawning & Destroying Objects"] },
          { name: "Sistem Level & UI", subtopics: ["Membuat Start Menu & Game Over Screen", "Sistem Nyawa (Health/Lives) & Skor", "Berpindah Antar Level (Scene/Layout)"] },
          { name: "Game Publishing", subtopics: ["Export Game ke HTML5", "Bermain Game di Web Browser", "Mencari Feedback dari Tester"] }
        ]
      },
      {
        name: "Logika & Algoritma Digital",
        topics: [
          { name: "Konsep Algoritma", subtopics: ["Apa itu Algoritma?", "Ciri-ciri Algoritma yang Baik", "Penerapan Algoritma di Kehidupan Sehari-hari"] },
          { name: "Penyajian Algoritma", subtopics: ["Pseudocode (Kode Semu)", "Flowchart (Diagram Alir) & Simbol-simbolnya", "Membaca & Membuat Flowchart Sederhana"] },
          { name: "Berpikir Komputasional", subtopics: ["Dekomposisi (Memecah Masalah)", "Pengenalan Pola (Pattern Recognition)", "Abstraksi (Menyaring Informasi Penting)", "Perancangan Algoritma"] },
          { name: "Logika Proposisi & Gerbang Logika Dasar", subtopics: ["Pernyataan Benar (True) & Salah (False)", "Operator AND, OR, NOT", "Tabel Kebenaran Sederhana", "Gerbang Logika (Logic Gates)"] }
        ]
      },
      {
        name: "Desain Grafis & UI/UX Aplikasi",
        topics: [
          { name: "Prinsip Dasar Desain Grafis", subtopics: ["Warna (Color Theory, RGB vs CMYK)", "Tipografi (Font Serif, Sans-serif, Script)", "Layout & Komposisi (Rule of Thirds, Grid)", "Keseimbangan (Balance) & Kontras"] },
          { name: "Pengenalan Aplikasi Desain (Canva / Figma)", subtopics: ["Workspace & Tools Dasar", "Menggunakan Shapes, Teks, dan Gambar", "Layers & Grouping"] },
          { name: "Konsep UI (User Interface)", subtopics: ["Apa itu UI?", "Elemen UI (Tombol, Ikon, Input Field)", "Konsistensi Visual & Hierarki Desain", "Membuat Wireframe (Sketsa Kasar)"] },
          { name: "Konsep UX (User Experience)", subtopics: ["Memahami Kebutuhan Pengguna", "User Flow (Alur Pengguna)", "Membuat Prototipe Sederhana", "Testing Prototipe Aplikasi"] },
          { name: "Proyek Desain Aplikasi", subtopics: ["Merancang Tampilan Halaman Login", "Merancang Halaman Beranda (Home Screen)", "Membuat Interaksi (Click/Hover) di Figma"] }
        ]
      },
      {
        name: "Pengenalan IoT & Sistem Sensor",
        topics: [
          { name: "Dasar Internet of Things (IoT)", subtopics: ["Apa itu IoT?", "Contoh Penerapan IoT di Rumah (Smart Home)", "Komponen Utama IoT (Sensor, Perangkat, Jaringan, Cloud)"] },
          { name: "Pengenalan Mikrokontroler (Arduino/ESP8266)", subtopics: ["Apa itu Arduino?", "Memahami Pin Input & Output", "Rangkaian Elektronika Dasar (Breadboard, LED, Resistor)", "Cara Mengupload Kode ke Papan"] },
          { name: "Jenis-jenis Sensor Dasar", subtopics: ["Sensor Suhu & Kelembaban (DHT11)", "Sensor Jarak (Ultrasonik)", "Sensor Cahaya (LDR)", "Sensor Gerak (PIR)"] },
          { name: "Pemrograman Perangkat Keras", subtopics: ["Membaca Data Analog & Digital", "Mengontrol LED dengan Sensor Cahaya", "Membunyikan Buzzer Saat Ada Jarak Dekat"] },
          { name: "Menghubungkan Perangkat ke Internet", subtopics: ["Konsep Wi-Fi pada Mikrokontroler", "Mengirim Data Sensor ke Platform IoT (Thingspeak / Blynk)", "Mengontrol Lampu via Smartphone"] }
        ]
      },
      {
        name: "Keamanan Siber Dasar (Cybersecurity)",
        topics: [
          { name: "Pengenalan Keamanan Siber", subtopics: ["Apa itu Cybersecurity?", "Ancaman di Dunia Maya (Malware, Virus, Trojan)", "Pentingnya Melindungi Data Pribadi"] },
          { name: "Praktik Aman Berinternet", subtopics: ["Membuat Password yang Kuat & Password Manager", "Autentikasi Dua Langkah (2FA)", "Mengenali Phishing (Email/Link Palsu)", "Bahaya Public Wi-Fi"] },
          { name: "Jejak Digital & Etika Online", subtopics: ["Apa itu Jejak Digital (Digital Footprint)?", "Dampak Postingan di Media Sosial", "Cyberbullying & Cara Mencegahnya"] },
          { name: "Kriptografi Sederhana", subtopics: ["Konsep Enkripsi & Dekripsi", "Sandi Caesar (Caesar Cipher)", "Pentingnya Enkripsi pada Aplikasi Chatting"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Leadership & Pengaruh Teman Sebaya", subtopics: ["Pertemuan 1: Menghindari Peer Pressure Negatif (Narkoba/Rokok)", "Pertemuan 2: Menjadi Role Model di Kelas"] },
          { name: "Bulan 2: Kreativitas Digital (Content Creation)", subtopics: ["Pertemuan 1: Dasar Fotografi/Videografi Menggunakan HP", "Pertemuan 2: Etika Membuat Konten TikTok/Reels"] },
          { name: "Bulan 3: Problem Solving (Design Thinking Dasar)", subtopics: ["Pertemuan 1: Empati dan Mendefinisikan Masalah", "Pertemuan 2: Brainstorming Ide Solusi"] },
          { name: "Bulan 4: Keterampilan Menulis Esai/Artikel", subtopics: ["Pertemuan 1: Menyusun Paragraf Argumentasi", "Pertemuan 2: Menulis Artikel Opini tentang Isu Sekolah"] },
          { name: "Bulan 5: Keamanan Siber Dasar (Cybersecurity)", subtopics: ["Pertemuan 1: Ancaman Phishing dan Malware", "Pertemuan 2: Keamanan Akun Sosial Media (2FA)"] },
          { name: "Bulan 6: Pemahaman Minat dan Bakat", subtopics: ["Pertemuan 1: Eksplorasi Ekstrakurikuler yang Sesuai", "Pertemuan 2: Mengikuti Lomba Sesuai Bidang Minat"] },
          { name: "Bulan 7: Komunikasi Asertif", subtopics: ["Pertemuan 1: Berani Berkata 'TIDAK' dengan Sopan", "Pertemuan 2: Menyampaikan Kritik Tanpa Menyakiti (Sandwich Method)"] },
          { name: "Bulan 8: Dasar-Dasar Wirausaha Remaja", subtopics: ["Pertemuan 1: Mengenal Bisnis Dropship/Reseller", "Pertemuan 2: Cara Menjual Barang Pre-loved/Bekas"] },
          { name: "Bulan 9: Pemecahan Konflik (Conflict Resolution)", subtopics: ["Pertemuan 1: Mediasi Konflik Antar Teman", "Pertemuan 2: Kompromi dalam Perbedaan Pendapat"] },
          { name: "Bulan 10: Pengenalan Spreadsheet/Excel", subtopics: ["Pertemuan 1: Mengatur Data Siswa/Tugas", "Pertemuan 2: Menggunakan Rumus SUM, AVERAGE Dasar"] },
          { name: "Bulan 11: Kesehatan Mental (Self-Care)", subtopics: ["Pertemuan 1: Tanda-tanda Burnout Belajar", "Pertemuan 2: Aktivitas Me-Time yang Menyehatkan"] },
          { name: "Bulan 12: Menyiapkan Diri untuk Kelas 9", subtopics: ["Pertemuan 1: Pola Belajar Menuju Ujian", "Pertemuan 2: Menetapkan Target SMA Impian"] }
        ]
      }
    ]
  },
  {
    level: "Kelas 9 SMP",
    subjects: [
      {
        name: "Matematika",
        topics: [
          { name: "Perpangkatan & Bentuk Akar", subtopics: ["Sifat-sifat bilangan berpangkat", "Pangkat nol dan negatif", "Merasionalkan bentuk akar", "Operasi penjumlahan & perkalian bentuk akar", "Notasi Ilmiah (Bentuk Baku)"] },
          { name: "Persamaan Kuadrat", subtopics: ["Bentuk umum persamaan kuadrat (ax² + bx + c = 0)", "Mencari akar dengan Pemfaktoran", "Mencari akar dengan Melengkapkan Kuadrat Sempurna", "Mencari akar dengan Rumus ABC", "Diskriminan & Jenis-jenis akar"] },
          { name: "Fungsi Kuadrat", subtopics: ["Bentuk umum Fungsi Kuadrat ( y = ax² + bx + c )", "Titik Potong sumbu-X dan sumbu-Y", "Sumbu Simetri (x = -b/2a)", "Nilai Maksimum/Minimum & Titik Puncak", "Menggambar Grafik Parabola"] },
          { name: "Transformasi Geometri", subtopics: ["Translasi (Pergeseran)", "Refleksi (Pencerminan terhadap Sumbu X, Y, y=x, dll)", "Rotasi (Perputaran dengan pusat 0,0)", "Dilatasi (Perkalian ukuran dengan faktor skala k)", "Komposisi Transformasi"] },
          { name: "Kesebangunan & Kekongruenan", subtopics: ["Syarat Dua Bangun Kongruen", "Syarat Dua Bangun Sebangun", "Kesebangunan pada Segitiga", "Segitiga Sebangun pada Segitiga Siku-siku (Garis Tinggi)", "Soal Cerita Skala, Foto, dan Model Gedung"] },
          { name: "Bangun Ruang Sisi Lengkung", subtopics: ["Tabung (Jaring, Luas Permukaan, Luas Selimut, Volume)", "Kerucut (Garis Pelukis, Luas Permukaan, Volume)", "Bola (Luas Permukaan, Volume)", "Bangun ruang gabungan & terpotong"] }
        ]
      },
      {
        name: "IPA Fisika",
        topics: [
          { name: "Listrik Statis", subtopics: ["Muatan Listrik (Proton, Elektron)", "Hukum Coulomb (F = k.q1.q2/r²)", "Medan Listrik & Beda Potensial", "Kelistrikan pada Sistem Saraf Manusia"] },
          { name: "Listrik Dinamis", subtopics: ["Arus Listrik & Beda Potensial (I = q/t)", "Hukum Ohm (V = I x R)", "Rangkaian Hambatan Seri & Paralel", "Hukum I Kirchhoff (Arus Masuk = Arus Keluar)", "Energi Listrik (W = V.I.t) & Daya Listrik (P = V.I)", "Perhitungan Biaya Listrik Bulanan PLN"] },
          { name: "Kemagnetan", subtopics: ["Sifat Magnet & Cara Membuat Magnet", "Teori Kemagnetan Bumi (Deklinasi, Inklinasi)", "Gaya Lorentz (F = B.I.L)", "Motor Listrik"] },
          { name: "Induksi Elektromagnetik", subtopics: ["GGL Induksi (Hukum Faraday)", "Generator (AC & DC)", "Transformator (Trafo Step Up & Step Down)", "Efisiensi Trafo"] }
        ]
      },
      {
        name: "IPA Biologi",
        topics: [
          { name: "Sistem Reproduksi Manusia", subtopics: ["Pembelahan Sel (Mitosis & Meiosis)", "Organ Reproduksi Laki-laki & Spermatogenesis", "Organ Reproduksi Perempuan & Oogenesis", "Siklus Menstruasi, Fertilisasi, Kehamilan", "Penyakit Menular Seksual (HIV/AIDS, Sifilis, Gonore)"] },
          { name: "Reproduksi Tumbuhan & Hewan", subtopics: ["Vegetatif Alami & Buatan Tumbuhan", "Generatif Tumbuhan Berbiji (Penyerbukan & Pembuahan Ganda)", "Reproduksi Hewan (Aseksual: Tunas, Fragmentasi) & Seksual", "Teknologi Reproduksi (Kultur Jaringan, Inseminasi Buatan)"] },
          { name: "Pewarisan Sifat (Genetika)", subtopics: ["Materi Genetik (Kromosom, DNA, RNA, Gen)", "Istilah Genetika (Genotipe, Fenotipe, Dominan, Resesif)", "Persilangan Monohibrid (Hukum Mendel I)", "Persilangan Dihibrid (Hukum Mendel II)", "Pewarisan Sifat pada Manusia (Golongan Darah, Buta Warna)"] },
          { name: "Bioteknologi", subtopics: ["Bioteknologi Konvensional (Pembuatan Tempe, Yoghurt, Nata de Coco, Tape, Keju)", "Bioteknologi Modern (Rekayasa Genetika, Transgenik, Kloning)", "Dampak Positif & Negatif Bioteknologi bagi Lingkungan"] },
          { name: "Tanah & Kehidupan", subtopics: ["Peran Tanah bagi Kehidupan", "Komponen Penyusun Tanah & Lapisan Tanah", "Organisme Tanah (Cacing, Bakteri, Jamur)", "Upaya Menjaga Kelestarian Tanah"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Expression of Hope, Wish & Congratulation", subtopics: ["Saying Congratulations", "Expressing Hope & Wish (I hope..., I wish...)", "Agreement & Disagreement (I agree, I completely disagree)"] },
          { name: "Labels & Products", subtopics: ["Reading Food & Drug Labels (Nutrition facts, Expiry date, Dosage)", "Procedure Text (Recipes & Manuals)"] },
          { name: "Present Perfect Tense", subtopics: ["Formulas (Have/Has + V3)", "Since & For", "Differentiating Present Perfect and Simple Past"] },
          { name: "Passive Voice", subtopics: ["Passive Voice in Present Tense", "Passive Voice in Past Tense", "Changing Active to Passive Sentences"] },
          { name: "Report Text", subtopics: ["Factual Report vs Descriptive Text", "Generic Structure (General Classification, Description)", "Scientific facts about animals/natural phenomena"] },
          { name: "Advertisement", subtopics: ["Identifying parts of an advertisement", "Promoting products/services"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Laporan Percobaan", subtopics: ["Struktur teks (Tujuan, Alat & Bahan, Langkah, Hasil, Simpulan)", "Kaidah Kebahasaan (Sinonim, Antonim, Kalimat Kompleks)", "Menyajikan laporan hasil percobaan sains"] },
          { name: "Pidato Persuasif", subtopics: ["Struktur Pidato (Pembukaan, Isi, Penutup)", "Metode Berpidato (Ekstemporan, Naskah, Hafalan, Impromtu)", "Kalimat aktif, kosa kata emotif, kata tugas"] },
          { name: "Cerpen (Cerita Pendek)", subtopics: ["Unsur Intrinsik (Tema, Alur, Penokohan, Latar, Sudut Pandang, Amanat)", "Unsur Ekstrinsik (Latar belakang penulis, nilai sosial)", "Menulis cerpen berdasarkan pengalaman"] },
          { name: "Teks Tanggapan Kritis", subtopics: ["Struktur (Konteks, Deskripsi, Penilaian)", "Memberi pujian dan kritik obyektif", "Bahasa evaluatif yang santun"] },
          { name: "Teks Diskusi", subtopics: ["Struktur (Isu, Argumen Mendukung/Pro, Argumen Menentang/Kontra, Simpulan)", "Kata rujukan, konjungsi pertentangan (namun, sebaliknya)", "Menyusun teks diskusi isu terkini"] },
          { name: "Teks Cerita Inspiratif", subtopics: ["Struktur (Orientasi, Perumitan Peristiwa, Komplikasi, Resolusi, Koda)", "Makna tersirat dari kisah inspiratif", "Menulis cerita tokoh inspiratif"] }
        ]
      },
      {
        name: "IPS Terpadu",
        topics: [
          { name: "Interaksi Antarnegara Asia & Benua Lainnya", subtopics: ["Letak & Luas Benua Asia, Amerika, Afrika, Eropa, Australia", "Kondisi Alam & Iklim Negara Maju (Jepang, AS, Inggris)", "Dinamika Penduduk Benua-benua di Dunia", "Pengaruh Perubahan Ruang terhadap Ekonomi & Politik Global"] },
          { name: "Perubahan Sosial Budaya & Globalisasi", subtopics: ["Bentuk Perubahan Sosial (Evolusi, Revolusi, Direncanakan, Tidak Direncanakan)", "Faktor Pendorong & Penghambat Perubahan Sosial", "Globalisasi di Bidang Ekonomi, Komunikasi, IPTEK, Budaya", "Dampak Positif & Negatif Globalisasi (Westernisasi, Kesenjangan Sosial)"] },
          { name: "Ketergantungan Antarruang & Kesejahteraan", subtopics: ["Perdagangan Internasional (Teori Keunggulan Mutlak & Komparatif)", "Kebijakan Perdagangan Internasional (Proteksi, Kuota, Tarif, Dumping)", "Ekonomi Kreatif (Gagasan, Potensi, Pusat Keunggulan Ekonomi)", "Pasar Bebas (MEA, AFTA, APEC, MEE, WTO)"] },
          { name: "Masa Kemerdekaan Hingga Reformasi", subtopics: ["Masa Kemerdekaan (1945-1950) & Mempertahankan Kemerdekaan", "Masa Demokrasi Parlementer (Liberal) (1950-1959)", "Masa Demokrasi Terpimpin (1959-1965) (Dekrit Presiden, Trikora)", "Masa Orde Baru (1966-1998) (Supersemar, Pembangunan Lima Tahun)", "Masa Reformasi (1998-Sekarang)"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Fokus dan Motivasi Belajar Ujian", subtopics: ["Pertemuan 1: Menemukan 'Why' dalam Belajar", "Pertemuan 2: Mengelola Distraksi Gadget Menjelang Ujian"] },
          { name: "Bulan 2: Strategi Memilih SMA/SMK", subtopics: ["Pertemuan 1: Perbedaan SMA, SMK, dan MA", "Pertemuan 2: Menyesuaikan Minat dengan Jurusan SMK"] },
          { name: "Bulan 3: Time Management Intensif", subtopics: ["Pertemuan 1: Membagi Waktu Antara Try Out dan Tugas", "Pertemuan 2: Teknik Belajar Spaced Repetition"] },
          { name: "Bulan 4: Keterampilan Wawancara Dasar", subtopics: ["Pertemuan 1: Persiapan Wawancara Masuk SMA/SMK", "Pertemuan 2: Menjawab Pertanyaan 'Kelebihan/Kekurangan Diri'"] },
          { name: "Bulan 5: Personal Branding Remaja", subtopics: ["Pertemuan 1: Membangun Citra Positif di Media Sosial", "Pertemuan 2: Membuat Portofolio Karya Sederhana"] },
          { name: "Bulan 6: Literasi Keuangan (Investasi Pemula)", subtopics: ["Pertemuan 1: Konsep Bunga Majemuk dalam Tabungan", "Pertemuan 2: Bedanya Menabung dan Investasi (Dasar)"] },
          { name: "Bulan 7: Public Speaking (Pidato/Orasi)", subtopics: ["Pertemuan 1: Teknik Eye Contact dan Body Language", "Pertemuan 2: Membawakan Pidato Kelulusan (Simulasi)"] },
          { name: "Bulan 8: Critical Reading untuk Ujian", subtopics: ["Pertemuan 1: Skimming dan Scanning Soal Panjang", "Pertemuan 2: Menganalisis Pilihan Ganda Menjebak"] },
          { name: "Bulan 9: Manajemen Stres Tingkat Lanjut", subtopics: ["Pertemuan 1: Mengatasi Kecemasan Saat Try Out", "Pertemuan 2: Pentingnya Tidur Cukup Sebelum Ujian"] },
          { name: "Bulan 10: Pengenalan AI Tools untuk Belajar", subtopics: ["Pertemuan 1: Cara Bertanya pada ChatGPT (Prompting)", "Pertemuan 2: Etika Menggunakan AI Tanpa Plagiasi"] },
          { name: "Bulan 11: Kemandirian Administrasi", subtopics: ["Pertemuan 1: Mengurus Dokumen Kelulusan", "Pertemuan 2: Memahami Alur Pendaftaran PPDB"] },
          { name: "Bulan 12: Orientasi Masa Depan", subtopics: ["Pertemuan 1: Mental Banting Setir Jika Tidak Lolos Sekolah Impian", "Pertemuan 2: Rencana Aksi Kelas 10"] }
        ]
      }
    ]
  },

  // ==========================================
  // JENJANG SMA/K (Kelas 10 - 12)
  // ==========================================
  {
    level: "Kelas 10 SMA/K",
    subjects: [
      {
        name: "Matematika Wajib",
        topics: [
          { name: "Persamaan & Pertidaksamaan Nilai Mutlak", subtopics: ["Konsep Nilai Mutlak", "Persamaan Linear Nilai Mutlak 1 Variabel (|ax+b| = c)", "Pertidaksamaan Nilai Mutlak (|ax+b| < c, |ax+b| > |cx+d|)"] },
          { name: "Sistem Persamaan Linear Tiga Variabel (SPLTV)", subtopics: ["Metode Substitusi & Eliminasi SPLTV", "Penyelesaian Soal Cerita SPLTV (Model Matematika)"] },
          { name: "Sistem Pertidaksamaan Dua Variabel", subtopics: ["Sistem Pertidaksamaan Linear-Kuadrat (SPtLDV)", "Sistem Pertidaksamaan Kuadrat-Kuadrat", "Daerah Himpunan Penyelesaian (DHP) pada Grafik"] },
          { name: "Relasi & Fungsi", subtopics: ["Fungsi Linear (Grafik & Persamaan)", "Fungsi Kuadrat (Menyusun persamaan kuadrat baru)", "Fungsi Rasional (Asimtot datar & tegak)", "Fungsi Komposisi (f o g)(x)", "Fungsi Invers f⁻¹(x)"] },
          { name: "Trigonometri Dasar", subtopics: ["Ukuran Sudut (Derajat & Radian)", "Perbandingan Trigonometri (Sin, Cos, Tan, Csc, Sec, Cot) pada Segitiga Siku-siku", "Trigonometri Sudut Istimewa (0, 30, 45, 60, 90)", "Trigonometri di Berbagai Kuadran & Sudut Berelasi", "Identitas Trigonometri Dasar", "Aturan Sinus & Aturan Cosinus", "Luas Segitiga dengan Trigonometri", "Grafik Fungsi Trigonometri (Y = A sin(bx + c))"] }
        ]
      },
      {
        name: "Fisika",
        topics: [
          { name: "Hakikat Fisika & Pengukuran", subtopics: ["Metode Ilmiah", "Besaran & Satuan (Dimensi)", "Alat Ukur & Angka Penting", "Ketidakpastian Pengukuran"] },
          { name: "Vektor", subtopics: ["Penjumlahan Vektor (Poligon, Jajargenjang)", "Metode Analitis (Mengurai Vektor Sumbu X & Y)", "Resultan & Arah Vektor"] },
          { name: "Gerak Lurus (Kinematika)", subtopics: ["Posisi, Jarak, Perpindahan, Kelajuan, Kecepatan", "Grafik s-t dan v-t pada GLB & GLBB", "Gerak Jatuh Bebas (GJB) & Gerak Vertikal (GVA, GVB)"] },
          { name: "Gerak Parabola", subtopics: ["Perpaduan GLB (Sumbu X) & GLBB (Sumbu Y)", "Tinggi Maksimum & Jarak Terjauh", "Waktu Mencapai Titik Puncak"] },
          { name: "Gerak Melingkar Beraturan (GMB)", subtopics: ["Frekuensi, Periode, Kecepatan Sudut, Kecepatan Linear", "Percepatan Sentripetal & Gaya Sentripetal", "Hubungan Roda-roda (Seporos, Bersinggungan, Dihubungkan Tali)"] },
          { name: "Hukum Newton tentang Gerak (Dinamika)", subtopics: ["Hukum I, II, III Newton", "Gaya Berat, Gaya Normal, Gaya Gesek (Statis & Kinetis)", "Gaya Tegangan Tali, Sistem Katrol, Bidang Miring"] },
          { name: "Hukum Newton tentang Gravitasi", subtopics: ["Gaya Gravitasi Antar Partikel", "Kuat Medan Gravitasi (Percepatan Gravitasi)", "Hukum I, II, III Kepler & Aplikasinya pada Planet/Satelit"] },
          { name: "Usaha & Energi", subtopics: ["Usaha (W = F.s cos θ)", "Energi Kinetik (Ek) & Teorema Usaha-Energi", "Energi Potensial Gravitasi & Pegas", "Hukum Kekekalan Energi Mekanik"] },
          { name: "Momentum & Impuls", subtopics: ["Konsep Momentum (p = m.v) & Impuls (I = F.Δt)", "Teorema Impuls-Momentum", "Hukum Kekekalan Momentum", "Tumbukan Lenting Sempurna, Sebagian (Koefisien Restitusi), Tidak Lenting Sama Sekali"] }
        ]
      },
      {
        name: "Kimia",
        topics: [
          { name: "Struktur Atom & Sistem Periodik Unsur", subtopics: ["Perkembangan Teori Atom (Dalton - Mekanika Kuantum)", "Proton, Elektron, Neutron, Isotop, Isobar, Isoton", "Konfigurasi Elektron (Kulit Bohr & Subkulit Aufbau/Hund/Pauli)", "Bilangan Kuantum (n, l, m, s)", "Sistem Periodik Unsur (Golongan & Periode)", "Sifat Keperiodikan (Jari-jari, Energi Ionisasi, Afinitas Elektron, Keelektronegatifan)"] },
          { name: "Ikatan Kimia & Bentuk Molekul", subtopics: ["Kestabilan Unsur & Struktur Lewis", "Ikatan Ion (Proses Pembentukan & Sifat)", "Ikatan Kovalen (Tunggal, Rangkap, Polar, Nonpolar, Koordinasi)", "Bentuk Molekul (Teori VSEPR & Domain Elektron)", "Hibridisasi", "Gaya Antarmolekul (Gaya London, Dipol-dipol, Ikatan Hidrogen)"] },
          { name: "Tata Nama Senyawa & Persamaan Reaksi", subtopics: ["Tata Nama Senyawa Biner & Poliatomik (Anorganik)", "Tata Nama Senyawa Organik Sederhana", "Menyetarakan Persamaan Reaksi Kimia"] },
          { name: "Hukum Dasar Kimia & Stoikiometri", subtopics: ["Hukum Lavoisier, Proust, Dalton, Gay-Lussac, Hipotesis Avogadro", "Konsep Mol (Hubungan Massa, Volume STP/RTP, Partikel, Molaritas)", "Rumus Empiris & Rumus Molekul", "Stoikiometri Reaksi (Pereaksi Pembatas, Pereaksi Sisa)", "Kadar Zat (Persen, ppm) & Air Kristal (Hidrat)"] }
        ]
      },
      {
        name: "Biologi",
        topics: [
          { name: "Ruang Lingkup Biologi", subtopics: ["Cabang-cabang Ilmu Biologi", "Tingkat Organisasi Kehidupan (Molekul hingga Biosfer)", "Metode Ilmiah & Keselamatan Kerja di Laboratorium"] },
          { name: "Keanekaragaman Hayati", subtopics: ["Keanekaragaman Tingkat Gen, Jenis, dan Ekosistem", "Persebaran Flora & Fauna Indonesia (Wallace, Weber)", "Upaya Pelestarian Keanekaragaman Hayati (In situ, Ex situ)"] },
          { name: "Klasifikasi Makhluk Hidup", subtopics: ["Tujuan & Manfaat Klasifikasi", "Sistem Binomial Nomenclature (Tata Nama Ganda)", "Kladogram & Sistem 5 Kingdom"] },
          { name: "Virus", subtopics: ["Ciri & Struktur Virus (Bakteriofag dll)", "Reproduksi Virus (Daur Litik & Lisogenik)", "Peranan Virus yang Merugikan (Penyakit) & Menguntungkan (Vaksin)"] },
          { name: "Monera (Bakteri & Archaebacteria)", subtopics: ["Struktur & Bentuk Sel Bakteri", "Reproduksi Bakteri (Seksual & Aseksual)", "Peranan Bakteri (Lactobacillus, Rhizobium, Patogen)"] },
          { name: "Protista", subtopics: ["Ciri Umum Protista", "Protista Mirip Hewan (Protozoa: Rhizopoda, Flagellata, Ciliata, Sporozoa)", "Protista Mirip Tumbuhan (Alga)", "Protista Mirip Jamur (Oomycota, Myxomycota)"] },
          { name: "Fungi (Jamur)", subtopics: ["Ciri Umum & Struktur Hifa", "Zygomycota, Ascomycota, Basidiomycota, Deuteromycota", "Mikoriza & Lichenes (Simbiosis Mutualisme)", "Peran Fungi di Bidang Pangan & Medis"] },
          { name: "Plantae (Tumbuhan)", subtopics: ["Tumbuhan Lumut (Bryophyta) & Daur Hidupnya", "Tumbuhan Paku (Pteridophyta) & Daur Hidupnya", "Tumbuhan Berbiji (Spermatophyta: Gymnospermae & Angiospermae)", "Manfaat Tumbuhan"] },
          { name: "Animalia (Hewan)", subtopics: ["Invertebrata (Porifera, Cnidaria, Platyhelminthes, Nematoda, Annelida, Mollusca, Arthropoda, Echinodermata)", "Vertebrata (Pisces, Amphibia, Reptilia, Aves, Mammalia)"] },
          { name: "Ekologi & Perubahan Lingkungan", subtopics: ["Komponen Ekosistem & Interaksi (Rantai, Jaring, Piramida Ekologi)", "Daur Biogeokimia (Karbon, Air, Nitrogen, Fosfor, Sulfur)", "Pencemaran Lingkungan & Penanganannya", "Pemanasan Global, Efek Rumah Kaca, Penipisan Ozon"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Tenses Review", subtopics: ["Present (Simple, Continuous, Perfect)", "Past (Simple, Continuous, Perfect)", "Future (Will, Be going to, Continuous)", "Passive Voice Analysis"] },
          { name: "Descriptive & Recount Text", subtopics: ["Describing historical places/tourist attractions", "Recounting historical events (Biographies)"] },
          { name: "Narrative Text", subtopics: ["Legends & Myths", "Analyzing Moral Values", "Direct vs Indirect Speech in Narrative"] },
          { name: "Announcement & Invitation", subtopics: ["Formal vs Informal Invitations", "School/Public Announcements"] },
          { name: "Expressing Intentions", subtopics: ["I would like to...", "I am going to...", "Plans and intentions"] }
        ]
      },
      {
        name: "Bahasa Indonesia",
        topics: [
          { name: "Teks Laporan Hasil Observasi (SMA)", subtopics: ["Menganalisis isi & struktur LHO tingkat lanjut", "Kaidah kebahasaan (Afiksasi, Frasa Nomina/Verba, Kalimat Kompleks/Simpleks)"] },
          { name: "Teks Eksposisi (SMA)", subtopics: ["Struktur Tesis, Argumentasi, Penegasan Ulang", "Menulis esai argumentatif/eksposisi", "Pronomina, Nomina, Adjektiva, Verba"] },
          { name: "Teks Anekdot", subtopics: ["Struktur Anekdot (Abstraksi, Orientasi, Krisis, Reaksi, Koda)", "Makna tersirat/Kritikan dalam Anekdot", "Menulis Anekdot yang menyentil tapi santun"] },
          { name: "Hikayat & Cerpen", subtopics: ["Karakteristik Hikayat (Kemustahilan, Kesaktian, Anonim, Istanasentris)", "Nilai-nilai dalam Hikayat (Moral, Agama, Sosial)", "Membandingkan Hikayat dengan Cerpen Modern"] },
          { name: "Teks Negosiasi", subtopics: ["Struktur Negosiasi (Orientasi, Pengajuan, Penawaran, Persetujuan)", "Kalimat Persuasif & Sopan santun tawar-menawar", "Mendemonstrasikan negosiasi bisnis/konflik"] },
          { name: "Teks Biografi", subtopics: ["Struktur (Orientasi, Kejadian Penting, Reorientasi)", "Karakter Unggul Tokoh", "Penggunaan Pronomina Persona Ketiga & Kata Kerja Tindakan"] },
          { name: "Puisi (Batin & Fisik)", subtopics: ["Diksi, Imaji, Kata Konkret, Majas, Rima/Ritma", "Tema, Perasaan, Nada, Amanat", "Musikalisasi Puisi & Mendemonstrasikan Puisi"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Penyesuaian Sistem SKS/Fase SMA", subtopics: ["Pertemuan 1: Memahami Kurikulum Merdeka (Fase E)", "Pertemuan 2: Tanggung Jawab Belajar Mandiri"] },
          { name: "Bulan 2: Pengenalan Potensi Karir", subtopics: ["Pertemuan 1: Tes Kepribadian (MBTI/Holland) dan Karir", "Pertemuan 2: Pemetaan Jurusan Kuliah vs Pekerjaan"] },
          { name: "Bulan 3: Digital Productivity Tools", subtopics: ["Pertemuan 1: Manajemen Proyek dengan Notion/Trello", "Pertemuan 2: Kolaborasi Canggih dengan Google Workspace"] },
          { name: "Bulan 4: Keterampilan Riset & Penulisan Makalah", subtopics: ["Pertemuan 1: Cara Mencari Jurnal/Sumber Valid di Internet", "Pertemuan 2: Format Penulisan Sitasi/Daftar Pustaka"] },
          { name: "Bulan 5: Kepemimpinan & Organisasi (OSIS/Ekskul)", subtopics: ["Pertemuan 1: Cara Menyusun Proposal Kegiatan", "Pertemuan 2: Memimpin Rapat yang Efektif"] },
          { name: "Bulan 6: Literasi Keuangan (Manajemen Anggaran)", subtopics: ["Pertemuan 1: Membuat Anggaran Bulanan (Budgeting)", "Pertemuan 2: Menghindari Perangkap Pinjol/Paylater (Edukasi)"] },
          { name: "Bulan 7: Public Speaking (Debat Formal)", subtopics: ["Pertemuan 1: Struktur Argumen (A-R-E-L)", "Pertemuan 2: Menanggapi Interupsi (Point of Information)"] },
          { name: "Bulan 8: Etika Profesional Dasar", subtopics: ["Pertemuan 1: Cara Mengirim Email Formal", "Pertemuan 2: Etika Berkomunikasi di Lingkungan Kerja/Magang"] },
          { name: "Bulan 9: Basic Data Analysis", subtopics: ["Pertemuan 1: Pengolahan Data Kuesioner dengan Excel/Google Sheets", "Pertemuan 2: Membuat Grafik Data yang Menarik (Data Viz)"] },
          { name: "Bulan 10: Kecerdasan Emosional (EQ)", subtopics: ["Pertemuan 1: Kesadaran Sosial dan Empati Mendalam", "Pertemuan 2: Manajemen Resolusi Konflik Tingkat Lanjut"] },
          { name: "Bulan 11: Pemahaman Isu Global", subtopics: ["Pertemuan 1: Memahami SDGs (Sustainable Development Goals)", "Pertemuan 2: Diskusi Isu Lingkungan dan Ekonomi Global"] },
          { name: "Bulan 12: Evaluasi Minat Pemilihan Mata Pelajaran", subtopics: ["Pertemuan 1: Refleksi Nilai Rapor dan Minat Bakat", "Pertemuan 2: Memilih Mata Pelajaran Pilihan untuk Kelas 11 (Fase F)"] }
        ]
      }
    ]
  },
  {
    level: "Kelas 11 SMA/K",
    subjects: [
      {
        name: "Matematika Wajib",
        topics: [
          { name: "Induksi Matematika", subtopics: ["Prinsip Induksi Matematika", "Penerapan Induksi pada Barisan Bilangan", "Penerapan Induksi pada Keterbagian"] },
          { name: "Program Linear", subtopics: ["Sistem Pertidaksamaan Linear Dua Variabel", "Fungsi Objektif & Nilai Optimum (Maks/Min)", "Model Matematika dari Masalah Kontekstual", "Garis Selidik"] },
          { name: "Matriks", subtopics: ["Konsep, Kesamaan, & Transpose Matriks", "Operasi Matriks (Penjumlahan, Pengurangan, Perkalian Skalar, Perkalian Matriks)", "Determinan Matriks (Ordo 2x2 & 3x3 Sarrus/Kofaktor)", "Invers Matriks Ordo 2x2 & 3x3", "Penyelesaian SPLDV & SPLTV dengan Matriks (Aturan Cramer)"] },
          { name: "Transformasi Geometri (Matriks)", subtopics: ["Translasi, Refleksi, Rotasi, Dilatasi dengan Matriks", "Komposisi Transformasi dengan Perkalian Matriks", "Luas Bayangan Bangun oleh Matriks Transformasi"] },
          { name: "Barisan & Deret", subtopics: ["Barisan & Deret Aritmatika", "Barisan & Deret Geometri", "Deret Geometri Tak Hingga", "Aplikasi (Bunga Majemuk, Anuitas, Pertumbuhan, Peluruhan)"] },
          { name: "Limit Fungsi Aljabar", subtopics: ["Konsep Limit Mendekati Suatu Titik", "Limit Bentuk Tentu & Tak Tentu (0/0)", "Metode Substitusi, Pemfaktoran, Akar Sekawan"] },
          { name: "Turunan Fungsi Aljabar", subtopics: ["Konsep Turunan (Limit h->0)", "Aturan Turunan (Pangkat, Penjumlahan, Perkalian u.v, Pembagian u/v)", "Aturan Rantai", "Aplikasi Turunan (Gradien Garis Singgung, Fungsi Naik/Turun, Titik Stasioner, Nilai Maks/Min)"] },
          { name: "Integral Tak Tentu Fungsi Aljabar", subtopics: ["Integral sebagai Anti-Turunan", "Rumus Dasar Integral Aljabar", "Sifat-sifat Integral Tak Tentu"] }
        ]
      },
      {
        name: "Matematika Peminatan (IPA)",
        topics: [
          { name: "Persamaan Trigonometri", subtopics: ["Persamaan Trigonometri Dasar (Sin x = Sin a, Cos x = Cos a, Tan x = Tan a)", "Persamaan Trigonometri Bentuk Kuadrat", "Penyelesaian Persamaan a cos x + b sin x = c"] },
          { name: "Rumus Jumlah & Selisih Sudut Trigonometri", subtopics: ["Rumus Sin(A+B), Cos(A+B), Tan(A+B)", "Rumus Sudut Ganda (Sin 2A, Cos 2A, Tan 2A)", "Rumus Sudut Pertengahan", "Rumus Perkalian Sinus dan Cosinus", "Rumus Penjumlahan & Pengurangan Sinus dan Cosinus"] },
          { name: "Lingkaran", subtopics: ["Persamaan Lingkaran Pusat (0,0) dan (a,b)", "Bentuk Umum Persamaan Lingkaran (x² + y² + Ax + By + C = 0)", "Posisi Titik dan Garis terhadap Lingkaran", "Persamaan Garis Singgung Lingkaran (Diketahui Titik, Gradien, Titik di Luar)"] },
          { name: "Polinomial (Suku Banyak)", subtopics: ["Operasi Aljabar pada Polinomial", "Nilai Polinomial (Substitusi & Skema Horner)", "Teorema Sisa (Dibagi x-k, ax-b, Kuadrat)", "Teorema Faktor", "Persamaan Polinomial & Akar-akarnya (Teorema Vieta)"] }
        ]
      },
      {
        name: "Fisika",
        topics: [
          { name: "Dinamika Rotasi & Kesetimbangan Benda Tegar", subtopics: ["Torsi (Momen Gaya) τ = F x r", "Momen Inersia (I = mr²)", "Hukum II Newton pada Gerak Rotasi (τ = I.α)", "Energi Kinetik Rotasi & Menggelinding", "Momentum Sudut (L = I.ω)", "Titik Berat Benda", "Syarat Kesetimbangan Benda Tegar (ΣF=0, Στ=0)"] },
          { name: "Elastisitas & Hukum Hooke", subtopics: ["Tegangan (Stress), Regangan (Strain), Modulus Young", "Hukum Hooke pada Pegas (F = k.Δx)", "Susunan Pegas Seri & Paralel", "Energi Potensial Pegas"] },
          { name: "Fluida Statis", subtopics: ["Tekanan Hidrostatis (P = ρ.g.h)", "Hukum Utama Hidrostatis (Pipa U)", "Hukum Pascal (P1 = P2)", "Hukum Archimedes (Gaya Apung Fa = ρ.g.V)", "Tegangan Permukaan, Meniskus, Kapilaritas", "Viskositas & Hukum Stokes (Kecepatan Terminal)"] },
          { name: "Fluida Dinamis", subtopics: ["Debit Fluida (Q = V/t = A.v)", "Persamaan Kontinuitas (A1.v1 = A2.v2)", "Asas Bernoulli (P + ½ρv² + ρgh = konstan)", "Penerapan Bernoulli (Teorema Torricelli, Venturimeter, Tabung Pitot, Gaya Angkat Sayap Pesawat)"] },
          { name: "Suhu, Kalor, & Perpindahan Kalor", subtopics: ["Pemuaian (Zat Padat, Cair, Gas)", "Kalor Jenis, Kapasitas Kalor, Perubahan Wujud", "Asas Black", "Laju Perpindahan Kalor (Konduksi, Konveksi, Radiasi Hukum Stefan-Boltzmann)"] },
          { name: "Teori Kinetik Gas", subtopics: ["Hukum Boyle-Gay Lussac & Persamaan Gas Ideal (PV = nRT)", "Tekanan Gas Ideal (Teori Kinetik)", "Suhu & Energi Kinetik Rata-rata Gas (Ek = 3/2 kT)", "Kecepatan Efektif Gas (vRMS)", "Derajat Kebebasan & Teorema Ekipartisi Energi"] },
          { name: "Termodinamika", subtopics: ["Usaha pada Proses Termodinamika (Isotermik, Isokhorik, Isobarik, Adiabatik)", "Hukum I Termodinamika (Q = W + ΔU)", "Kapasitas Kalor Gas (Cp dan Cv)", "Hukum II Termodinamika (Entropi)", "Siklus Carnot & Efisiensi Mesin Kalor", "Mesin Pendingin (Koefisien Performansi)"] },
          { name: "Gelombang Mekanik", subtopics: ["Sifat-sifat Gelombang (Refleksi, Refraksi, Difraksi, Interferensi, Polarisasi)", "Persamaan Gelombang Berjalan (y = A sin(ωt ± kx))", "Fase & Beda Fase Gelombang", "Gelombang Stasioner (Ujung Terikat & Ujung Bebas)"] },
          { name: "Gelombang Bunyi & Cahaya", subtopics: ["Cepat Rambat Bunyi (Zat Padat, Cair, Gas)", "Dawai & Pipa Organa (Terbuka/Tertutup)", "Intensitas & Taraf Intensitas Bunyi (TI)", "Efek Doppler", "Interferensi Cahaya (Celah Ganda Young, Selaput Tipis)", "Difraksi Cahaya (Celah Tunggal, Kisi)", "Polarisasi Cahaya"] },
          { name: "Alat Optik (Lanjut)", subtopics: ["Mata & Kacamata (Miopi, Hipermetropi, Presbiopi)", "Lup (Mata Berakomodasi & Tak Berakomodasi)", "Mikroskop (Perbesaran & Panjang Tubus)", "Teropong (Bintang, Bumi)"] }
        ]
      },
      {
        name: "Kimia",
        topics: [
          { name: "Senyawa Hidrokarbon", subtopics: ["Kekhasan Atom Karbon", "Atom C Primer, Sekunder, Tersier, Kuartener", "Alkana, Alkena, Alkuna (Tata Nama IUPAC, Sifat Fisik)", "Isomer (Rangka, Posisi, Geometri Cis-Trans)", "Reaksi Hidrokarbon (Oksidasi/Pembakaran, Substitusi, Adisi Markovnikov, Eliminasi)"] },
          { name: "Minyak Bumi", subtopics: ["Proses Pembentukan & Fraksi Minyak Bumi (Distilasi Bertingkat)", "Bensin (Bilangan Oktan, TEL, MTBE)", "Dampak Pembakaran Bahan Bakar & Asap Kabut (Smog)"] },
          { name: "Termokimia", subtopics: ["Sistem & Lingkungan, Reaksi Eksoterm & Endoterm", "Persamaan Termokimia & Jenis-jenis ΔH Standar (Pembentukan, Penguraian, Pembakaran)", "Penentuan ΔH Berdasarkan Kalorimetri (Q = mcΔT)", "Penentuan ΔH Berdasarkan Hukum Hess", "Penentuan ΔH Berdasarkan Data Entalpi Pembentukan (ΔHf)", "Penentuan ΔH Berdasarkan Energi Ikatan Rata-rata"] },
          { name: "Laju Reaksi", subtopics: ["Molaritas (M)", "Konsep Laju Reaksi (Berkurangnya Reaktan / Bertambahnya Produk)", "Teori Tumbukan & Energi Aktivasi", "Faktor-faktor yang Mempengaruhi Laju (Konsentrasi, Luas Permukaan, Suhu, Katalis)", "Persamaan Laju Reaksi & Orde Reaksi (Dari Data Eksperimen)"] },
          { name: "Kesetimbangan Kimia", subtopics: ["Kesetimbangan Dinamis & Reaksi Reversibel", "Tetapan Kesetimbangan Konsentrasi (Kc)", "Tetapan Kesetimbangan Tekanan (Kp)", "Hubungan Kc dan Kp", "Pergeseran Kesetimbangan (Asas Le Chatelier: Konsentrasi, Volume, Tekanan, Suhu)", "Perhitungan Kesetimbangan (Derajat Disosiasi)"] },
          { name: "Asam Basa", subtopics: ["Teori Asam Basa (Arrhenius, Bronsted-Lowry, Lewis)", "Indikator Asam Basa & Trayek pH", "Perhitungan pH Asam Kuat, Basa Kuat", "Perhitungan pH Asam Lemah, Basa Lemah (Ka, Kb, Derajat Ionisasi)"] },
          { name: "Hidrolisis Garam", subtopics: ["Jenis-jenis Garam (Sifat Asam/Basa/Netral)", "Reaksi Hidrolisis Kation / Anion", "Perhitungan pH Larutan Garam"] },
          { name: "Larutan Penyangga (Buffer)", subtopics: ["Komponen Buffer Asam & Buffer Basa", "Prinsip Kerja Larutan Penyangga", "Perhitungan pH Larutan Penyangga (Persamaan Henderson-Hasselbalch)", "Peran Buffer dalam Tubuh (Darah, Air Liur)"] },
          { name: "Titrasi Asam Basa", subtopics: ["Konsep Titrasi (Titran, Titrat, Titik Ekivalen, Titik Akhir Titrasi)", "Kurva Titrasi (Kuat-Kuat, Kuat-Lemah)", "Perhitungan Kadar Zat Berdasarkan Titrasi"] },
          { name: "Kelarutan & Hasil Kali Kelarutan (Ksp)", subtopics: ["Kelarutan (s)", "Tetapan Hasil Kali Kelarutan (Ksp)", "Hubungan s dan Ksp", "Pengaruh Ion Senama terhadap Kelarutan", "Memprediksi Terbentuknya Endapan (Qc vs Ksp)"] },
          { name: "Sistem Koloid", subtopics: ["Larutan, Koloid, Suspensi", "Jenis-jenis Koloid (Aerosol, Emulsi, Buih, Sol, Gel)", "Sifat Koloid (Efek Tyndall, Gerak Brown, Adsorpsi, Koagulasi, Dialisis, Elektroforesis)", "Koloid Pelindung & Koloid Liofil/Liofob", "Pembuatan Koloid (Kondensasi & Dispersi)"] }
        ]
      },
      {
        name: "Biologi",
        topics: [
          { name: "Sel", subtopics: ["Sejarah Penemuan Sel & Teori Sel", "Sel Prokariotik vs Eukariotik", "Struktur & Fungsi Organel Sel (Nukleus, Mitokondria, Ribosom, RE, Badan Golgi, Lisosom, Kloroplas, Vakuola, Sitoskeleton)", "Perbedaan Sel Hewan & Tumbuhan", "Transpor Membran (Difusi, Difusi Terfasilitasi, Osmosis, Transpor Aktif, Endositosis, Eksositosis)"] },
          { name: "Jaringan Tumbuhan", subtopics: ["Jaringan Meristem (Primer & Sekunder/Kambium)", "Jaringan Permanen (Epidermis, Parenkim, Kolenkim, Sklerenkim)", "Jaringan Pengangkut (Xilem & Floem)", "Organ Tumbuhan (Akar, Batang, Daun, Bunga, Buah, Biji)", "Totipotensi & Kultur Jaringan Tumbuhan"] },
          { name: "Jaringan Hewan", subtopics: ["Jaringan Epitel (Bentuk & Fungsi)", "Jaringan Ikat (Longgar, Padat, Tulang Rawan, Tulang Keras, Darah, Limfa)", "Jaringan Otot (Polos, Lurik, Jantung)", "Jaringan Saraf (Neuron, Neuroglia)"] },
          { name: "Sistem Gerak", subtopics: ["Tulang Pembentuk Rangka Aksial & Apendikular", "Mekanisme Pembentukan Tulang (Osifikasi)", "Jenis Persendian (Diartrosis, Amfiartrosis, Sinartrosis)", "Struktur Otot Sarkomer", "Mekanisme Kontraksi Otot (Aktin, Miosin, ATP, Kalsium)", "Gangguan Sistem Gerak (Artritis, Fraktura, Atrofi, Tetanus)"] },
          { name: "Sistem Peredaran Darah", subtopics: ["Plasma Darah & Sel Darah (Eritrosit, Leukosit, Trombosit)", "Mekanisme Pembekuan Darah", "Penggolongan Darah (ABO & Rhesus) serta Transfusi", "Anatomi Jantung (Atrium, Ventrikel, Katup)", "Sistem Peredaran Darah Pulmonalis & Sistemik", "Sistem Limfatik", "Gangguan (Hemofilia, Anemia, Leukemia, Jantung Koroner, Stroke)"] },
          { name: "Sistem Pencernaan", subtopics: ["Kandungan Zat Makanan (Karbohidrat, Protein, Lemak, Vitamin, Mineral, BMI)", "Saluran Pencernaan (Mulut hingga Anus)", "Kelenjar Pencernaan (Hati, Pankreas, Kelenjar Saliva)", "Proses Pencernaan Mekanik & Kimiawi (Enzim)", "Pencernaan Ruminansia (Sapi)", "Gangguan (Maag, Diare, Sembelit, Apendisitis)"] },
          { name: "Sistem Pernapasan", subtopics: ["Struktur Organ Pernapasan (Hidung, Faring, Laring, Trakea, Bronkus, Alveolus)", "Mekanisme Inspirasi & Ekspirasi (Pernapasan Dada & Perut)", "Kapasitas Paru-paru (Tidal, Cadangan Inspirasi/Ekspirasi, Residu, Vital, Total)", "Mekanisme Pertukaran Gas (O2 dan CO2)", "Bahaya Rokok & Gangguan Pernapasan (Asma, TBC, Pnemonia, Asfiksi)"] },
          { name: "Sistem Ekskresi", subtopics: ["Struktur & Fungsi Ginjal (Nefron, Kapsula Bowman, Glomerulus, Tubulus)", "Proses Pembentukan Urine (Filtrasi, Reabsorpsi, Augmentasi)", "Faktor Pengaruh Produksi Urine (ADH)", "Kulit, Paru-paru, Hati (Siklus Ornitin)", "Gangguan Ginjal (Nefritis, Albuminuria, Hematuria, Gagal Ginjal)"] },
          { name: "Sistem Koordinasi (Saraf & Hormon)", subtopics: ["Struktur Sel Saraf (Neuron, Sinapsis)", "Mekanisme Penghantaran Impuls (Gerak Sadar & Refleks)", "Sistem Saraf Pusat (Otak, Sumsum Tulang Belakang) & Tepi", "Sistem Endokrin (Kelenjar Hipofisis, Tiroid, Adrenal, Pankreas, Gonad) dan Hormonnya", "NAPZA & Dampaknya terhadap Sistem Saraf"] },
          { name: "Sistem Indera", subtopics: ["Mata (Retina, Lensa, Fotoreseptor)", "Telinga (Membran Timpani, Tulang Pendengaran, Koklea)", "Kulit, Hidung, Lidah (Kemoreseptor, Mekanoreseptor)"] },
          { name: "Sistem Reproduksi", subtopics: ["Alat Reproduksi Pria & Spermatogenesis", "Alat Reproduksi Wanita & Oogenesis", "Siklus Menstruasi (Hormon FSH, LH, Estrogen, Progesteron)", "Fertilisasi, Kehamilan, Persalinan", "ASI Eksklusif & Keluarga Berencana (KB)", "Penyakit Menular Seksual"] },
          { name: "Sistem Imunitas (Kekebalan Tubuh)", subtopics: ["Pertahanan Nonspesifik (Kulit, Membran Mukosa, Fagositosis, Inflamasi)", "Pertahanan Spesifik (Sel B / Antibodi & Sel T)", "Imunitas Aktif & Pasif (Vaksin & Serum)", "Gangguan Sistem Imun (Alergi, Autoimun, HIV/AIDS)"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Analytical Exposition Text", subtopics: ["Generic Structure (Thesis, Arguments, Reiteration)", "Language Features (Internal conjunctions, Causal conjunctions)", "Formulating strong arguments"] },
          { name: "Personal Letter", subtopics: ["Structure of Personal Letter", "Formal vs Informal Language", "Replying to a letter"] },
          { name: "Cause and Effect", subtopics: ["Because of, Due to, Owing to, Thanks to", "Because, Since, As, For", "Writing Cause and Effect essays"] },
          { name: "Explanation Text", subtopics: ["Generic Structure (General statement, Sequenced explanation)", "Passive Voice usage in Explanation text", "Explaining natural and social phenomena"] },
          { name: "Passive Voice (Advanced)", subtopics: ["Passive voice in Perfect Tenses", "Passive voice with Modals", "Causative Verbs (Have/Get something done)"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Fokus Penjurusan & Perencanaan Kuliah", subtopics: ["Pertemuan 1: Menyelaraskan Pilihan Mata Pelajaran dengan Jurusan PTN", "Pertemuan 2: Mengenal Jalur SNBP, SNBT, dan Mandiri"] },
          { name: "Bulan 2: Kewirausahaan & Inovasi (Start-Up Mindset)", subtopics: ["Pertemuan 1: Membuat Business Model Canvas (BMC)", "Pertemuan 2: Pitching Ide Bisnis"] },
          { name: "Bulan 3: Persiapan UTBK (Literasi Bahasa & Penalaran)", subtopics: ["Pertemuan 1: Strategi Mengerjakan Penalaran Umum", "Pertemuan 2: Literasi Bahasa Indonesia & Inggris Tingkat Lanjut"] },
          { name: "Bulan 4: Keterampilan Desain Grafis / UI/UX Dasar", subtopics: ["Pertemuan 1: Prinsip UI/UX Aplikasi", "Pertemuan 2: Membuat Prototyping di Figma"] },
          { name: "Bulan 5: Critical Thinking (Pemecahan Kasus Nyata)", subtopics: ["Pertemuan 1: Analisis Kasus (Case Study Analysis)", "Pertemuan 2: Menggunakan Kerangka Fishbone / 5 Whys"] },
          { name: "Bulan 6: Literasi Investasi (Saham & Reksadana Dasar)", subtopics: ["Pertemuan 1: Mengenal Profil Risiko Investasi", "Pertemuan 2: Cara Kerja Reksadana dan Saham Secara Sederhana"] },
          { name: "Bulan 7: Copywriting & Content Marketing", subtopics: ["Pertemuan 1: Seni Menulis untuk Menjual (Copywriting)", "Pertemuan 2: Strategi Konten di Instagram/TikTok"] },
          { name: "Bulan 8: Karya Tulis Ilmiah (KTI)", subtopics: ["Pertemuan 1: Menentukan Latar Belakang dan Rumusan Masalah", "Pertemuan 2: Metodologi Penelitian Sederhana"] },
          { name: "Bulan 9: Kesehatan Mental & Manajemen Burnout", subtopics: ["Pertemuan 1: Menyeimbangkan Akademik, Organisasi, dan Kehidupan Pribadi", "Pertemuan 2: Kapan Harus Mencari Bantuan Profesional?"] },
          { name: "Bulan 10: Pengenalan Dunia Kerja & CV", subtopics: ["Pertemuan 1: Membangun Profil LinkedIn untuk Siswa", "Pertemuan 2: Membuat Curriculum Vitae (CV) ATS Friendly"] },
          { name: "Bulan 11: Simulasi Wawancara (Beasiswa / Kampus)", subtopics: ["Pertemuan 1: Menjawab Pertanyaan Situasional (STAR Method)", "Pertemuan 2: Latihan Mock Interview"] },
          { name: "Bulan 12: Pemantapan Pilihan Jurusan", subtopics: ["Pertemuan 1: Riset Passing Grade dan Ketetatan PTN", "Pertemuan 2: Konsolidasi Rencana A, B, dan C"] }
        ]
      }
    ]
  },
  {
    level: "Kelas 12 SMA/K",
    subjects: [
      {
        name: "Matematika Wajib",
        topics: [
          { name: "Geometri Ruang (Dimensi Tiga)", subtopics: ["Kedudukan Titik, Garis, dan Bidang dalam Ruang", "Jarak Titik ke Titik (Diagonal Sisi, Diagonal Ruang Kubus/Balok)", "Jarak Titik ke Garis", "Jarak Titik ke Bidang (Proyeksi ortogonal)", "Sudut Antara Garis dan Bidang", "Sudut Antara Bidang dan Bidang"] },
          { name: "Statistika Dasar & Data Berkelompok", subtopics: ["Penyajian Data Berkelompok (Tabel Distribusi Frekuensi, Histogram, Poligon, Ogive)", "Ukuran Pemusatan Data Berkelompok (Rata-rata/Mean, Median, Modus)", "Ukuran Letak Data Berkelompok (Kuartil, Desil, Persentil)", "Ukuran Penyebaran Data Berkelompok (Simpangan Rata-rata, Ragam/Varians, Simpangan Baku/Standar Deviasi)"] },
          { name: "Kaidah Pencacahan", subtopics: ["Aturan Penjumlahan & Aturan Perkalian (Filling Slots)", "Faktorial (n!)", "Permutasi dari Unsur yang Berbeda (P(n,r))", "Permutasi dengan Unsur yang Sama", "Permutasi Siklis", "Kombinasi (C(n,r))"] },
          { name: "Peluang Kejadian Majemuk", subtopics: ["Peluang Suatu Kejadian", "Komplemen Suatu Kejadian", "Peluang Kejadian Saling Lepas (P(A U B))", "Peluang Kejadian Saling Bebas (P(A ∩ B))", "Peluang Kejadian Bersyarat"] }
        ]
      },
      {
        name: "Matematika Peminatan (IPA)",
        topics: [
          { name: "Limit Fungsi Trigonometri", subtopics: ["Teorema Limit Trigonometri (sin x / x = 1)", "Limit Trigonometri dengan Manipulasi Aljabar & Identitas", "Limit Trigonometri dengan Rumus Sudut Ganda / Jumlah Selisih"] },
          { name: "Limit di Ketakhinggaan", subtopics: ["Limit Fungsi Aljabar di Ketakhinggaan (Polinomial & Pecahan rasional)", "Limit Bentuk Akar di Ketakhinggaan (√ax²+bx+c - √px²+qx+r)", "Limit Fungsi Trigonometri di Ketakhinggaan (Substitusi y = 1/x)"] },
          { name: "Turunan Fungsi Trigonometri", subtopics: ["Rumus Dasar Turunan Sin, Cos, Tan, Sec, Csc, Cot", "Aturan Rantai pada Fungsi Trigonometri", "Turunan Implisit"] },
          { name: "Aplikasi Turunan Fungsi Trigonometri", subtopics: ["Persamaan Garis Singgung & Garis Normal Kurva Trigonometri", "Kemonotonan (Fungsi Naik/Turun)", "Nilai Maksimum & Minimum, Titik Balik, Titik Belok", "Kecekungan Kurva"] },
          { name: "Integral Tak Tentu & Tentu Trigonometri", subtopics: ["Integral Dasar Trigonometri", "Metode Substitusi Trigonometri", "Integral Parsial"] },
          { name: "Aplikasi Integral", subtopics: ["Luas Daerah yang Dibatasi Kurva", "Volume Benda Putar (Metode Cakram & Cincin)"] },
          { name: "Distribusi Binomial", subtopics: ["Variabel Acak Diskrit & Kontinu", "Fungsi Peluang Variabel Acak Diskrit", "Distribusi Probabilitas Binomial", "Nilai Harapan & Varians Binomial"] },
          { name: "Distribusi Normal", subtopics: ["Kurva Distribusi Normal", "Distribusi Normal Standar (Kurva Z)", "Membaca Tabel Z", "Penerapan Distribusi Normal dalam Masalah Kontekstual"] }
        ]
      },
      {
        name: "Fisika",
        topics: [
          { name: "Listrik Searah (DC)", subtopics: ["Hukum Ohm & Hambatan Jenis Kawat", "Rangkaian Seri, Paralel, & Jembatan Wheatstone", "Hukum I & II Kirchhoff (Rangkaian 1 dan 2 Loop)", "Energi & Daya Listrik"] },
          { name: "Listrik Statis", subtopics: ["Gaya Coulomb (F = k.Q1.Q2/r²)", "Medan Listrik (E = k.Q/r²)", "Energi Potensial Listrik & Potensial Listrik (V = k.Q/r)", "Usaha untuk Memindahkan Muatan", "Kapasitor Keping Sejajar (Kapasitas, Energi, Susunan Seri & Paralel)"] },
          { name: "Medan Magnet", subtopics: ["Hukum Biot-Savart", "Medan Magnet di Sekitar Kawat Lurus & Melingkar", "Medan Magnet pada Solenoida & Toroida", "Gaya Lorentz pada Kawat Berarus & Muatan Bergerak (Kaidah Tangan Kanan)", "Gaya Lorentz Antara Dua Kawat Sejajar"] },
          { name: "Induksi Elektromagnetik", subtopics: ["Fluks Magnetik", "Hukum Faraday (GGL Induksi E = -N dΦ/dt) & Hukum Lenz", "GGL Induksi pada Kawat Memotong Medan Magnet (E = B.l.v)", "Generator AC/DC & Transformator", "Induktor & GGL Induksi Diri (Henry)"] },
          { name: "Rangkaian Arus Bolak-Balik (AC)", subtopics: ["Tegangan & Arus Maksimum, Efektif (RMS)", "Fasor (Diagram Vektor)", "Resistor, Induktor (Reaktansi Induktif XL), Kapasitor (Reaktansi Kapasitif XC) pada Rangkaian AC", "Rangkaian Seri RLC & Impedansi (Z)", "Resonansi (Frekuesi Resonansi)", "Daya pada Rangkaian AC (Faktor Daya cos θ)"] },
          { name: "Radiasi Elektromagnetik", subtopics: ["Spektrum Gelombang Elektromagnetik (Radio, Mikro, Inframerah, Cahaya Tampak, UV, X-Ray, Gamma)", "Sifat & Pemanfaatan GEM dalam Kehidupan", "Bahaya Radiasi GEM"] },
          { name: "Teori Relativitas Khusus", subtopics: ["Postulat Einstein", "Transformasi Lorentz & Penjumlahan Kecepatan Relativistik", "Dilatasi Waktu (Waktu Relativistik)", "Kontraksi Panjang", "Massa, Momentum, & Energi Relativistik (E = mc²)"] },
          { name: "Fenomena Kuantum", subtopics: ["Radiasi Benda Hitam & Hukum Pergeseran Wien", "Teori Kuantum Planck (E = h.f)", "Efek Fotolistrik (Fungsi Kerja, Energi Kinetik Maksimum, Potensial Henti)", "Efek Compton (Hamburan Foton)", "Sifat Gelombang dari Partikel (Hipotesis de Broglie)"] },
          { name: "Inti Atom & Radioaktivitas", subtopics: ["Struktur Inti Atom (Proton, Neutron, Gaya Inti)", "Defek Massa & Energi Ikat Inti (E = Δm.931 MeV)", "Radioaktivitas (Peluruhan Alfa, Beta, Gamma)", "Waktu Paruh & Aktivitas Radioaktif", "Reaksi Fisi (Pembelahan) & Fusi (Penggabungan)", "Reaktor Nuklir & Pemanfaatan Radioisotop"] },
          { name: "Penyimpanan & Transmisi Data (Digital)", subtopics: ["Teknologi Analog vs Digital", "Prinsip Penyimpanan Data (Hardisk, Flashdisk, CD)", "Prinsip Transmisi Data (Fiber Optik, Satelit)"] }
        ]
      },
      {
        name: "Kimia",
        topics: [
          { name: "Sifat Koligatif Larutan", subtopics: ["Satuan Konsentrasi (Molaritas, Molalitas, Fraksi Mol)", "Penurunan Tekanan Uap (ΔP) & Hukum Raoult", "Kenaikan Titik Didih (ΔTb) & Penurunan Titik Beku (ΔTf)", "Tekanan Osmotik (π)", "Sifat Koligatif Larutan Elektrolit (Faktor Van't Hoff / i)", "Penerapan Sifat Koligatif (Anti beku, Desalinasi, Cairan Infus)"] },
          { name: "Redoks & Sel Elektrokimia", subtopics: ["Penyetaraan Persamaan Reaksi Redoks (Metode Biloks & Setengah Reaksi pada suasana Asam/Basa)", "Sel Volta/Galvani (Anoda, Katoda, Jembatan Garam)", "Potensial Elektroda Standar (E°) & Potensial Sel (E°sel)", "Deret Volta & Spontanitas Reaksi", "Aplikasi Sel Volta (Baterai Kering, Aki, Sel Bahan Bakar)", "Korosi & Cara Pencegahannya (Perlindungan Katodik)"] },
          { name: "Sel Elektrolisis", subtopics: ["Prinsip Sel Elektrolisis (Energi Listrik -> Reaksi Kimia)", "Reaksi di Katoda (Reduksi Kation) & Anoda (Oksidasi Anion/Elektroda)", "Hukum Faraday I (W = e.i.t/96500)", "Hukum Faraday II (W1/e1 = W2/e2)", "Aplikasi Elektrolisis (Penyepuhan, Pemurnian Logam)"] },
          { name: "Kimia Unsur", subtopics: ["Kelimpahan Unsur Utama & Transisi di Alam", "Gas Mulia (Gol VIII A) - Sifat, Pembuatan, Kegunaan", "Halogen (Gol VII A) - Daya Oksidator, Reaksi Pengeseran Halogen", "Alkali (Gol I A) & Alkali Tanah (Gol II A) - Reaksi nyala, Sifat Basa", "Unsur Periode 3 (Na hingga Ar) - Sifat Asam Basa, Pembuatan", "Unsur Transisi Periode 4 (Sc hingga Zn) - Sifat Magnetik, Ion Berwarna, Ion Kompleks", "Tata Nama Senyawa/Ion Kompleks"] },
          { name: "Senyawa Karbon Turunan Alkana", subtopics: ["Gugus Fungsi Senyawa Karbon", "Alkohol / Alkanol (Tata Nama, Isomer Primer/Sekunder/Tersier, Sifat, Oksidasi Alkohol)", "Eter / Alkoksi Alkana", "Aldehida / Alkanal (Uji Tollens & Fehling)", "Keton / Alkanon", "Asam Karboksilat / Asam Alkanoat", "Ester / Alkyl Alkanoat (Reaksi Esterifikasi, Hidrolisis, Saponifikasi/Penyabunan)", "Haloalkana (Pembuatan & Kegunaan CFC, Teflon)"] },
          { name: "Benzena & Turunannya", subtopics: ["Struktur & Resonansi Kekule Benzena", "Tata Nama Turunan Benzena (Toluena, Fenol, Anilin, Asam Benzoat, dll)", "Turunan Benzena Disubstitusi (Orto, Meta, Para)", "Reaksi Substitusi Benzena (Halogenasi, Nitrasi, Sulfonasi, Alkilasi)", "Kegunaan & Dampak Benzena"] },
          { name: "Makromolekul (Polimer)", subtopics: ["Konsep Polimerisasi (Monomer -> Polimer)", "Polimerisasi Adisi (Karet Alam, PVC, Teflon, Polietilena)", "Polimerisasi Kondensasi (Nilon, Dakron, Bakelit)", "Penggolongan Polimer (Alam vs Sintesis, Termoplas vs Termoset)"] },
          { name: "Biomolekul (Karbohidrat, Protein, Lemak)", subtopics: ["Karbohidrat: Monosakarida (Glukosa, Fruktosa), Disakarida (Sukrosa, Maltosa), Polisakarida (Amilum, Selulosa)", "Uji Karbohidrat (Molisch, Benedict, Iodin)", "Asam Amino (Esensial & Non-Esensial, Zwitter Ion)", "Protein (Ikatan Peptida, Denaturasi, Uji Biuret/Xantoproteat/Timbal asetat)", "Lipid / Lemak (Asam Lemak Jenuh & Tak Jenuh, Fosfolipid, Steroid)", "Angka Kolesterol & Dampak Kesehatan"] }
        ]
      },
      {
        name: "Biologi",
        topics: [
          { name: "Pertumbuhan & Perkembangan", subtopics: ["Konsep Tumbuh & Kembang (Kuantitatif vs Kualitatif)", "Perkecambahan (Epigeal & Hipogeal)", "Pertumbuhan Primer (Meristem Apikal) & Sekunder (Kambium, Lingkaran Tahun)", "Faktor Internal (Gen, Hormon: Auksin, Giberelin, Sitokinin, Gas Etilen, Asam Absisat)", "Faktor Eksternal (Cahaya, Suhu, Nutrisi, Air) & Etiolasi", "Pertumbuhan & Perkembangan Hewan (Fase Embrionik & Pasca-Embrionik, Metamorfosis, Metagenesis)"] },
          { name: "Enzim & Metabolisme", subtopics: ["Sifat-sifat Enzim (Biokatalisator, Spesifik, Thermolabil)", "Cara Kerja Enzim (Lock and Key vs Induced Fit)", "Faktor yang Mempengaruhi Kerja Enzim (Suhu, pH, Konsentrasi, Inhibitor Kompetitif & Non-Kompetitif)", "Metabolisme: Katabolisme & Anabolisme"] },
          { name: "Katabolisme", subtopics: ["Respirasi Aerob: Glikolisis (Sitosol)", "Dekarboksilasi Oksidatif & Siklus Krebs (Matriks Mitokondria)", "Transpor Elektron & Fosforilasi Oksidatif (Krista Mitokondria, Menghasilkan 36/38 ATP)", "Respirasi Anaerob: Fermentasi Asam Laktat (Otot Manusia, Bakteri)", "Respirasi Anaerob: Fermentasi Alkohol (Khamir/Saccharomyces)", "Keterkaitan Metabolisme Karbohidrat, Lemak, dan Protein"] },
          { name: "Anabolisme (Fotosintesis)", subtopics: ["Struktur Kloroplas (Tilakoid, Grana, Stroma)", "Reaksi Terang (Fotofosforilasi Siklik & Non-Siklik, Fotolisis Air, Menghasilkan ATP, NADPH, O2)", "Reaksi Gelap / Siklus Calvin (Fiksasi CO2, Reduksi, Regenerasi RuBP, Menghasilkan Glukosa)", "Tumbuhan C3, C4, dan CAM", "Kemosintesis (Bakteri Nitrifikasi, Belerang)"] },
          { name: "Substansi Genetika", subtopics: ["Kromosom (Struktur, Bentuk, Autosom & Gonosom, Karyotipe)", "Struktur DNA (Double Helix, Nukleotida, Basa Nitrogen Purin & Pirimidin)", "Struktur RNA (mRNA, tRNA, rRNA)", "Replikasi DNA (Teori Semikonservatif, Enzim Helikase, Polimerase, Ligase)", "Sintesis Protein: Transkripsi (Di Nukleus)", "Sintesis Protein: Translasi (Di Ribosom, Membaca Kodon)"] },
          { name: "Pembelahan Sel", subtopics: ["Siklus Sel (Interfase: G1, S, G2)", "Mitosis (Profase, Metafase, Anafase, Telofase) & Sitokinesis", "Meiosis I & Meiosis II (Reduksi Kromosom, Crossing Over / Pindah Silang)", "Perbedaan Mitosis & Meiosis", "Gametogenesis Hewan (Spermatogenesis & Oogenesis)", "Gametogenesis Tumbuhan Berbiji (Mikrosporogenesis & Megasporogenesis)"] },
          { name: "Hukum Mendel & Penyimpangan Semu", subtopics: ["Hukum I Mendel (Segregasi Bebas) & Persilangan Monohibrid", "Hukum II Mendel (Asortasi Bebas) & Persilangan Dihibrid (Rasio 9:3:3:1)", "Testcross & Backcross", "Penyimpangan Semu: Atavisme (Interaksi Gen) - Pial Ayam (9:3:3:1)", "Kriptomeri (Bunga Linaria, 9:3:4)", "Polimeri (Gandum, 15:1)", "Epistasis & Hipostasis (Gandum, 12:3:1)", "Komplementer (Bunga Lathyrus, 9:7)"] },
          { name: "Pola-pola Hereditas", subtopics: ["Tautan (Linkage) & Tautan Seks (Pautan Kromosom X & Y)", "Pindah Silang (Crossing Over) & Nilai Pindah Silang (NPS)", "Gagal Berpisah (Nondisjunction) & Sindrom Genetik (Down, Turner, Klinefelter)", "Gen Letal Dominan & Resesif"] },
          { name: "Hereditas pada Manusia", subtopics: ["Pedigree (Peta Silsilah Keluarga)", "Pewarisan Golongan Darah (Sistem ABO, Rhesus)", "Penyakit Menurun Autosom (Albino, PTC, Sickle Cell Anemia, Thalassemia)", "Penyakit Menurun Gonosom / Tautan X (Buta Warna, Hemofilia)", "Upaya Menghindari Penyakit Menurun (Eugenetika)"] },
          { name: "Mutasi", subtopics: ["Pengertian Mutasi & Mutan, Mutasi Alami vs Buatan", "Mutasi Titik / Gen (Substitusi: Transisi, Transversi; Insersi, Delesi)", "Dampak Mutasi Gen (Silent, Missense, Nonsense, Frameshift Mutation)", "Mutasi Kromosom / Aberasi (Delesi, Duplikasi, Inversi, Translokasi)", "Mutasi Jumlah Kromosom (Aneuploidi: Monosomi, Trisomi; Euploidi: Poliploidi pada Tanaman)", "Mutagen (Fisika, Kimia, Biologi)"] },
          { name: "Evolusi", subtopics: ["Teori Asal Usul Kehidupan (Abiogenesis Aristoteles, Biogenesis Pasteur, Evolusi Kimia Oparin-Haldane-Urey, Evolusi Biologi)", "Teori Evolusi (Lamarck vs Darwin vs Weismann)", "Mekanisme Evolusi Darwin (Seleksi Alam & Adaptasi)", "Petunjuk Evolusi (Fosil, Anatomi Perbandingan Homologi/Analogi, Embriologi Perbandingan, Sisa Alat Tubuh, Biokimia)", "Hukum Hardy-Weinberg (p² + 2pq + q² = 1) & Syarat Keseimbangan", "Mekanisme Spesiasi (Isolasi Geografis, Reproduksi)"] },
          { name: "Bioteknologi", subtopics: ["Prinsip Dasar Bioteknologi Konvensional (Fermentasi) vs Modern (Rekayasa Genetika)", "Teknologi DNA Rekombinan (Plasmid Ti, Enzim Restriksi Endonuklease, Enzim Ligase)", "Kloning (Transfer Inti / Somatic Cell Nuclear Transfer - Domba Dolly)", "Fusi Sel (Hibridoma & Antibodi Monoklonal)", "Kultur Jaringan Tumbuhan (Sifat Totipotensi)", "Aplikasi Bioteknologi di Bidang Medis (Hormon Insulin Buatan, Vaksin Transgenik, Terapi Gen)", "Aplikasi Bioteknologi Pertanian (Kapas Bt, Golden Rice)", "Dampak Bioteknologi (Etika, Ekologi, Kesehatan, Sosial Ekonomi)"] }
        ]
      },
      {
        name: "Bahasa Inggris",
        topics: [
          { name: "Application Letter", subtopics: ["Parts of an Application Letter (Heading, Salutation, Body, Closing)", "Writing a strong Cover Letter", "Curriculum Vitae (CV) & Resume"] },
          { name: "News Item Text", subtopics: ["Generic Structure (Newsworthy event, Background events, Sources)", "Language Features (Action verbs, Saying verbs, Passive Voice)", "Analyzing headlines & journalistic writing"] },
          { name: "If Clause (Conditional Sentences) Advanced", subtopics: ["If Clause + Imperative/Suggestion", "If Clause + General Truth", "If Clause to show a dream"] },
          { name: "Caption & Visual Information", subtopics: ["How to write a good caption for pictures/graphs", "Interpreting charts, graphs, and tables", "Message within a photo"] },
          { name: "Review Text", subtopics: ["Critiquing artworks, movies, and literature", "Structure: Orientation, Evaluation, Interpretative Recount, Evaluative Summation"] },
          { name: "UTBK/SNBT Preparation", subtopics: ["Literasi Bahasa Inggris: Reading Comprehension Deep Dive", "Finding implicit meaning and author's tone", "Synthesizing information from multiple texts", "Advanced Vocabulary & Idioms"] }
        ]
      },
      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Mental Baja Menghadapi Ujian & Seleksi", subtopics: ["Pertemuan 1: Mengubah Insecurity Menjadi Motivasi", "Pertemuan 2: Manajemen Waktu Sisa Menuju SNBT"] },
          { name: "Bulan 2: Bedah Strategi SNBP & SNBT", subtopics: ["Pertemuan 1: Analisis Peluang Lolos SNBP Berdasarkan Nilai", "Pertemuan 2: Latihan Soal TPS (Penalaran Kuantitatif) Cepat"] },
          { name: "Bulan 3: Survival Skills di Dunia Perkuliahan / Kerja", subtopics: ["Pertemuan 1: Perbedaan Siswa dan Mahasiswa", "Pertemuan 2: Manajemen Keuangan Anak Kos"] },
          { name: "Bulan 4: Bahasa Inggris untuk Akademik & TOEFL Dasar", subtopics: ["Pertemuan 1: Strategi Reading Comprehension TOEFL", "Pertemuan 2: Listening Practice untuk Lingkungan Kampus"] },
          { name: "Bulan 5: Keterampilan Menulis Esai Beasiswa (Motivation Letter)", subtopics: ["Pertemuan 1: Struktur Motivation Letter yang Memikat", "Pertemuan 2: Menceritakan Kelemahan Sebagai Kekuatan"] },
          { name: "Bulan 6: Pemecahan Masalah Ekstrem (Crisis Management)", subtopics: ["Pertemuan 1: Plan B Jika Gagal Masuk Universitas Impian", "Pertemuan 2: Alternatif Kampus Swasta, Kedinasan, atau Gap Year"] },
          { name: "Bulan 7: Etiket Profesional & Networking", subtopics: ["Pertemuan 1: Cara Menghubungi Dosen/Atasan dengan Etika", "Pertemuan 2: Membangun Relasi Bermakna (Networking)"] },
          { name: "Bulan 8: Pengenalan AI Lanjut (ChatGPT untuk Riset)", subtopics: ["Pertemuan 1: Memanfaatkan AI untuk Membantu Riset Tugas Akhir", "Pertemuan 2: Prompt Engineering Lanjutan"] },
          { name: "Bulan 9: Kemampuan Negosiasi", subtopics: ["Pertemuan 1: Prinsip Win-Win Solution", "Pertemuan 2: Simulasi Tawar Menawar/Negosiasi Kepentingan"] },
          { name: "Bulan 10: Legalitas Dasar Warga Negara", subtopics: ["Pertemuan 1: Pemahaman Pajak Dasar (NPWP)", "Pertemuan 2: Hak dan Kewajiban Pekerja Sederhana (UU Tenaga Kerja)"] },
          { name: "Bulan 11: Kesiapan Menuju Dunia Dewasa (Adulting 101)", subtopics: ["Pertemuan 1: Mengurus Administrasi Dokumen Sendiri (KTP, SIM, Rekening)", "Pertemuan 2: Kesadaran Kesehatan Jangka Panjang"] },
          { name: "Bulan 12: Pelepasan & Merangkul Perubahan", subtopics: ["Pertemuan 1: Mengelola Rasa Kehilangan (Goodbye High School)", "Pertemuan 2: Menyambut Babak Baru Kehidupan Secara Positif"] }
        ]
      }
    ]
  }
];
