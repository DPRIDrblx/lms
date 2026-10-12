"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring, 
  AnimatePresence 
} from "framer-motion";
import { 
  GraduationCap, 
  Zap, 
  BookOpen, 
  Bot, 
  Sparkles, 
  Video, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  Users, 
  Clock, 
  Laptop, 
  BarChart3, 
  ShieldCheck, 
  ChevronDown, 
  Star, 
  Flame, 
  Play, 
  MessageSquare, 
  Layers, 
  HelpCircle,
  Menu,
  X,
  ExternalLink,
  PhoneCall,
  CalendarCheck
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PwaInstallButton } from "@/components/ui/pwa-install-button";
import { Mascot } from "@/components/ui/mascot";

export default function RootPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"live" | "cbt" | "klinik" | "gamify">("live");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mascotState, setMascotState] = useState<"idle" | "correct">("idle");

  // Scroll Parallax Hooks
  const { scrollYProgress } = useScroll();
  const scaleXProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 25, restDelta: 0.001 });

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Hero Parallax Layer values
  const heroMockupY = useTransform(heroProgress, [0, 1], [0, 120]);
  const heroMockupScale = useTransform(heroProgress, [0, 1], [1, 0.94]);
  const heroFloat1Y = useTransform(heroProgress, [0, 1], [0, -180]);
  const heroFloat2Y = useTransform(heroProgress, [0, 1], [0, 140]);
  const heroFloat3Y = useTransform(heroProgress, [0, 1], [0, -110]);
  const heroBgY = useTransform(heroProgress, [0, 1], [0, 200]);

  // Auth Redirection
  useEffect(() => {
    if (!loading && user) {
      if (profile?.force_password_change) {
        router.replace("/auth/change-password");
      } else if (profile?.role === "sobat_nia") {
        router.replace("/sobat-nia");
      } else if (profile?.role === "operator_les") {
        router.replace("/operator-les");
      } else if (profile?.role === "pengurus_nia") {
        router.replace("/pengurus-nia");
      } else if (profile?.role === "tutor") {
        router.replace("/tutor");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, profile, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full shadow-lg shadow-indigo-500/30"
        />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Menyiapkan portal belajar IGNITE...</p>
      </div>
    );
  }

  const faqs = [
    {
      q: "Apakah IGNITE LMS bisa diakses dari HP atau tablet?",
      a: "Tentu! Platform IGNITE dioptimalkan penuh untuk semua perangkat (smartphone, tablet, laptop/PC). Anda bahkan bisa menginstallnya sebagai Progressive Web App (PWA) langsung dari browser tanpa perlu unduh dari Play Store."
    },
    {
      q: "Bagaimana sistem kelas online interaktif bekerja?",
      a: "Kelas online didukung teknologi video HD berlatensi sangat rendah (LiveKit). Dilengkapi fitur webcam PIP melayang bebas, share screen bersuara jernih, raise-hand prioritas, chat real-time, dan polling kuis interaktif langsung di layar."
    },
    {
      q: "Apa itu fitur Klinik Konsultasi?",
      a: "Klinik Konsultasi adalah sesi bedah soal dan konsultasi materi intensif 1-on-1 atau grup kecil bersama tutor ahli. Siswa dapat mengajukan PR atau soal ujian yang belum dipahami untuk dibahas tuntas hingga mengerti langkah demi langkah."
    },
    {
      q: "Bagaimana cara kerja CBT Drills dan Tryout?",
      a: "Sistem CBT dirancang menyerupai format UTBK-SNBT & Ujian Resmi dengan timer adaptif, penulisan rumus KaTeX presisi, analisis skor IRT / persentase, serta pembahasan menyeluruh di akhir pengerjaan."
    },
    {
      q: "Apakah orang tua atau pengurus bisa memantau perkembangan siswa?",
      a: "Ya. Tersedia portal khusus Operator Les, Sobat NIA, dan Pengurus untuk memantau kehadiran absensi QR, jurnal materi harian dari tutor, dan riwayat perkembangan nilai siswa secara transparan."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden relative">
      
      {/* 🚀 Parallax Top Progress Bar */}
      <motion.div 
        style={{ scaleX: scaleXProgress }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 origin-left"
      />

      {/* 🌌 Cosmic Aurora Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          style={{ y: heroBgY }}
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[650px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-500/10 rounded-full blur-[140px]" 
        />
        <div className="absolute top-[40%] -left-[15%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[130px]" />
        <div className="absolute top-[65%] -right-[10%] w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[5%] left-[20%] w-[700px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        
        {/* Subtle Futuristic Grid */}
        <div 
          className="absolute inset-0 opacity-[0.035]" 
          style={{ 
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", 
            backgroundSize: "32px 32px" 
          }} 
        />
      </div>

      {/* 🧭 Sticky Glassmorphism Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/75 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                IGNITE <span className="text-indigo-400 text-sm font-semibold tracking-normal px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30">LMS</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">NIA Tutoring Ecosystem</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#fitur" className="hover:text-white transition-colors">Fitur Unggulan</a>
            <a href="#simulator" className="hover:text-white transition-colors">Kelas Virtual</a>
            <a href="#keunggulan" className="hover:text-white transition-colors">CBT & Drills</a>
            <a href="#testimoni" className="hover:text-white transition-colors">Prestasi</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3.5">
            <Link href="/login">
              <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-white/10 transition-all shadow-sm">
                Masuk Akun
              </button>
            </Link>
            <Link href="/login">
              <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 border border-indigo-400/30">
                <span>Mulai Belajar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-b border-white/10 bg-slate-950/95 backdrop-blur-2xl px-6 py-6 flex flex-col gap-4 overflow-hidden"
            >
              <a 
                href="#fitur" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-semibold text-slate-300 hover:text-white py-1"
              >
                Fitur Unggulan
              </a>
              <a 
                href="#simulator" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-semibold text-slate-300 hover:text-white py-1"
              >
                Kelas Virtual & CBT
              </a>
              <a 
                href="#keunggulan" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-semibold text-slate-300 hover:text-white py-1"
              >
                Keunggulan Platform
              </a>
              <a 
                href="#testimoni" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-semibold text-slate-300 hover:text-white py-1"
              >
                Kisah Sukses
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-semibold text-slate-300 hover:text-white py-1"
              >
                Tanya Jawab (FAQ)
              </a>
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <Link href="/login" className="w-full">
                  <button className="w-full py-3 rounded-xl font-bold text-center bg-slate-900 border border-white/10 text-slate-200">
                    Masuk Akun
                  </button>
                </Link>
                <Link href="/login" className="w-full">
                  <button className="w-full py-3 rounded-xl font-bold text-center bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                    Mulai Belajar Sekarang
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 🌟 HERO SECTION WITH PARALLAX DEPTH */}
      <section ref={heroRef} className="relative pt-12 pb-24 md:pt-20 md:pb-36 z-10 overflow-hidden">
        
        {/* Floating Background Shapes with Dynamic Scroll Offset */}
        <motion.div 
          style={{ y: heroFloat1Y }}
          className="absolute top-24 left-[8%] w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 backdrop-blur-md hidden lg:flex items-center justify-center text-indigo-400 rotate-12 shadow-2xl pointer-events-none"
        >
          <Sparkles className="w-8 h-8 animate-pulse text-indigo-400" />
        </motion.div>

        <motion.div 
          style={{ y: heroFloat2Y }}
          className="absolute bottom-20 left-[12%] p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-md hidden xl:flex items-center gap-3 shadow-2xl pointer-events-none"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Daily Streak</div>
            <div className="text-sm font-black text-white">14 Hari Belajar! 🔥</div>
          </div>
        </motion.div>

        <motion.div 
          style={{ y: heroFloat3Y }}
          className="absolute top-36 right-[10%] p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-md hidden lg:flex items-center gap-3 shadow-2xl pointer-events-none -rotate-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Tryout SNBT Terkini</div>
            <div className="text-sm font-black text-emerald-400">Skor: 742 (Top 3%)</div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          
          {/* Badge pill */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-md shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <span>Platform Pembelajaran Digital Generasi Baru • NIA Tutoring</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mb-8"
          >
            Bimbingan Belajar Modern,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              Interaktif & Terukur
            </span>{" "}
            Hingga Lolos PTN Impian.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300 font-normal max-w-3xl mb-10 leading-relaxed"
          >
            Kombinasi sempurna antara <strong className="text-white font-semibold">Virtual Live Classroom HD</strong> berlatensi rendah, simulasi <strong className="text-white font-semibold">CBT & Drills Adaptif</strong>, serta <strong className="text-white font-semibold">Klinik Konsultasi 1-on-1</strong> bersama tutor terbaik untuk akselerasi prestasimu.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mx-auto mb-12"
          >
            <Link href="/login" className="w-full sm:w-auto flex-1">
              <button className="w-full py-4 px-8 rounded-2xl font-black text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/35 border border-indigo-300/30 text-base flex items-center justify-center gap-2">
                <span>Mulai Belajar Sekarang</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <a href="#simulator" className="w-full sm:w-auto flex-1">
              <button className="w-full py-4 px-8 rounded-2xl font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800/90 hover:text-white border border-white/10 active:scale-[0.98] transition-all text-base shadow-sm">
                Lihat Demo Kelas
              </button>
            </a>
          </motion.div>

          {/* PWA Install Button Helper */}
          <div className="w-full max-w-sm mb-16">
            <PwaInstallButton />
          </div>

          {/* 🖥️ Parallax Mockup Showcase Container */}
          <motion.div
            style={{ 
              y: heroMockupY,
              scale: heroMockupScale 
            }}
            className="w-full max-w-5xl relative rounded-3xl p-2.5 sm:p-4 bg-gradient-to-b from-white/15 to-white/5 border border-white/15 shadow-2xl shadow-indigo-950/80 backdrop-blur-xl transition-all"
          >
            {/* Top Browser Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 rounded-2xl border border-white/5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/60 px-4 py-1.5 rounded-lg border border-white/5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                https://ignite-lms.nia.id/live-class/matematika-snbt
              </div>
              <div className="text-xs text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-500/10">
                LIVE HD
              </div>
            </div>

            {/* Mockup Inside Visuals */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-inner grid grid-cols-1 lg:grid-cols-4 min-h-[420px] sm:min-h-[500px]">
              
              {/* Screen Share / Blackboard Area */}
              <div className="lg:col-span-3 p-6 sm:p-8 flex flex-col justify-between relative bg-gradient-to-b from-slate-900/90 to-slate-950">
                
                {/* Header status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1.5 border border-rose-500/30">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      SEDANG BERLANGSUNG
                    </span>
                    <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
                      Kelas Intensif Penalaran Matematika
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>42 Siswa Aktif</span>
                  </div>
                </div>

                {/* Whiteboard / Screen Share Math Visual */}
                <div className="my-8 p-6 rounded-2xl bg-slate-900/60 border border-white/5 relative">
                  <div className="text-xs text-indigo-400 font-mono mb-2 uppercase tracking-wider">
                    Screen Share: Tutor Ridwan S.Si (NIA Master Tutor)
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-3">
                    Solusi Cepat: Integral Substitusi & Luas Daerah Kurva
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-white/5 text-slate-300 font-mono text-xs sm:text-sm leading-relaxed mb-4">
                    <p className="text-indigo-300">∫ [2x · √(x² + 9)] dx = ?</p>
                    <p className="text-slate-400 mt-1">Misalkan u = x² + 9 ⇒ du = 2x dx</p>
                    <p className="text-emerald-400 mt-1">Hasil: ⅔ (x² + 9)^(3/2) + C ✓</p>
                  </div>
                  
                  {/* Real-time Interactive Poll Overlay */}
                  <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Polling Kilat: Apakah u = x² + 9 tepat?</div>
                        <div className="text-[11px] text-indigo-300">38 dari 42 siswa telah memilih</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                        95% Ya, Tepat!
                      </span>
                    </div>
                  </div>
                </div>

                {/* Draggable PIP Webcam Mockup in Bottom Right */}
                <div className="absolute bottom-6 right-6 w-36 h-28 sm:w-48 sm:h-36 rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500/60 shadow-2xl flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full">
                      Tutor Cam (PIP)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center justify-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-bold border border-indigo-400/40 text-lg">
                      TR
                    </div>
                  </div>
                  <div className="text-[10px] text-center font-medium text-slate-300 truncate">
                    Ridwan S.Si (MIPA)
                  </div>
                </div>

                {/* Bottom Control Bar */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="p-2 sm:p-2.5 rounded-xl bg-slate-800 text-slate-200 border border-white/5">
                    <Video className="w-4 h-4 text-emerald-400" />
                  </span>
                  <span className="p-2 sm:p-2.5 rounded-xl bg-slate-800 text-slate-200 border border-white/5">
                    <Laptop className="w-4 h-4 text-indigo-400" />
                  </span>
                  <span className="p-2 sm:p-2.5 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold px-3">
                    ✋ Raise Hand Aktif
                  </span>
                </div>
              </div>

              {/* Chat & Student Queue Sidebar */}
              <div className="border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-900/60 p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      Live Chat Siswa
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Realtime</span>
                  </div>

                  <div className="flex flex-col gap-3 text-left">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-indigo-300">Nadira (SMA 1)</span>
                        <span className="text-[10px] text-slate-500">19:42</span>
                      </div>
                      <p className="text-xs text-slate-300">Kak, rumus ini bisa dipakai buat soal tipe UTBK 2024 juga kan?</p>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-300">Fikri (SMA 3)</span>
                        <span className="text-[10px] text-slate-500">19:43</span>
                      </div>
                      <p className="text-xs text-slate-300">Paham kak! Jawabannya jadi jauh lebih cepat!</p>
                    </div>

                    <div className="bg-indigo-900/30 p-2.5 rounded-xl border border-indigo-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-amber-300">Tutor Ridwan</span>
                        <span className="text-[10px] text-indigo-400">TUTOR</span>
                      </div>
                      <p className="text-xs text-indigo-200">Bisa banget Nadira, nanti kita tes di nomor 7 ya!</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Terhubung ke LiveKit Media Server</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* 📊 REALTIME METRICS TICKER SECTION */}
      <section className="relative z-20 py-12 bg-slate-900/60 border-y border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <motion.div 
              whileHover={{ y: -4 }} 
              className="p-4 rounded-2xl bg-slate-950/40 border border-white/5"
            >
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300 mb-1">
                15.000+
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300">Bank Soal & Pembahasan</div>
              <div className="text-[11px] text-slate-500 mt-1">Sesuai Kisi-kisi SNBT & Mandiri</div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4 }} 
              className="p-4 rounded-2xl bg-slate-950/40 border border-white/5"
            >
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-1">
                98.4%
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300">Tingkat Kelulusan PTN</div>
              <div className="text-[11px] text-slate-500 mt-1">Alumni di UI, ITB, UGM, UNAIR</div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4 }} 
              className="p-4 rounded-2xl bg-slate-950/40 border border-white/5"
            >
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-1">
                1-on-1
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300">Klinik Konsultasi</div>
              <div className="text-[11px] text-slate-500 mt-1">Tanya PR & Konsep Sulit</div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4 }} 
              className="p-4 rounded-2xl bg-slate-950/40 border border-white/5"
            >
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300 mb-1">
                &lt; 50 ms
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300">Latency Kelas Virtual</div>
              <div className="text-[11px] text-slate-500 mt-1">WebRTC Streaming Audio & Video</div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 🧩 INTERACTIVE FEATURE SIMULATOR WITH PARALLAX TABS */}
      <section id="simulator" className="py-24 sm:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              Eksplorasi Platform Terintegrasi
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-5">
              Empat Pilar Sukses Belajar di IGNITE LMS
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Klik setiap pilar di bawah untuk melihat bagaimana IGNITE memfasilitasi setiap aspek belajarmu dari persiapan hingga ujian.
            </p>
          </div>

          {/* Interactive Switcher Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {[
              { id: "live", label: "Virtual Live Class", icon: Video, color: "indigo" },
              { id: "cbt", label: "CBT & Smart Drills", icon: BookOpen, color: "emerald" },
              { id: "klinik", label: "Klinik Konsultasi 1-on-1", icon: Users, color: "amber" },
              { id: "gamify", label: "Gamifikasi & XP", icon: Award, color: "purple" }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border ${
                    isActive 
                      ? "bg-indigo-600 text-white border-indigo-400/50 shadow-lg shadow-indigo-600/30 scale-105" 
                      : "bg-slate-900/80 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-indigo-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Tab Content Showcase */}
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "live" && (
                <motion.div
                  key="live"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                >
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      Live Video Berkelas Studio
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                      Ruang Kelas Virtual Tanpa Gangguan, Interaksi Nyata Seperti Tatap Muka
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      Didukung engine WebRTC LiveKit berkecepatan tinggi, audio jernih saat tutor share screen, kamera PIP yang dapat dipindahkan sesuka hati, serta polling interaktif langsung tanpa perlu buka aplikasi lain.
                    </p>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Kamera tutor PIP yang bisa di-drag bebas oleh siswa</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Antrean Raise Hand terstruktur untuk bertanya langsung</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Polling soal kuis otomatis dengan rekapitulasi persentase</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-slate-950 p-6 border border-white/10 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-3">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        Virtual Room #102: Fisika Kuantum & Dinamika
                      </span>
                      <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">1080p 60fps</span>
                    </div>
                    <div className="h-48 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-950/60 flex items-center justify-center border border-white/5 relative p-4 text-center">
                      <div>
                        <Laptop className="w-10 h-10 text-indigo-400 mx-auto mb-2 opacity-80" />
                        <div className="text-sm font-bold text-white">Presentasi: Hukum Termodinamika II</div>
                        <div className="text-xs text-slate-400 mt-1">Audio sharing terverifikasi aktif</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                        <div className="text-slate-400">Total Peserta</div>
                        <div className="text-base font-bold text-white mt-0.5">36 Siswa Online</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                        <div className="text-slate-400">Status Interaksi</div>
                        <div className="text-base font-bold text-emerald-400 mt-0.5">Semua Mic Stabil</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "cbt" && (
                <motion.div
                  key="cbt"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                >
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      <Zap className="w-3.5 h-3.5" />
                      Sistem Simulasi Ujian Standar Nasional
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                      CBT & Smart Drills yang Melatih Ketahanan Mental Ujianmu
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      Latih kecepatan berpikir dengan ribuan soal bertingkat. Dilengkapi timer akurat, rumus matematika KaTeX tajam, navigasi nomor cepat, dan laporan evaluasi subtes yang transparan.
                    </p>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Rendering rumus matematika & simbol ilmiah tanpa buram</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Pembahasan langkah-demi-langkah setelah setiap drill</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Kategori soal TPS, Penalaran Umum, Literasi Bahasa, & Sains</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-slate-950 p-6 border border-white/10 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-xs font-bold text-white">TRYOUT SNBT #4 - PENALARAN MATEMATIKA</span>
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        ⏱️ Sisa Waktu: 18:42
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-3">
                      <div className="text-xs text-slate-400">Soal Nomor 14 dari 20:</div>
                      <p className="text-sm font-semibold text-white">
                        Diketahui fungsi f(x) = 3x² - 4x + 1. Nilai turunan f'(2) adalah...
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-medium">
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-white/10 text-slate-300">A. 6</div>
                        <div className="p-2.5 rounded-lg bg-indigo-600/30 border border-indigo-500 text-white font-bold">B. 8 (Dipilih)</div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-white/10 text-slate-300">C. 10</div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-white/10 text-slate-300">D. 12</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Sudah dijawab: 13 / 20</span>
                      <span className="text-emerald-400 font-bold">Tingkat Keyakinan: Tinggi</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "klinik" && (
                <motion.div
                  key="klinik"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                >
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                      <PhoneCall className="w-3.5 h-3.5" />
                      Konsultasi Privat Eksklusif
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                      Klinik Konsultasi: Bedah Soal Sulit & PR Sampai Tuntas
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      Pernah mentok ngerjain soal PR di sekolah? Di Klinik Konsultasi IGNITE, kamu bisa booking sesi khusus bersama tutor spesialis mata pelajaran untuk kupas tuntas konsep yang belum kamu kuasai.
                    </p>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Pilih tutor favorit dan jadwal fleksibel sesuai luangmu</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Kirim foto soal sebelum sesi dimulai agar tutor siap membahas</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Diskusi dua arah tanpa terburu-buru sampai benar-benar paham</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-slate-950 p-6 border border-white/10 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-amber-400" />
                        Tiket Klinik Konsultasi Terjadwal
                      </span>
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Terkonfirmasi</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
                          SN
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Siti Nurhaliza, S.Pd</div>
                          <div className="text-xs text-slate-400">Tutor Kimia Organik & Stoikiometri</div>
                        </div>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg text-xs space-y-1.5 border border-white/5">
                        <div className="text-slate-400">Jadwal: <span className="text-white font-semibold">Besok, 16:00 - 17:00 WIB</span></div>
                        <div className="text-slate-400">Topik: <span className="text-amber-300 font-semibold">Reaksi Redoks & Sel Elektrokimia (PR Sekolah)</span></div>
                      </div>
                    </div>
                    <button className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md">
                      Masuk Ruang Klinik
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === "gamify" && (
                <motion.div
                  key="gamify"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                >
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                      <Award className="w-3.5 h-3.5" />
                      Gamifikasi & Motivasi Tiada Henti
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                      Belajar Seru Seperti Bermain Game dengan XP, Streak & Leaderboard
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      Raih XP setiap menyelesaikan soal kuis, jaga streak belajar harianmu agar tidak padam, dan panjat papan peringkat bersama teman-teman sekelasmu!
                    </p>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Maskot NIA interaktif yang menyemangati belajarmu</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Sistem lencana pencapaian (Achievement Badges)</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Statistik kemajuan belajar yang terangkum rapi</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-slate-950 p-6 border border-white/10 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-xs font-bold text-white">STATUS LEVEL SISWA</span>
                      <span className="text-xs text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">Level 18 • SNBT Master</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Total XP Akumulasi</span>
                        <span className="text-purple-300 font-black text-sm">4.850 / 5.000 XP</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                        <div className="w-[92%] h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5 flex items-center gap-2">
                          <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span>14 Hari Streak</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5 flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-400" />
                          <span>Peringkat #2 Kelas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* 🚀 PARALLAX FEATURE CARDS GRID (KEUNGGULAN) */}
      <section id="fitur" className="py-24 bg-slate-900/40 relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              Kenapa Memilih IGNITE?
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
              Dirancang Khusus untuk Standar Ujian Tertinggi
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Kami menggabungkan kurikulum teruji NIA Tutoring dengan infrastruktur teknologi kelas dunia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <motion.div 
              whileHover={{ y: -8 }} 
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/50 shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">LiveKit HD Virtual Class</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Interaksi audio-video jernih tanpa delay menyebalkan. Dilengkapi screen share bersuara, PIP webcam bebas geser, dan antrean raise hand tertib.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              whileHover={{ y: -8 }} 
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/50 shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Simulasi CBT & Drills Adaptif</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Latihan soal mirip tampilan UTBK asli dengan timer, rumus LaTeX presisi, scoring instan, serta pembahasan detail untuk evaluasi materi lemah.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              whileHover={{ y: -8 }} 
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/50 shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Klinik Konsultasi Eksklusif</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Bedah tuntas materi sekolah & soal tersulit secara privat bersama tutor ahli. Jadwal konsultasi fleksibel sesuai waktu luang siswa.
              </p>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              whileHover={{ y: -8 }} 
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/50 shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Gamifikasi & Reward XP</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Jadikan belajar kebiasaan yang menyenangkan. Raih poin XP, pertahankan streak harian, raih lencana penghargaan, dan pantau leaderboard!
              </p>
            </motion.div>

            {/* Card 5 */}
            <motion.div 
              whileHover={{ y: -8 }} 
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-pink-500/50 shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                <Laptop className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Aplikasi Ringan PWA</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Pasang aplikasi langsung ke layar utama smartphone Android, iOS, maupun laptop Windows/Mac tanpa perlu repot download puluhan MB dari store.
              </p>
            </motion.div>

            {/* Card 6 */}
            <motion.div 
              whileHover={{ y: -8 }} 
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/50 shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Portal Multi-Role Terpadu</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Integrasi penuh antara Siswa, Tutor, Operator Les, Sobat NIA, dan Pengurus untuk transparansi absensi QR, rekap nilai, dan laporan berkala.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 🤖 MEET THE MASCOT & GAMIFICATION HERO BANNER */}
      <section className="py-20 relative z-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/30 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30">
                Teman Belajar Setiamu
              </span>
              <h3 className="text-2xl sm:text-4xl font-black text-white">
                Siap Menemani Perjalanan Belajarmu Setiap Hari!
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Arahkan kursor atau sentuh maskot di samping untuk melihat reaksinya! Di IGNITE LMS, kamu tidak pernah belajar sendirian.
              </p>
              <div className="pt-2">
                <Link href="/login">
                  <button className="px-6 py-3 rounded-xl bg-white text-slate-900 font-black hover:bg-slate-100 transition-colors shadow-lg text-sm">
                    Mulai Belajar Bareng
                  </button>
                </Link>
              </div>
            </div>

            <div 
              onMouseEnter={() => setMascotState("correct")}
              onMouseLeave={() => setMascotState("idle")}
              className="p-6 rounded-3xl bg-slate-950/60 border border-white/10 shadow-2xl cursor-pointer group hover:border-indigo-400/50 transition-all text-center"
            >
              <Mascot state={mascotState} className="w-36 h-36 mx-auto" />
              <div className="text-xs font-bold text-slate-300 mt-2">
                {mascotState === "correct" ? "Hore! Semangat Belajarnya! 🎉" : "Hai! Arahkan kursor ke aku! 👋"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💬 TESTIMONIALS & KISAH SUKSES (PRESTASI) */}
      <section id="testimoni" className="py-24 bg-slate-900/30 relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Kisah Sukses Siswa
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
              Mereka yang Telah Membuktikan
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Ribuan siswa telah meraih kursi di perguruan tinggi negeri impian berkat bimbingan intensif NIA Tutoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Testimonial 1 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic mb-6">
                  &ldquo;Fitur Klinik Konsultasi dan Kelas Online di IGNITE beneran penyelamat waktu UTBK. Tutornya jelasin konsep dasar sampai aku paham polanya, bukan cuma ngafalin rumus.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-white/10">
                <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center font-bold text-indigo-300">
                  AR
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Anisa Rahmawati</div>
                  <div className="text-xs text-emerald-400 font-semibold">Lolos Kedokteran UI 2024</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic mb-6">
                  &ldquo;Sistem CBT-nya mirip banget sama ujian aslinya. Waktu ngerjain UTBK kemarin udah nggak panik sama sekali karena udah terbiasa drill harian di platform IGNITE.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-white/10">
                <div className="w-11 h-11 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center font-bold text-purple-300">
                  DF
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Dimas Fakhri</div>
                  <div className="text-xs text-emerald-400 font-semibold">Lolos STEI-R ITB 2024</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic mb-6">
                  &ldquo;Aplikasi PWA-nya enteng banget dibuka di HP pas lagi di jalan. Bisa ngerjain kuis kilat 10 menit sambil nunggu jemputan. Streak 30 hari bikin makin semangat!&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-white/10">
                <div className="w-11 h-11 rounded-xl bg-pink-600/30 border border-pink-400/40 flex items-center justify-center font-bold text-pink-300">
                  SL
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Salma Luthfiyah</div>
                  <div className="text-xs text-emerald-400 font-semibold">Lolos Ilmu Hukum UGM 2024</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ❓ FAQ SECTION (ACCORDION) */}
      <section id="faq" className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              Pertanyaan yang Sering Diajukan
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
              Ada Pertanyaan? Kami Punya Jawabannya
            </h2>
            <p className="text-slate-400 text-base">
              Pelajari lebih lanjut tentang bagaimana IGNITE LMS membantu efektivitas belajarmu.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-indigo-300 transition-colors"
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-indigo-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
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

      {/* 🌠 GRAND FINAL PARALLAX CTA BANNER */}
      <section className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[2.5rem] p-10 sm:p-16 bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 overflow-hidden shadow-2xl text-center flex flex-col items-center">
            
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

            <span className="relative z-10 text-xs font-bold uppercase tracking-wider text-indigo-300 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 mb-6">
              Mulai Perjalanan Menuju Masa Depan
            </span>

            <h2 className="relative z-10 text-3xl sm:text-5xl md:text-6xl font-black text-white max-w-3xl mb-6 tracking-tight leading-tight">
              Siap Meningkatkan Prestasimu ke Level Tertinggi?
            </h2>

            <p className="relative z-10 text-slate-300 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
              Bergabunglah bersama ribuan siswa cerdas lainnya dan nikmati kemudahan belajar interaktif kapan saja, di mana saja.
            </p>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mx-auto">
              <Link href="/login" className="w-full">
                <button className="w-full py-4 px-8 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all text-base shadow-xl shadow-indigo-600/40 border border-indigo-300/30 flex items-center justify-center gap-2">
                  <span>Masuk ke Portal Belajar</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>

            <div className="relative z-10 mt-8 text-xs text-slate-400 flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Akses Instan Semua Perangkat
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Dukungan PWA Terpadu
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ⚓ COMPREHENSIVE FOOTER */}
      <footer className="border-t border-white/10 bg-slate-950 relative z-10 pt-16 pb-12 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            
            {/* Col 1: Bio */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-xl font-black text-white tracking-tight">IGNITE LMS</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ekosistem pembelajaran digital komprehensif dari NIA Tutoring yang menggabungkan kelas virtual LiveKit, simulasi CBT cerdas, dan klinik konsultasi privat.
              </p>
              <div className="text-xs text-indigo-400 font-medium">
                © {new Date().getFullYear()} NIA Tutoring. Hak cipta dilindungi.
              </div>
            </div>

            {/* Col 2: Fitur Utama */}
            <div className="space-y-3">
              <div className="text-white font-bold text-sm tracking-wider uppercase">Fitur Platform</div>
              <ul className="space-y-2 text-xs">
                <li><a href="#simulator" className="hover:text-white transition-colors">Virtual Live Classroom HD</a></li>
                <li><a href="#simulator" className="hover:text-white transition-colors">Simulasi CBT & Drills Soal</a></li>
                <li><a href="#simulator" className="hover:text-white transition-colors">Klinik Konsultasi 1-on-1</a></li>
                <li><a href="#simulator" className="hover:text-white transition-colors">Gamifikasi & Leaderboard</a></li>
                <li><a href="#simulator" className="hover:text-white transition-colors">Aplikasi Web PWA</a></li>
              </ul>
            </div>

            {/* Col 3: Portal Peran */}
            <div className="space-y-3">
              <div className="text-white font-bold text-sm tracking-wider uppercase">Portal Akses</div>
              <ul className="space-y-2 text-xs">
                <li><Link href="/login" className="hover:text-white transition-colors">Portal Siswa</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Portal Tutor & Pengajar</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Portal Operator Les</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Portal Sobat NIA</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Portal Pengurus NIA</Link></li>
              </ul>
            </div>

            {/* Col 4: Keamanan & Status */}
            <div className="space-y-3">
              <div className="text-white font-bold text-sm tracking-wider uppercase">Infrastruktur & Status</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform beroperasi di cloud berlatensi rendah dengan enkripsi data penuh Supabase SSR & LiveKit Video Server.
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-white/5 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Semua Layanan Berjalan Normal (100% Uptime)</span>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              IGNITE LMS by NIA Tutoring • Memberdayakan Generasi Berprestasi Indonesia
            </div>
            <div className="flex items-center gap-6">
              <a href="#fitur" className="hover:text-slate-300 transition-colors">Syarat & Ketentuan</a>
              <a href="#fitur" className="hover:text-slate-300 transition-colors">Kebijakan Privasi</a>
              <a href="#faq" className="hover:text-slate-300 transition-colors">Bantuan</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
