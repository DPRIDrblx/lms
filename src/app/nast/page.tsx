"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Sparkles, 
  Award, 
  BookOpen, 
  Target, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  Zap, 
  Medal, 
  Laptop, 
  Star,
  Users,
  Brain,
  Compass,
  FileCheck2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NastLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const competitionCategories = [
    {
      title: "Matematika & Penalaran Numerik",
      code: "MATH-JHS",
      desc: "Menguji logika deduktif, manipulasi aljabar, geometri, dan pemecahan masalah non-rutin dengan standar olimpiade.",
      icon: Brain,
      color: "from-blue-500 to-cyan-500",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      accent: "text-cyan-400"
    },
    {
      title: "Eksplorasi Sains & IPA Terpadu",
      code: "SCIENCE-JHS",
      desc: "Mengeksplorasi fenomena fisika, biosfer, analisis eksperimen, dan kimia lingkungan secara kontekstual.",
      icon: Zap,
      color: "from-emerald-500 to-lime-500",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      accent: "text-emerald-400"
    },
    {
      title: "English & Critical Thinking",
      code: "ENG-JHS",
      desc: "Kemampuan analisis wacana kritis, inferensi logis, pemahaman sintaksis kompleks, dan komunikasi analitis.",
      icon: BookOpen,
      color: "from-orange-500 to-amber-500",
      border: "border-orange-500/30",
      bg: "bg-orange-500/10",
      accent: "text-orange-400"
    }
  ];

  const timelineSteps = [
    {
      phase: "Fase 01",
      title: "Pendaftaran Online & Pembuatan Akun",
      date: "Periode Pendaftaran",
      desc: "Peserta mengisi form pendaftaran kompetisi dan otomatis bergabung ke kelas turnamen resmi NAST2026JHS.",
      badge: "Dibuka Sekarang",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    },
    {
      phase: "Fase 02",
      title: "Simulasi Ujian & Drills CBT",
      date: "Pra-Penyisihan",
      desc: "Uji coba sistem ujian berbasis CBT interaktif dengan dukungan rumus matematika KaTeX tajam tanpa lag.",
      badge: "Akses di Dasbor",
      badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    },
    {
      phase: "Fase 03",
      title: "Babak Penyisihan Nasional",
      date: "Jadwal Serentak",
      desc: "Pelaksanaan tes online berstandar nasional secara proctored untuk memperebutkan tiket ke babak semifinal.",
      badge: "Sesi Online",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30"
    },
    {
      phase: "Fase 04",
      title: "Pengumuman Kelulusan Semifinal",
      date: "Live di Dasbor Peserta",
      desc: "Hasil diumumkan secara real-time di Dasbor Peserta NAST oleh Operator Les (Status Lolos / Belum Lolos).",
      badge: "Real-time Broadcast",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30"
    },
    {
      phase: "Fase 05",
      title: "Grand Final & Penganugerahan Juara",
      date: "Puncak Acara",
      desc: "Perebutan Piala Bergilir, Medali Kejuaraan, Piagam Penghargaan, dan Beasiswa Pendidikan Nasional.",
      badge: "Grand Final",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30"
    }
  ];

  const faqs = [
    {
      q: "Siapa yang dapat mendaftar di NAST 2027?",
      a: "Turnamen ini terbuka untuk seluruh siswa-siswi jenjang SMP, MTs, dan sederajat (Kelas 7, 8, dan 9) di seluruh Indonesia, baik perorangan maupun perwakilan delegasi sekolah."
    },
    {
      q: "Bagaimana cara mengakses modul dan latihan soal setelah mendaftar?",
      a: "Setelah mendaftar di form registrasi, akun Anda akan otomatis terdaftar dan langsung masuk ke kelas kompetisi berkode NAST2026JHS. Anda dapat langsung membuka Dasbor Peserta NAST untuk mengakses kisi-kisi dan simulasi CBT."
    },
    {
      q: "Bagaimana sistem pengumuman kelulusan ke babak semifinal?",
      a: "Hasil penilaian diinput dan diverifikasi langsung oleh Operator Les / Panitia Pusat. Di Dasbor Peserta, status Anda akan tampil secara transparan: kartu abu-abu jika masih dalam proses rekapitulasi, kartu emas/hijau jika dinyatakan LOLOS, atau kartu apresiasi jika belum lolos."
    },
    {
      q: "Apakah peserta mendapatkan sertifikat keikutsertaan?",
      a: "Ya! Seluruh peserta yang mengikuti babak penyisihan berhak mengunduh E-Sertifikat Nasional Ber-Barcode resmi yang dapat diverifikasi keasliannya."
    }
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* 🌌 AMBIENT NEON GLOWS */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-48 right-10 w-[500px] h-[500px] bg-orange-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[1600px] left-10 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[160px] pointer-events-none" />

      {/* 🧭 NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#070B14]/80 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link href="/nast" className="flex items-center gap-3.5 group">
            <div className="relative w-12 h-12 bg-white/10 rounded-2xl p-2 backdrop-blur-md border border-white/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <img 
                src="/logo-nast.png" 
                alt="Logo NAST 2027" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">NAST 2027</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  National JHS
                </span>
              </div>
              <p className="text-[10px] font-bold text-cyan-400 tracking-wider">
                NIA Academic Skill Tournament
              </p>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-wider text-slate-400">
            <a href="#kategori" className="hover:text-cyan-400 transition-colors">Bidang Lomba</a>
            <a href="#tahapan" className="hover:text-cyan-400 transition-colors">Jadwal & Tahapan</a>
            <a href="#apresiasi" className="hover:text-cyan-400 transition-colors">Hadiah & Juara</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </nav>

          {/* Quick Access Action Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/nast/login">
              <button className="px-4 py-2.5 rounded-2xl text-xs font-black text-slate-200 bg-white/5 hover:bg-white/10 border border-white/15 transition-all active:scale-95">
                Masuk Peserta
              </button>
            </Link>

            <Link href="/nast/register">
              <button className="px-5 py-2.5 rounded-2xl text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 active:scale-95">
                <Trophy className="w-3.5 h-3.5 text-slate-950" />
                <span>Daftar Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

        </div>
      </header>

      {/* 🚀 HERO SECTION */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 via-orange-500/10 to-emerald-500/10 border border-white/15 backdrop-blur-md mb-8">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-black tracking-wider uppercase text-slate-200">
              Turnamen Akademik Bergengsi Tingkat Nasional SMP / MTs
            </span>
          </div>

          {/* Main Logo Showcase */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative mb-6"
          >
            <div className="w-36 h-36 sm:w-44 sm:h-44 p-4 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl shadow-cyan-500/20 flex items-center justify-center">
              <img 
                src="/logo-nast.png" 
                alt="Logo NAST 2027" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(14,165,233,0.5)]" 
              />
            </div>
            <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg">
              Official 2027
            </div>
          </motion.div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-5xl leading-[1.08] mb-6">
            Buktikan Ketajaman Akademikmu di{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-orange-400 to-emerald-400">
              NAST 2027
            </span>.
          </h1>

          <p className="text-base sm:text-xl text-slate-300 font-bold max-w-3xl mb-10 leading-relaxed">
            NIA Academic Skill Tournament 2027 adalah ajang kompetisi sains, matematika terapan, dan nalar kritis untuk siswa-siswi SMP/MTs se-Indonesia. Berkompetisi dengan sistem CBT mutakhir, transparan, dan terstandarisasi.
          </p>

          {/* Action Hub */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mb-14">
            <Link href="/nast/register" className="w-full sm:w-1/2">
              <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-95">
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>Daftar Peserta</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>

            <Link href="/nast/dashboard" className="w-full sm:w-1/2">
              <button className="w-full py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-sm border border-white/20 backdrop-blur-md flex items-center justify-center gap-2 transition-all active:scale-95">
                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                <span>Cek Pengumuman</span>
              </button>
            </Link>
          </div>

          {/* Highlight Badges Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl pt-8 border-t border-white/10 text-left">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs font-bold text-slate-400 uppercase">Kode Kelas Otomatis</p>
              <p className="text-base font-black text-cyan-400 mt-0.5 font-mono">NAST2026JHS</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs font-bold text-slate-400 uppercase">Jenjang Lomba</p>
              <p className="text-base font-black text-emerald-400 mt-0.5">SMP / MTs Sederajat</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs font-bold text-slate-400 uppercase">Metode Seleksi</p>
              <p className="text-base font-black text-orange-400 mt-0.5">CBT Interaktif KaTeX</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs font-bold text-slate-400 uppercase">Sertifikasi</p>
              <p className="text-base font-black text-amber-400 mt-0.5">Barcode Terverifikasi</p>
            </div>
          </div>

        </div>
      </section>

      {/* 🏆 BIDANG LOMBA SECTION */}
      <section id="kategori" className="py-24 relative border-t border-white/10 bg-[#090E1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              Bidang Kompetisi Akademik
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
              Pilih Arena Prestasi Terbaikmu
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-bold">
              Soal disusun oleh pakar olimpiade dengan kurikulum berstandar nasional dan tantangan HOTS (Higher Order Thinking Skills).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {competitionCategories.map((cat, i) => (
              <div 
                key={i}
                className={`p-8 rounded-3xl bg-white/5 border-2 ${cat.border} hover:bg-white/10 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between group`}
              >
                <div>
                  <div className={`w-14 h-14 rounded-2xl ${cat.bg} ${cat.accent} flex items-center justify-center font-black mb-6 border border-white/10 group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 block mb-2">
                    {cat.code}
                  </span>
                  <h3 className="text-2xl font-black text-white mb-3">
                    {cat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 font-bold leading-relaxed mb-6">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-black">
                  <span className={cat.accent}>Jenjang Kelas 7, 8, & 9</span>
                  <Link href="/nast/register">
                    <span className="text-white group-hover:text-cyan-400 flex items-center gap-1 transition-colors">
                      Daftar <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 📅 TAHAPAN & JADWAL TURNAMEN */}
      <section id="tahapan" className="py-24 relative border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-orange-400 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              Alur Perjalanan Turnamen
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
              Tahapan Kompetisi NAST 2027
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-bold">
              Pantau jadwal pelaksanaan lomba dari babak registrasi hingga malam penganugerahan pemenang.
            </p>
          </div>

          <div className="space-y-6">
            {timelineSteps.map((step, idx) => (
              <div 
                key={idx}
                className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 font-mono">
                        {step.phase} • {step.date}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${step.badgeColor}`}>
                        {step.badge}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 font-bold mt-1 max-w-xl">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <Link href="/nast/register">
                    <button className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black text-white transition-all flex items-center justify-center gap-1.5 border border-white/10">
                      <span>Ikuti Tahap Ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 🎁 APRESIASI & HADIAH */}
      <section id="apresiasi" className="py-24 relative border-t border-white/10 bg-[#090E1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="rounded-[3rem] p-8 sm:p-14 bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border-2 border-white/20 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-black mx-auto mb-6 shadow-lg shadow-amber-400/20">
                <Trophy className="w-8 h-8" />
              </div>

              <span className="text-xs font-black uppercase tracking-wider text-amber-400 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-4 inline-block">
                Total Hadiah & Apresiasi Prestasi
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">
                Raih Piala Bergilir, Tabungan Beasiswa, & Sertifikat Nasional
              </h2>

              <p className="text-slate-300 text-sm sm:text-base font-bold mb-10 leading-relaxed">
                Pemenang juara 1, 2, 3 dan peraih predikat kehormatan akan menerima medali kejuaraan, trofi eksklusif, uang pembinaan pendidikan, serta piagam penghargaan berstandar portofolio nasional.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <Medal className="w-6 h-6 text-amber-400 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">Medali Turnamen</p>
                  <p className="text-sm font-black text-white">Gold, Silver, Bronze</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <Award className="w-6 h-6 text-cyan-400 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">E-Sertifikat Resmi</p>
                  <p className="text-sm font-black text-white">Barcode Verifikasi</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <Flame className="w-6 h-6 text-orange-400 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">Beasiswa Belajar</p>
                  <p className="text-sm font-black text-white">Program Khusus NIA</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <Star className="w-6 h-6 text-emerald-400 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">Piala Bergilir</p>
                  <p className="text-sm font-black text-white">Sekolah Terbaik</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ❓ FAQ ACCORDION */}
      <section id="faq" className="py-24 relative border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              Pusat Informasi
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-black text-white hover:text-cyan-400 transition-colors"
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-6 pb-6 text-sm font-bold text-slate-400 leading-relaxed border-t border-white/10 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ⚓ FOOTER */}
      <footer className="border-t border-white/10 bg-[#05080E] pt-16 pb-12 text-slate-500 text-xs font-bold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo-nast.png" alt="Logo NAST 2027" className="w-8 h-8 object-contain" />
            <span className="text-sm font-black text-white">NAST 2027 • NIA Tutoring Center</span>
          </div>
          <div>
            Kelas Kompetisi Resmi: <strong className="text-cyan-400 font-mono">NAST2026JHS</strong>
          </div>
          <div>
            © 2027 NIA Academic Skill Tournament. Hak Cipta Dilindungi.
          </div>
        </div>
      </footer>

    </div>
  );
}
