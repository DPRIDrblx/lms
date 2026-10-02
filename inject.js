const fs = require('fs');
let content = fs.readFileSync('src/lib/tutoring-topics.ts', 'utf8');

const kelas7Info = `      {
        name: "Informatika",
        topics: [
          { name: "Berpikir Komputasional", subtopics: ["Dekomposisi", "Pengenalan Pola", "Abstraksi", "Algoritma", "Optimasi Penjadwalan", "Representasi Data"] },
          { name: "Teknologi Informasi dan Komunikasi", subtopics: ["Pengenalan Antarmuka (GUI)", "Aplikasi Perkantoran Dasar (Word, Excel, PPT)", "Manajemen Folder dan File", "Mesin Pencari dan Navigasi Web", "Surel (Email) dan Komunikasi Digital"] },
          { name: "Sistem Komputer", subtopics: ["Perangkat Keras (Hardware): Input, Proses, Output", "Perangkat Lunak (Software): Sistem Operasi & Aplikasi", "Interaksi Antarperangkat (Bluetooth, Kabel Data)", "Bilangan Biner (Dasar)"] },
          { name: "Jaringan Komputer & Internet", subtopics: ["Mengenal Jaringan Lokal (LAN) & Internet", "Konektivitas Internet (Wi-Fi, Tethering)", "Proteksi Data Pribadi Dasar", "Enkripsi Sederhana"] },
          { name: "Analisis Data", subtopics: ["Pengenalan Data dan Informasi", "Pengumpulan Data", "Pengolahan Data Dasar dengan Spreadsheet", "Visualisasi Data (Grafik Batang & Lingkaran)"] },
          { name: "Algoritma & Pemrograman Dasar", subtopics: ["Mengenal Pemrograman Visual (Scratch)", "Membuat Objek/Sprite Bergerak", "Pengenalan Event & Trigger", "Logika Percabangan (If-Else) Sederhana"] },
          { name: "Dampak Sosial Informatika", subtopics: ["Sejarah Perkembangan Komputer", "Dampak Positif dan Negatif TIK", "Etika Berkomunikasi di Dunia Digital (Netiket)"] }
        ]
      },`;

const kelas8Info = `      {
        name: "Informatika",
        topics: [
          { name: "Berpikir Komputasional (Lanjutan)", subtopics: ["Berpikir Kritis dalam Memecahkan Masalah", "Logika Proposisi & Himpunan", "Sistem Bilangan (Desimal, Biner, Oktal, Heksadesimal)", "Konversi Sistem Bilangan"] },
          { name: "Teknologi Informasi dan Komunikasi", subtopics: ["Aplikasi Perkantoran Lanjut (Mail Merge)", "Pembuatan Laporan dengan Integrasi Data", "Pembuatan Presentasi Multimedia Lanjut", "Manajemen Konten Digital"] },
          { name: "Sistem Komputer (Lanjutan)", subtopics: ["Komponen Utama Motherboard (CPU, RAM, ROM)", "Cara Kerja Sistem Komputer", "Sistem Operasi (Manajemen Proses & Memori)", "Troubleshooting Dasar Komputer"] },
          { name: "Jaringan Komputer & Internet", subtopics: ["Topologi Jaringan (Star, Bus, Ring, Mesh)", "Protokol Jaringan (TCP/IP Dasar)", "Pengalamatan IP (IP Address)", "Berbagi Data dalam Jaringan (File Sharing)"] },
          { name: "Analisis Data (Lanjutan)", subtopics: ["Pengolahan Data dengan Rumus Logika (IF, AND, OR)", "Pengolahan Data dengan Rumus Pencarian (VLOOKUP, HLOOKUP)", "Pivot Table Sederhana", "Kesimpulan dari Visualisasi Data"] },
          { name: "Algoritma & Pemrograman Lanjut", subtopics: ["Pemrograman Tekstual (Dasar Python/C++)", "Tipe Data, Variabel, dan Operator", "Struktur Kontrol Perulangan (For, While)", "Array/List Sederhana"] },
          { name: "Dampak Sosial Informatika", subtopics: ["Undang-Undang ITE (UU ITE) Dasar", "Hak Kekayaan Intelektual (HAKI) di Dunia Digital", "Cyberbullying dan Penanganannya", "Keamanan Privasi di Media Sosial"] }
        ]
      },`;

const kelas9Info = `      {
        name: "Informatika",
        topics: [
          { name: "Berpikir Komputasional (Kompleks)", subtopics: ["Struktur Data Lanjut (Tree, Graph)", "Algoritma Pencarian (Searching)", "Algoritma Pengurutan (Sorting: Bubble, Selection)", "Pemecahan Masalah Kompleks (Problem Solving)"] },
          { name: "Teknologi Informasi dan Komunikasi", subtopics: ["Pembuatan Blog / Website Sederhana (CMS)", "Desain Antarmuka Web Dasar (HTML & CSS)", "Pembuatan Konten Video Pembelajaran", "Kolaborasi Pembuatan Dokumen secara Cloud"] },
          { name: "Sistem Komputer (Mikrokontroler)", subtopics: ["Pengenalan Mikrokontroler (Arduino/Raspberry Pi)", "Input/Output pada Mikrokontroler", "Sensor Dasar", "Praktik Sistem Otomatisasi Sederhana"] },
          { name: "Jaringan Komputer & Keamanan", subtopics: ["Konsep Keamanan Jaringan", "Ancaman Keamanan Jaringan (Malware, Phishing, DoS)", "Mekanisme Pertahanan (Firewall, Antivirus)", "Kriptografi (Caesar Cipher, Vigenere)"] },
          { name: "Analisis Data (Proyek)", subtopics: ["Web Scraping Dasar", "Pembersihan Data (Data Cleaning)", "Proyek Analisis Data Publik", "Presentasi Hasil Analisis Data"] },
          { name: "Algoritma & Pemrograman (Proyek)", subtopics: ["Fungsi / Prosedur dalam Pemrograman", "Modularisasi Program", "Pembuatan Game/Aplikasi Sederhana Berbasis Teks", "Debugging dan Testing Program"] },
          { name: "Dampak Sosial Informatika & Masa Depan", subtopics: ["Profesi di Bidang IT (Programmer, Data Analyst, dll)", "Kecerdasan Buatan (AI) & Machine Learning", "Internet of Things (IoT) di Kehidupan Sehari-hari", "Tantangan dan Peluang Era Digital"] }
        ]
      },`;

const target1 = `      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Adaptasi Lingkungan Baru", subtopics: ["Pertemuan 1: Menghadapi Perubahan dari SD ke SMP", "Pertemuan 2: Membangun Lingkaran Pertemanan Sehat"] }`;

const target2 = `      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Leadership & Pengaruh Teman Sebaya", subtopics: ["Pertemuan 1: Menghindari Peer Pressure Negatif (Narkoba/Rokok)", "Pertemuan 2: Menjadi Role Model di Kelas"] }`;

const target3 = `      {
        name: "NIA Skill Up",
        topics: [
          { name: "Bulan 1: Fokus dan Motivasi Belajar Ujian", subtopics: ["Pertemuan 1: Menemukan 'Why' dalam Belajar", "Pertemuan 2: Mengelola Distraksi Gadget Menjelang Ujian"] }`;

content = content.replace(target1, kelas7Info + '\n' + target1);
content = content.replace(target2, kelas8Info + '\n' + target2);
content = content.replace(target3, kelas9Info + '\n' + target3);

fs.writeFileSync('src/lib/tutoring-topics.ts', content);
console.log('Done!');
