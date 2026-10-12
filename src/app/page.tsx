"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring, 
  AnimatePresence,
  useMotionValue
} from "framer-motion";
import { 
  GraduationCap, 
  Sparkles, 
  Video, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  Users, 
  BookOpen, 
  Flame, 
  Star, 
  ChevronDown, 
  School, 
  Target, 
  QrCode, 
  Calendar, 
  FileText, 
  Volume2, 
  VolumeX, 
  ArrowUpRight, 
  Laptop, 
  Heart, 
  Check, 
  Menu, 
  X,
  Play,
  RotateCcw,
  MousePointer2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import confetti from "canvas-confetti";
import { PwaInstallButton } from "@/components/ui/pwa-install-button";
import { Mascot } from "@/components/ui/mascot";

export default function RootPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Navigation & Interactive States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(false);
  const [mascotMood, setMascotMood] = useState<"idle" | "correct">("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activePortal, setActivePortal] = useState<"mmis" | "nia">("mmis");
  const [cbtSelectedOption, setCbtSelectedOption] = useState<string>("B");

  // Web Audio Synth for Cheerful Ambience & Chimes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playSoundChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = audioCtxRef.current || new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSound = () => {
    if (!soundActive) {
      playSoundChime();
      setSoundActive(true);
    } else {
      setSoundActive(false);
    }
  };

  const triggerConfetti = () => {
    setMascotMood("correct");
    playSoundChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8B5CF6"]
    });
    setTimeout(() => setMascotMood("idle"), 2500);
  };

  // Mouse Movement Parallax Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 45, damping: 25 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 45, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientWidth, clientHeight } = document.documentElement;
    const x = (e.clientX / clientWidth - 0.5) * 30;
    const y = (e.clientY / clientHeight - 0.5) * 30;
    mouseX.set(x);
    mouseY.set(y);
  };

  // Scroll Hooks (Window Scroll - 100% Hydration-Safe, No Blank Screen Gaps)
  const { scrollY, scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Continuous Parallax Layer Transforms
  const sunY = useTransform(scrollY, [0, 800], [0, 160]);
  const sunScale = useTransform(scrollY, [0, 800], [1, 1.2]);
  const mountainY = useTransform(scrollY, [0, 800], [0, 100]);
  const hillsY = useTransform(scrollY, [0, 800], [0, 50]);
  const foregroundY = useTransform(scrollY, [0, 800], [0, 260]);
  const heroCardY = useTransform(scrollY, [0, 800], [0, -60]);
  const heroCardScale = useTransform(scrollY, [0, 800], [1, 0.96]);

  // Floating Badges Offsets
  const badge1Y = useTransform(scrollY, [0, 800], [0, -180]);
  const badge2Y = useTransform(scrollY, [0, 800], [0, -140]);
  const badge3Y = useTransform(scrollY, [0, 800], [0, -220]);

  // Staggered Parallax on Dual Wing Section
  const wingLeftY = useTransform(scrollY, [500, 1400], [60, -40]);
  const wingRightY = useTransform(scrollY, [500, 1400], [-30, 50]);

  // Helper to get role dashboard URL
  const getDashboardUrl = () => {
    if (profile?.role === "sobat_nia") return "/sobat-nia";
    if (profile?.role === "operator_les") return "/operator-les";
    if (profile?.role === "pengurus_nia") return "/pengurus-nia";
    if (profile?.role === "tutor") return "/tutor";
    return "/dashboard";
  };

  // Only redirect if password change is forced
  useEffect(() => {
    if (!loading && user && profile?.force_password_change) {
      router.replace("/auth/change-password");
    }
  }, [user, profile, loading, router]);

  const faqs = [
    {
      q: "Apa perbedaan MMIS School (/login) dan NIA Tutoring (/app)?",
      a: "IGNITE adalah ekosistem super-platform terpadu: MMIS School (/login) khusus untuk sekolah formal (jadwal KBM harian, presensi QR guru & murid, penilaian berkala, dan e-rapor). Sedangkan NIA Tutoring (/app) khusus bimbingan belajar intensif (persiapan tembus UTBK-SNBT, tryout CBT KaTeX, klinik konsultasi privat 1-on-1, dan ruang kelas LiveKit)."
    },
    {
      q: "Bagaimana cara siswa atau guru masuk ke portal MMIS School?",
      a: "Klik tombol 'Masuk MMIS School' di navbar atau pilih tab MMIS School di launcher utama untuk langsung menuju ke halaman resmi /login. Anda dapat masuk dengan akun email terdaftar di sekolah."
    },
    {
      q: "Bagaimana cara murid les masuk ke portal NIA Tutoring?",
      a: "Klik tombol 'Masuk NIA Tutoring' di navbar atau pilih tab NIA Tutoring untuk menuju ke halaman /app, tempat jadwal bimbel, tryout, dan klinik konsultasi berlangsung."
    },
    {
      q: "Apakah platform ini bisa diinstall ke smartphone tanpa download file besar?",
      a: "Tentu! IGNITE mendukung teknologi Progressive Web App (PWA). Cukup klik tombol 'Install Aplikasi PWA' di website ini untuk memasang ikon aplikasi di layar utama ponsel atau laptop."
    },
    {
      q: "Bagaimana cara kerja Klinik Konsultasi 1-on-1 di NIA Tutoring?",
      a: "Siswa yang merasa bingung dengan PR atau materi pelajaran di sekolah dapat menjadwalkan sesi privat bersama tutor ahli. Anda bisa upload foto lembar soal terlebih dahulu, lalu bedah langkah demi langkah di ruang interaktif."
    }
  ];

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#FAF6EE] text-slate-800 font-sans selection:bg-amber-300 selection:text-emerald-950 relative overflow-x-clip"
    >
      
      {/* 🚀 Top Smooth Scroll Progress Bar */}
      <motion.div 
        style={{ scaleX: smoothProgress }}
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-600 z-50 origin-left"
      />

      {/* 🧭 Sticky Frosted Floating Header */}
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-[#FAF6EE]/85 border-b border-amber-900/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-emerald-600 flex items-center justify-center shadow-md shadow-amber-500/25 border-2 border-white group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-emerald-950">IGNITE</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200/80 text-amber-900 border border-amber-300">
                  Dual Ecosystem
                </span>
              </div>
              <span className="text-[11px] font-black text-emerald-700 tracking-wider">
                MMIS School & NIA Tutoring
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-black text-slate-600">
            <a href="#launcher" className="hover:text-emerald-900 transition-colors">Portal Akses</a>
            <a href="#ekosistem" className="hover:text-emerald-900 transition-colors">Dua Sayap</a>
            <a href="#fitur" className="hover:text-emerald-900 transition-colors">Fitur Unggulan</a>
            <a href="#prestasi" className="hover:text-emerald-900 transition-colors">Kisah Sukses</a>
            <a href="#faq" className="hover:text-emerald-900 transition-colors">FAQ</a>
          </nav>

          {/* Dual Action Login Portals */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link href={getDashboardUrl()}>
                <button className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 active:scale-95">
                  <Laptop className="w-4 h-4" />
                  <span>Buka Dashboard ({profile?.full_name?.split(" ")[0] || "Saya"})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className="px-4 py-2.5 rounded-2xl text-xs font-black text-emerald-950 bg-white hover:bg-emerald-50 border-2 border-emerald-600/30 hover:border-emerald-600 shadow-sm transition-all flex items-center gap-1.5 active:scale-95">
                    <School className="w-4 h-4 text-emerald-600" />
                    <span>MMIS School</span>
                  </button>
                </Link>

                <Link href="/app">
                  <button className="px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5 active:scale-95">
                    <Target className="w-4 h-4 text-white" />
                    <span>NIA Tutoring</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="lg:hidden p-2.5 rounded-2xl bg-white border border-amber-900/15 text-slate-700 shadow-sm"
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
              className="lg:hidden border-b border-amber-900/10 bg-[#FAF6EE]/95 backdrop-blur-2xl px-6 py-6 flex flex-col gap-4 overflow-hidden"
            >
              <a 
                href="#launcher" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-black text-slate-700 hover:text-emerald-900 py-1"
              >
                Pilih Portal Belajar
              </a>
              <a 
                href="#ekosistem" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-black text-slate-700 hover:text-emerald-900 py-1"
              >
                Dua Sayap IGNITE (MMIS & NIA)
              </a>
              <a 
                href="#fitur" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-black text-slate-700 hover:text-emerald-900 py-1"
              >
                Fitur Unggulan
              </a>
              <a 
                href="#prestasi" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-black text-slate-700 hover:text-emerald-900 py-1"
              >
                Kisah Sukses Siswa
              </a>

              <div className="pt-4 border-t border-amber-900/10 flex flex-col gap-3">
                {user ? (
                  <Link href={getDashboardUrl()} className="w-full">
                    <button className="w-full py-3.5 rounded-2xl font-black text-center bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-center gap-2 shadow-md">
                      <Laptop className="w-4 h-4" />
                      <span>Buka Dashboard Saya</span>
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="w-full">
                      <button className="w-full py-3.5 rounded-2xl font-black text-center bg-white border-2 border-emerald-600/30 text-emerald-950 flex items-center justify-center gap-2 shadow-sm">
                        <School className="w-4 h-4 text-emerald-600" />
                        <span>Masuk MMIS School (/login)</span>
                      </button>
                    </Link>
                    <Link href="/app" className="w-full">
                      <button className="w-full py-3.5 rounded-2xl font-black text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center gap-2 shadow-md shadow-orange-500/20">
                        <Target className="w-4 h-4 text-white" />
                        <span>Masuk NIA Tutoring (/app)</span>
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 🌄 THE BREATHTAKING PARALLAX HERO SCENE */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-20 md:pt-28 md:pb-28 overflow-hidden z-10">
        
        {/* Floating Parallax Badges across the Canvas */}
        <motion.div 
          style={{ y: badge1Y }}
          className="absolute top-28 left-[2%] sm:left-[4%] z-30 hidden xl:flex items-center gap-3 p-3.5 rounded-3xl bg-white/95 backdrop-blur-md border-2 border-white shadow-xl rotate-[-4deg]"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">NIA Tutoring</div>
            <div className="text-xs font-black text-emerald-950">Streak 14 Hari 🔥</div>
          </div>
        </motion.div>

        <motion.div 
          style={{ y: badge2Y }}
          className="absolute top-28 right-[2%] sm:right-[4%] z-30 hidden xl:flex items-center gap-3 p-3.5 rounded-3xl bg-white/95 backdrop-blur-md border-2 border-white shadow-xl rotate-[4deg]"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">MMIS School</div>
            <div className="text-xs font-black text-emerald-950">Presensi QR 98% Hadir</div>
          </div>
        </motion.div>

        <motion.div 
          style={{ y: badge3Y }}
          className="absolute bottom-28 left-[8%] z-30 hidden lg:flex items-center gap-3 p-3.5 rounded-3xl bg-white/95 backdrop-blur-md border-2 border-white shadow-xl rotate-[3deg]"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">Tryout SNBT #5</div>
            <div className="text-xs font-black text-emerald-950">Skor 745 • Top 3%</div>
          </div>
        </motion.div>

        {/* The Outer Signature Framed Viewport (Directly from Dribbble Reference Video) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            style={{ 
              x: smoothMouseX, 
              y: smoothMouseY 
            }}
            className="relative rounded-[2.5rem] sm:rounded-[3.25rem] border-4 sm:border-[6px] border-white shadow-2xl overflow-hidden bg-gradient-to-b from-[#FFF0D4] via-[#FDBA74] to-[#15803D] min-h-[760px] md:min-h-[860px] flex flex-col justify-between"
          >
            
            {/* ☀️ PARALLAX LAYER 1: Golden Sun & Sunset Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div 
                style={{ y: sunY, scale: sunScale }}
                className="absolute top-10 left-1/2 -translate-x-1/2 w-52 h-52 sm:w-80 sm:h-80 rounded-full bg-gradient-to-b from-[#FEF08A] to-[#F59E0B] shadow-[0_0_140px_rgba(245,158,11,0.65)]"
              />
              <div className="absolute top-24 -left-12 w-[28rem] h-32 bg-[#FDBA74]/50 rounded-full blur-2xl" />
              <div className="absolute top-20 -right-12 w-[34rem] h-36 bg-[#FDE047]/40 rounded-full blur-2xl" />
            </div>

            {/* 🏔️ PARALLAX LAYER 2: Terracotta Mountains */}
            <motion.div 
              style={{ y: mountainY }}
              className="absolute inset-x-0 bottom-[28%] sm:bottom-[32%] h-[320px] pointer-events-none"
            >
              <svg 
                viewBox="0 0 1440 340" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-full h-full object-cover"
              >
                <path 
                  d="M0 240L160 150L340 210L560 110L780 190L1020 100L1240 180L1440 130V340H0Z" 
                  fill="#9A3412" 
                  fillOpacity="0.5"
                />
                <path 
                  d="M0 270L220 170L460 230L700 140L940 210L1180 150L1440 210V340H0Z" 
                  fill="#C2410C" 
                  fillOpacity="0.8"
                />
              </svg>
            </motion.div>

            {/* 🌾 PARALLAX LAYER 3: Terraced Green Hills */}
            <motion.div 
              style={{ y: hillsY }}
              className="absolute inset-x-0 bottom-0 h-[380px] sm:h-[460px] pointer-events-none"
            >
              <svg 
                viewBox="0 0 1440 480" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-full h-full object-cover"
              >
                <path 
                  d="M0 200C220 150 460 260 700 180C940 90 1180 230 1440 170V480H0Z" 
                  fill="#65A30D" 
                />
                <path 
                  d="M0 260C180 210 380 300 620 230C860 160 1140 270 1440 210V480H0Z" 
                  fill="#15803D" 
                />
                <path 
                  d="M0 320C220 270 440 350 700 290C960 230 1220 330 1440 280V480H0Z" 
                  fill="#166534" 
                />
                <path 
                  d="M0 380C260 340 520 410 780 350C1040 290 1300 390 1440 340V480H0Z" 
                  fill="#14532D" 
                />
              </svg>

              {/* Cozy Schoolhouse on Hill */}
              <div className="absolute top-[28%] right-[14%] hidden md:flex flex-col items-center drop-shadow-xl">
                <div className="w-12 h-8 bg-[#7C2D12] rounded-t-xl relative flex items-center justify-center">
                  <div className="w-3.5 h-3.5 bg-amber-300 rounded-sm shadow-[0_0_10px_#FDE047]" />
                  <div className="absolute -top-3.5 w-14 h-4 bg-[#451A03] rounded-full" />
                </div>
                <div className="w-16 h-7 bg-[#451A03] rounded-b-lg flex items-center justify-around px-2">
                  <div className="w-2.5 h-3 bg-amber-400/80 rounded-sm" />
                  <div className="w-2.5 h-3 bg-amber-400/80 rounded-sm" />
                </div>
              </div>
            </motion.div>

            {/* 🌿 PARALLAX LAYER 4: Foreground Foliage & Cheerful Mascot */}
            <motion.div 
              style={{ y: foregroundY }}
              className="absolute inset-x-0 bottom-0 pointer-events-none flex items-end justify-between px-6 sm:px-14 z-20"
            >
              <div className="w-40 h-32 sm:w-64 sm:h-52 bg-gradient-to-tr from-[#022c22] to-[#15803D] rounded-t-[5rem] -rotate-12 translate-y-8 blur-[0.5px] opacity-95 shadow-2xl" />
              
              {/* Interactive Mascot with Confetti Click */}
              <div className="pointer-events-auto cursor-pointer pb-4 pr-2 sm:pr-8">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={triggerConfetti}
                  className="bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-3xl border-2 border-white shadow-2xl flex items-center gap-3 group"
                >
                  <Mascot state={mascotMood} className="w-16 h-16 sm:w-20 sm:h-20" />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-black text-emerald-950 flex items-center gap-1">
                      <span>Klik Aku! 🎉</span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700">Maskot NIA & MMIS</div>
                  </div>
                </motion.div>
              </div>

              <div className="w-48 h-36 sm:w-72 sm:h-60 bg-gradient-to-tl from-[#022c22] to-[#166534] rounded-t-[6rem] rotate-12 translate-y-10 blur-[0.5px] opacity-95 shadow-2xl" />
            </motion.div>

            {/* 🌟 HERO INTERACTIVE CONTENT & PROMPT */}
            <div className="relative z-30 p-6 sm:p-10 md:p-14 flex flex-col justify-between h-full">
              
              {/* Top Controls inside Frame */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-white text-emerald-950 text-xs sm:text-sm font-black shadow-md">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Satu Platform Super • MMIS School & NIA Tutoring</span>
                </div>

                <button
                  onClick={toggleSound}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-white text-emerald-950 text-xs font-black shadow-md hover:bg-white transition-all active:scale-95"
                >
                  {soundActive ? <Volume2 className="w-4 h-4 text-emerald-600 animate-bounce" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <span>{soundActive ? "Suara Belajar: Aktif" : "Suara Suasana"}</span>
                  <span className={`w-2 h-2 rounded-full ${soundActive ? "bg-emerald-500" : "bg-amber-500"}`} />
                </button>
              </div>

              {/* Center Stage Headline & Dual Portal Switcher */}
              <motion.div 
                style={{ y: heroCardY, scale: heroCardScale }}
                className="my-2 sm:my-4 max-w-4xl mx-auto text-center flex flex-col items-center"
              >
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-emerald-950 tracking-tight leading-[1.1] mb-3 drop-shadow-sm">
                  Belajar Tanpa Batas,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-700">
                    Tumbuh Bersama
                  </span>{" "}
                  IGNITE.
                </h1>

                <p className="text-sm sm:text-lg text-emerald-950/90 font-black max-w-2xl mb-6 leading-relaxed">
                  Menyatukan sekolah formal di <strong className="underline decoration-emerald-500 decoration-4 text-emerald-950">MMIS School</strong> dan bimbel juara di <strong className="underline decoration-orange-500 decoration-4 text-orange-950">NIA Tutoring</strong>.
                </p>

                {/* 🪟 THE FROSTED GLASS DUAL-PORTAL LAUNCHPAD (Signature Component from Reference Video) */}
                <div 
                  id="launcher"
                  className="w-full max-w-2xl p-6 sm:p-8 rounded-[2.75rem] bg-white/85 backdrop-blur-2xl border-4 border-white shadow-2xl relative text-left"
                >
                  {/* User Logged-in Notice */}
                  {user && (
                    <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-600/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-black text-emerald-950">
                          Halo, {profile?.full_name || user.email}! Anda sedang aktif login.
                        </span>
                      </div>
                      <Link href={getDashboardUrl()}>
                        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white font-black hover:bg-emerald-600 transition-colors flex items-center gap-1 shadow-sm">
                          Ke Dashboard <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Interactive Switcher Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-emerald-900/10 mb-6">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                        Pilih Portal Belajarmu
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-emerald-950">
                        {activePortal === "mmis" ? "MMIS School (Formal School)" : "NIA Tutoring (Intensive Bimbel)"}
                      </h3>
                    </div>

                    {/* Interactive Slider Tabs */}
                    <div className="flex items-center gap-1.5 bg-emerald-900/10 p-1.5 rounded-full">
                      <button 
                        onClick={() => { setActivePortal("mmis"); playSoundChime(); }}
                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                          activePortal === "mmis" ? "bg-white text-emerald-950 shadow-md scale-105" : "text-emerald-800 hover:text-emerald-950"
                        }`}
                      >
                        MMIS School
                      </button>
                      <button 
                        onClick={() => { setActivePortal("nia"); playSoundChime(); }}
                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                          activePortal === "nia" ? "bg-white text-orange-950 shadow-md scale-105" : "text-emerald-800 hover:text-emerald-950"
                        }`}
                      >
                        NIA Tutoring
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Portal Body Preview */}
                  <AnimatePresence mode="wait">
                    {activePortal === "mmis" ? (
                      <motion.div
                        key="mmis"
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 15 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="p-4 rounded-2xl bg-[#F7FBF8] border border-emerald-200/60 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md">
                              <School className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-emerald-950">MMIS School Digital Portal</div>
                              <div className="text-xs text-slate-500 font-bold">Khusus Siswa, Guru, & Wali Kelas</div>
                            </div>
                          </div>
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                            Akreditasi A
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
                          <div className="p-3 rounded-xl bg-white border border-emerald-100 flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-emerald-600" />
                            <span>Presensi QR Scanner</span>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-emerald-100 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>Jadwal KBM & Guru</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Link href="/login" className="w-full block">
                            <button className="w-full py-4 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all active:scale-95">
                              <School className="w-4 h-4" />
                              <span>Masuk ke MMIS School (/login)</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="nia"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="p-4 rounded-2xl bg-[#FFFBF5] border border-orange-200/60 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center font-black shadow-md">
                              <Target className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-emerald-950">NIA Tutoring Bimbel Portal</div>
                              <div className="text-xs text-slate-500 font-bold">Khusus Murid Bimbel & Sukses PTN</div>
                            </div>
                          </div>
                          <span className="text-xs font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                            LiveKit HD
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
                          <div className="p-3 rounded-xl bg-white border border-orange-100 flex items-center gap-2">
                            <Video className="w-4 h-4 text-orange-600" />
                            <span>Virtual Classroom PIP</span>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-orange-100 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-orange-600" />
                            <span>CBT Drills & KaTeX</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Link href="/app" className="w-full block">
                            <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-95">
                              <Target className="w-4 h-4" />
                              <span>Masuk ke NIA Tutoring (/app)</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* PWA Helper Prompt */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <PwaInstallButton />
                  </div>
                </div>

              </motion.div>

              {/* Bottom Scenic Footnote */}
              <div className="flex items-center justify-between text-xs font-black text-emerald-950/80 pt-2">
                <span>© MMIS School & NIA Tutoring Unified Platform</span>
                <span>WebRTC • KaTeX • Supabase SSR</span>
              </div>

            </div>

          </motion.div>
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 🌾 SECTION 2: DUA SAYAP IGNITE (STAGGERED PARALLAX SHOWCASE) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="ekosistem" className="py-28 relative z-20 bg-[#F5F1E8] border-t border-amber-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
              Harmoni Dua Sayap Pendidikan
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-emerald-950 mt-4 mb-4">
              Satu Ekosistem, Dua Portal Berbeda
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-bold">
              Pelajari peran spesifik antara sekolah formal di MMIS School dan bimbingan belajar intensif di NIA Tutoring.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Wing 1: MMIS School Card (with Staggered Parallax Y) */}
            <motion.div 
              style={{ y: wingLeftY }}
              whileHover={{ y: -8 }} 
              className="p-8 sm:p-12 rounded-[2.75rem] bg-white border-2 border-emerald-600/20 shadow-xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
                  <School className="w-8 h-8" />
                </div>
                <Link href="/login">
                  <button className="px-5 py-2.5 rounded-2xl text-xs font-black text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-2">
                    <span>Buka Portal /login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-3">
                MMIS School: Sistem Operasional Sekolah Formal
              </h3>
              <p className="text-slate-600 text-sm sm:text-base font-bold mb-8 leading-relaxed">
                Diperuntukkan bagi ekosistem sekolah resmi (SD, SMP, SMA). Memudahkan guru menyusun jadwal KBM, mencatat jurnal harian, memvalidasi kehadiran absensi QR, dan menghasilkan e-rapor komprehensif.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#F7FBF8] border border-emerald-100">
                  <QrCode className="w-5 h-5 text-emerald-700 mb-2" />
                  <h4 className="text-sm font-black text-emerald-950">Presensi QR Pintar</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">Validasi absensi murid & piket guru anti curang.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#F7FBF8] border border-emerald-100">
                  <Calendar className="w-5 h-5 text-emerald-700 mb-2" />
                  <h4 className="text-sm font-black text-emerald-950">Jadwal Pelajaran KBM</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">Sinkronisasi jam mengajar, ruang, & silabus kelas.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#F7FBF8] border border-emerald-100">
                  <FileText className="w-5 h-5 text-emerald-700 mb-2" />
                  <h4 className="text-sm font-black text-emerald-950">E-Rapor Digital</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">Rekapitulasi otomatis nilai harian, UTS, & rapor akhir.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#F7FBF8] border border-emerald-100">
                  <Users className="w-5 h-5 text-emerald-700 mb-2" />
                  <h4 className="text-sm font-black text-emerald-950">Portal Multi-Role</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">Akses khusus Kepala Sekolah, Guru, Staf, & Orang Tua.</p>
                </div>
              </div>
            </motion.div>

            {/* Wing 2: NIA Tutoring Card (with Staggered Parallax Y) */}
            <motion.div 
              style={{ y: wingRightY }}
              whileHover={{ y: -8 }} 
              className="p-8 sm:p-12 rounded-[2.75rem] bg-white border-2 border-orange-500/20 shadow-xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Target className="w-8 h-8" />
                </div>
                <Link href="/app">
                  <button className="px-5 py-2.5 rounded-2xl text-xs font-black text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-200 flex items-center gap-2">
                    <span>Buka Portal /app</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-3">
                NIA Tutoring: Akselerasi Juara & Sukses PTN
              </h3>
              <p className="text-slate-600 text-sm sm:text-base font-bold mb-8 leading-relaxed">
                Diperuntukkan bagi bimbingan belajar intensif dan persiapan seleksi PTN (UTBK-SNBT, Mandiri, & Kedinasan). Menghadirkan kelas interaktif LiveKit, tryout CBT tajam, dan klinik privat 1-on-1.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#FFFBF5] border border-orange-100">
                  <Video className="w-5 h-5 text-orange-600 mb-2" />
                  <h4 className="text-sm font-black text-emerald-950">Virtual Classroom LiveKit</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">PIP webcam draggable, audio share screen, & polling kuis.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FFFBF5] border border-orange-100">
                  <BookOpen className="w-5 h-5 text-orange-600 mb-2" />
                  <h4 className="text-sm font-black text-emerald-950">CBT Tryout & Drills</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">Simulasi standar SNBT, timer real-time, & rumus KaTeX.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FFFBF5] border border-orange-100">
                  <Heart className="w-5 h-5 text-orange-600 mb-2" />
                  <h4 className="text-sm font-black text-emerald-950">Klinik Konsultasi 1-on-1</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">Bedah PR dan materi sulit langsung bersama tutor ahli.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FFFBF5] border border-orange-100">
                  <Flame className="w-5 h-5 text-orange-600 mb-2" />
                  <h4 className="text-sm font-black text-emerald-950">Gamifikasi XP & Streak</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">Koleksi poin belajar harian, lencana penghargaan, & ranking.</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 🚀 SECTION 3: PARALLAX FEATURE CARDS GRID */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="fitur" className="py-28 relative z-20 bg-[#FAF6EE] border-t border-amber-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900 px-4 py-1.5 rounded-full bg-amber-200/80 border border-amber-300">
              Teknologi Pendidikan Terdepan
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-emerald-950 mt-4 mb-4">
              Dibangun dengan Standar Kualitas Tertinggi
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-bold">
              Infrastruktur canggih yang membuat belajar menjadi mudah, interaktif, dan terukur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="p-8 rounded-[2.5rem] bg-white border-2 border-emerald-100 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black mb-6">
                  <Video className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-emerald-950 mb-3">Live Classroom HD Tanpa Lag</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed mb-6">
                  Engine WebRTC LiveKit memungkinkan interaksi dua arah seketika. Siswa dapat menggeser webcam tutor ke pojok layar sesuka hati saat menyimak share screen materi.
                </p>
              </div>
              <div className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Webcam PIP Draggable & Audio Share</span>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="p-8 rounded-[2.5rem] bg-white border-2 border-orange-100 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-900 flex items-center justify-center font-black mb-6">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-emerald-950 mb-3">CBT & Drills Berbasis KaTeX</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed mb-6">
                  Ucapkan selamat tinggal pada rumus matematika buram hasil tangkapan layar. Sistem rendering LaTeX KaTeX memastikan rumus integral, matriks, dan fisika tampil tajam.
                </p>
              </div>
              <div className="text-xs font-black text-orange-800 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-orange-600" />
                <span>Format Soal Standar UTBK SNBT</span>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="p-8 rounded-[2.5rem] bg-white border-2 border-emerald-100 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black mb-6">
                  <Laptop className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-emerald-950 mb-3">Ringan & Praktis Berbasis PWA</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed mb-6">
                  Buka dari browser apa pun dan instal langsung ke home screen HP Anda. Lebih hemat kuota, hemat memori penyimpanan, dan responsif di tablet maupun laptop.
                </p>
              </div>
              <div className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Kompatibel Android, iOS, Windows, & Mac</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 🏆 SECTION 4: TESTIMONIALS & KISAH SUKSES */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="prestasi" className="py-28 relative z-20 bg-[#F5F1E8] border-t border-amber-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
              Keluarga Besar IGNITE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-emerald-950 mt-4 mb-4">
              Kisah Nyata dari Siswa & Pengajar
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-bold">
              Bagaimana integrasi MMIS School dan NIA Tutoring mewujudkan mimpi-mimpi besar mereka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Testimonial 1 */}
            <div className="p-8 rounded-[2.5rem] bg-white border-2 border-emerald-100 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm font-bold leading-relaxed italic mb-6">
                  &ldquo;Di MMIS School semua tugas dan absensi QR sangat teratur. Ditambah bimbingan intensif NIA Tutoring saat malam hari, aku berhasil lolos ke Kedokteran UI tanpa panik!&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  AR
                </div>
                <div>
                  <div className="text-sm font-black text-emerald-950">Alya Rahmadhani</div>
                  <div className="text-xs font-bold text-emerald-700">Lolos FK UI • Siswa MMIS & NIA</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 rounded-[2.5rem] bg-white border-2 border-orange-100 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm font-bold leading-relaxed italic mb-6">
                  &ldquo;Fitur PIP webcam di kelas virtual NIA Tutoring beneran memudahkan fokus. Soal-soal drill CBT-nya sangat mirip dengan tipe soal asli UTBK SNBT.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center font-black">
                  DF
                </div>
                <div>
                  <div className="text-sm font-black text-emerald-950">Daffa Fadillah</div>
                  <div className="text-xs font-bold text-orange-800">Lolos STEI-R ITB • Alumni NIA</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-8 rounded-[2.5rem] bg-white border-2 border-emerald-100 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm font-bold leading-relaxed italic mb-6">
                  &ldquo;Sebagai guru di MMIS School, portal penilaian dan jurnal sangat menghemat waktu kami. Rekap nilai otomatis dan orang tua bisa memantau perkembangan anak secara transparan.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black">
                  BP
                </div>
                <div>
                  <div className="text-sm font-black text-emerald-950">Budi Pratama, M.Pd</div>
                  <div className="text-xs font-bold text-emerald-700">Guru MIPA • MMIS School</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ❓ SECTION 5: FAQ ACCORDION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-28 bg-[#FAF6EE] relative z-20 border-t border-amber-900/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
              Pertanyaan yang Sering Diajukan
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-emerald-950 mt-4 mb-4">
              Punya Pertanyaan Seputar IGNITE?
            </h2>
            <p className="text-slate-600 text-base font-bold">
              Temukan jawaban seputar akses MMIS School dan NIA Tutoring di bawah ini.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-3xl bg-white border-2 border-amber-900/10 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-black text-emerald-950 hover:text-emerald-700 transition-colors"
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-emerald-700 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-6 pb-6 text-sm font-bold text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 🌅 GRAND SUNSET HORIZON CALL-TO-ACTION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[3rem] p-10 sm:p-16 bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#065F46] text-white text-center relative overflow-hidden shadow-2xl border-4 border-white">
            
            {/* Background Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-amber-400/25 rounded-full blur-[110px] pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
                Mulai Hari Ini Bersama IGNITE
              </span>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-6">
                Siap Melangkah Menuju Prestasi Terbaikmu?
              </h2>

              <p className="text-white/90 text-base sm:text-lg font-bold mb-10 leading-relaxed">
                Pilih portal yang sesuai dengan kebutuhan belajarmu hari ini dan nikmati kemudahan akses di semua perangkat.
              </p>

              {/* Dual Big CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
                <Link href="/login" className="w-full sm:w-1/2">
                  <button className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95">
                    <School className="w-4 h-4 text-emerald-600" />
                    <span>MMIS School</span>
                  </button>
                </Link>

                <Link href="/app" className="w-full sm:w-1/2">
                  <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-white font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95">
                    <Target className="w-4 h-4 text-white" />
                    <span>NIA Tutoring</span>
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ⚓ FOOTER BERSIH & RAMAH */}
      <footer className="border-t border-amber-900/10 bg-[#FAF6EE] relative z-20 pt-16 pb-12 text-slate-600 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-amber-900/10">
            
            {/* Col 1: Bio */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md font-black">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-xl font-black text-emerald-950 tracking-tight">IGNITE LMS</span>
              </div>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                Ekosistem terintegrasi yang menyatukan manajemen sekolah formal di <strong>MMIS School</strong> dan bimbingan belajar intensif di <strong>NIA Tutoring</strong>.
              </p>
              <div className="text-xs font-black text-emerald-800">
                © {new Date().getFullYear()} IGNITE LMS • Hak Cipta Dilindungi
              </div>
            </div>

            {/* Col 2: MMIS School */}
            <div className="space-y-3">
              <div className="text-emerald-950 font-black text-sm tracking-wider uppercase">MMIS School</div>
              <ul className="space-y-2 text-xs font-bold text-slate-500">
                <li><Link href="/login" className="hover:text-emerald-900">Portal Siswa & Wali Murid</Link></li>
                <li><Link href="/login" className="hover:text-emerald-900">Portal Guru & Presensi QR</Link></li>
                <li><Link href="/login" className="hover:text-emerald-900">Jadwal KBM & Modul Ajar</Link></li>
                <li><Link href="/login" className="hover:text-emerald-900">E-Rapor Digital</Link></li>
              </ul>
            </div>

            {/* Col 3: NIA Tutoring */}
            <div className="space-y-3">
              <div className="text-emerald-950 font-black text-sm tracking-wider uppercase">NIA Tutoring</div>
              <ul className="space-y-2 text-xs font-bold text-slate-500">
                <li><Link href="/app" className="hover:text-emerald-900">Portal Bimbel /app</Link></li>
                <li><Link href="/app" className="hover:text-emerald-900">Virtual Class LiveKit</Link></li>
                <li><Link href="/app" className="hover:text-emerald-900">Tryout CBT & Drills SNBT</Link></li>
                <li><Link href="/app" className="hover:text-emerald-900">Klinik Konsultasi 1-on-1</Link></li>
              </ul>
            </div>

            {/* Col 4: Keamanan & Status */}
            <div className="space-y-3">
              <div className="text-emerald-950 font-black text-sm tracking-wider uppercase">Infrastruktur & Status</div>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                Didukung arsitektur cloud WebRTC berlatensi rendah dengan penyimpanan data terenkripsi.
              </p>
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-emerald-100 text-xs font-bold text-emerald-800 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Semua Layanan Berjalan Normal (100% Uptime)</span>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
            <div>
              IGNITE: Bersama Membina Generasi Emas Indonesia
            </div>
            <div className="flex items-center gap-6">
              <a href="#ekosistem" className="hover:text-emerald-800">Syarat & Ketentuan</a>
              <a href="#ekosistem" className="hover:text-emerald-800">Kebijakan Privasi</a>
              <a href="#faq" className="hover:text-emerald-800">Pusat Bantuan</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
