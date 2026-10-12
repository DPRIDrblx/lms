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
  HelpCircle,
  Menu,
  X,
  Volume2,
  VolumeX,
  Laptop,
  Heart,
  Smile,
  Compass,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PwaInstallButton } from "@/components/ui/pwa-install-button";
import { Mascot } from "@/components/ui/mascot";

export default function RootPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Navigation & Interactive States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalTab, setPortalTab] = useState<"all" | "mmis" | "nia">("all");
  const [activeFeatureTab, setActiveFeatureTab] = useState<"school" | "tutoring" | "cbt" | "live">("school");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mascotState, setMascotState] = useState<"idle" | "correct">("idle");
  const [soundOn, setSoundOn] = useState(false);
  const [sliderPosition, setSliderPosition] = useState<number>(65);

  // Scroll Parallax Hooks
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Hero Parallax Layer References & Transforms
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Multilayer Scenic Parallax (Inspired by the Dribbble Reference Video)
  // Far sky & sun move slowest
  const sunY = useTransform(heroProgress, [0, 1], [0, 80]);
  const sunScale = useTransform(heroProgress, [0, 1], [1, 1.15]);
  // Midground terracotta mountains
  const mountainY = useTransform(heroProgress, [0, 1], [0, 140]);
  // Terraced green hills
  const hillsY = useTransform(heroProgress, [0, 1], [0, 220]);
  // Foreground lush tea plants & character
  const foregroundY = useTransform(heroProgress, [0, 1], [0, 320]);
  // Central framed viewport scaling/morphing
  const frameScale = useTransform(heroProgress, [0, 0.8], [1, 0.94]);
  const frameY = useTransform(heroProgress, [0, 1], [0, 60]);
  // Floating frosted cards parallax offset
  const cardFloat1Y = useTransform(heroProgress, [0, 1], [0, -140]);
  const cardFloat2Y = useTransform(heroProgress, [0, 1], [0, -80]);

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
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-4 text-emerald-950">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full shadow-lg shadow-amber-400/20"
        />
        <p className="text-amber-900 text-sm font-bold tracking-wide">Menyiapkan Ruang Belajar IGNITE...</p>
      </div>
    );
  }

  const faqs = [
    {
      q: "Apa perbedaan antara MMIS School dan NIA Tutoring di dalam IGNITE?",
      a: "IGNITE adalah ekosistem super-platform yang menaungi dua layanan terpadu: MMIS School (/login) untuk operasional sekolah formal (jadwal pelajaran, presensi QR, penilaian guru, dan e-rapor), serta NIA Tutoring (/app) untuk bimbingan belajar intensif (persiapan UTBK-SNBT, klinik konsultasi 1-on-1, tryout CBT, dan kelas interaktif LiveKit)."
    },
    {
      q: "Bagaimana cara murid atau guru masuk ke MMIS School?",
      a: "Bagi siswa, guru, wali murid, dan staf MMIS School, cukup klik tombol 'Masuk MMIS School' di navbar atau portal selector untuk diarahkan ke halaman login resmi (/login)."
    },
    {
      q: "Bagaimana cara siswa les masuk ke NIA Tutoring?",
      a: "Bagi siswa bimbingan belajar NIA, tutor, dan sobat NIA, klik 'Masuk NIA Tutoring' untuk diarahkan langsung ke portal belajar NIA Tutoring (/app)."
    },
    {
      q: "Apakah platform ini bisa diakses di smartphone tanpa download aplikasi besar?",
      a: "Tentu! IGNITE dilengkapi teknologi Progressive Web App (PWA) yang sangat ringan. Anda cukup membuka website di browser HP lalu klik 'Install Aplikasi PWA' untuk menyimpan ikon aplikasi di layar utama."
    },
    {
      q: "Bagaimana sistem kelas online dan klinik konsultasi bekerja?",
      a: "Kelas online menggunakan teknologi video HD real-time LiveKit berlatensi rendah, dengan fitur webcam PIP yang dapat digeser bebas, share screen bersuara jernih, dan polling kuis instan. Sedangkan Klinik Konsultasi memungkinkan siswa booking sesi bedah soal 1-on-1 bersama tutor ahli."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-800 font-sans selection:bg-amber-400 selection:text-emerald-950 overflow-x-hidden relative">
      
      {/* 🚀 Parallax Top Progress Bar (Warm Sunrise Colors) */}
      <motion.div 
        style={{ scaleX: smoothProgress }}
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500 z-50 origin-left"
      />

      {/* 🧭 Sticky Fun Frosted Glass Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#FAF7F2]/80 border-b border-amber-900/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-emerald-500 flex items-center justify-center shadow-md shadow-amber-500/25 border-2 border-white group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-emerald-950">IGNITE</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-400/30 text-amber-900 border border-amber-500/30">
                  LMS & School
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 tracking-wider">
                MMIS School & NIA Tutoring
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#ekosistem" className="hover:text-emerald-800 transition-colors">Dua Sayap IGNITE</a>
            <a href="#fitur" className="hover:text-emerald-800 transition-colors">Fitur Unggulan</a>
            <a href="#prestasi" className="hover:text-emerald-800 transition-colors">Kisah Sukses</a>
            <a href="#faq" className="hover:text-emerald-800 transition-colors">Tanya Jawab</a>
          </nav>

          {/* Dual Action Login Portals */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* MMIS School Portal Link */}
            <Link href="/login">
              <button className="px-4 py-2.5 rounded-xl text-xs font-black text-emerald-900 bg-white hover:bg-emerald-50 border-2 border-emerald-700/20 hover:border-emerald-700/40 shadow-sm transition-all flex items-center gap-1.5 active:scale-95">
                <School className="w-4 h-4 text-emerald-600" />
                <span>MMIS School</span>
              </button>
            </Link>

            {/* NIA Tutoring Portal Link */}
            <Link href="/app">
              <button className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 active:scale-95">
                <Target className="w-4 h-4 text-white" />
                <span>NIA Tutoring</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="lg:hidden p-2.5 rounded-xl bg-white border border-amber-900/15 text-slate-700 hover:text-emerald-800 shadow-sm"
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
              className="lg:hidden border-b border-amber-900/10 bg-[#FAF7F2]/95 backdrop-blur-2xl px-6 py-6 flex flex-col gap-4 overflow-hidden"
            >
              <a 
                href="#ekosistem" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-bold text-slate-700 hover:text-emerald-800 py-1"
              >
                Dua Sayap IGNITE (MMIS & NIA)
              </a>
              <a 
                href="#fitur" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-bold text-slate-700 hover:text-emerald-800 py-1"
              >
                Fitur Unggulan
              </a>
              <a 
                href="#prestasi" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-bold text-slate-700 hover:text-emerald-800 py-1"
              >
                Kisah Sukses
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-base font-bold text-slate-700 hover:text-emerald-800 py-1"
              >
                Tanya Jawab (FAQ)
              </a>

              <div className="pt-4 border-t border-amber-900/10 flex flex-col gap-3">
                <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Pilih Portal Masuk:
                </div>
                <Link href="/login" className="w-full">
                  <button className="w-full py-3.5 rounded-xl font-black text-center bg-white border-2 border-emerald-600/30 text-emerald-900 flex items-center justify-center gap-2 shadow-sm">
                    <School className="w-4 h-4 text-emerald-600" />
                    <span>Masuk MMIS School (/login)</span>
                  </button>
                </Link>
                <Link href="/app" className="w-full">
                  <button className="w-full py-3.5 rounded-xl font-black text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center gap-2 shadow-md shadow-orange-500/20">
                    <Target className="w-4 h-4 text-white" />
                    <span>Masuk NIA Tutoring (/app)</span>
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 🌄 THE PARALLAX SCENIC HERO (WARM SUNRISE & TERRACED HILLS) */}
      <section ref={heroRef} className="relative pt-6 pb-20 md:pt-10 md:pb-32 overflow-hidden z-10">
        
        {/* The Outer Framed Viewport (Inspired directly by the Dribbble Reference Video) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            style={{ 
              scale: frameScale,
              y: frameY 
            }}
            className="relative rounded-[2.5rem] sm:rounded-[3.25rem] border-4 sm:border-[6px] border-white shadow-2xl overflow-hidden bg-gradient-to-b from-[#FFF2D6] via-[#FED7AA] to-[#86EFAC] min-h-[640px] md:min-h-[760px] flex flex-col justify-between"
          >
            
            {/* ☀️ PARALLAX LAYER 1: Deep Sky & Golden Sun */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div 
                style={{ y: sunY, scale: sunScale }}
                className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-b from-[#FEF08A] to-[#F59E0B] shadow-[0_0_90px_rgba(245,158,11,0.55)] opacity-90"
              />
              {/* Soft Golden Sunset Clouds */}
              <div className="absolute top-28 -left-12 w-96 h-28 bg-[#FDBA74]/40 rounded-full blur-2xl" />
              <div className="absolute top-20 -right-16 w-[28rem] h-32 bg-[#FDE047]/40 rounded-full blur-2xl" />
            </div>

            {/* 🏔️ PARALLAX LAYER 2: Warm Terracotta Mountains */}
            <motion.div 
              style={{ y: mountainY }}
              className="absolute inset-x-0 bottom-[22%] sm:bottom-[24%] h-[280px] pointer-events-none"
            >
              <svg 
                viewBox="0 0 1440 320" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-full h-full object-cover preserve-3d"
              >
                <path 
                  d="M0 240L180 160L360 210L560 120L760 190L980 110L1200 180L1440 140V320H0Z" 
                  fill="#C2410C" 
                  fillOpacity="0.45"
                />
                <path 
                  d="M0 260L240 180L480 230L720 150L960 210L1200 160L1440 220V320H0Z" 
                  fill="#EA580C" 
                  fillOpacity="0.6"
                />
              </svg>
            </motion.div>

            {/* 🌾 PARALLAX LAYER 3: Terraced Green Hills (Tea Plantation Contour Layers) */}
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
                {/* Hill Tier 1 (Back Lime) */}
                <path 
                  d="M0 220C240 170 480 280 720 190C960 100 1200 240 1440 180V480H0Z" 
                  fill="#65A30D" 
                />
                {/* Hill Tier 2 (Emerald Terraces with steps) */}
                <path 
                  d="M0 280C190 230 380 320 620 250C860 180 1150 290 1440 230V480H0Z" 
                  fill="#15803D" 
                />
                {/* Stepped Contour Curves */}
                <path 
                  d="M0 340C220 290 440 370 700 310C960 250 1220 350 1440 300V480H0Z" 
                  fill="#166534" 
                />
                {/* Hill Tier 3 (Deep Tea Green Base) */}
                <path 
                  d="M0 400C260 360 520 430 780 370C1040 310 1300 410 1440 360V480H0Z" 
                  fill="#14532D" 
                />
              </svg>

              {/* Cozy Little Schoolhouse on the Hill */}
              <div className="absolute top-[28%] right-[14%] hidden md:flex flex-col items-center drop-shadow-md">
                <div className="w-10 h-7 bg-[#9A3412] rounded-t-lg relative flex items-center justify-center">
                  <div className="w-3 h-3 bg-amber-300 rounded-sm shadow-inner" />
                  <div className="absolute -top-3 w-12 h-3.5 bg-[#7C2D12] rounded-full" />
                </div>
                <div className="w-14 h-6 bg-[#7C2D12] rounded-b-md" />
              </div>
            </motion.div>

            {/* 🌿 PARALLAX LAYER 4: Foreground Tea Leaves & Friendly Mascot */}
            <motion.div 
              style={{ y: foregroundY }}
              className="absolute inset-x-0 bottom-0 pointer-events-none flex items-end justify-between px-6 sm:px-12 z-20"
            >
              {/* Left Foreground Foliage */}
              <div className="w-36 h-28 sm:w-56 sm:h-44 bg-gradient-to-tr from-[#052E16] to-[#166534] rounded-t-[4rem] -rotate-12 translate-y-8 blur-[0.5px] opacity-90 shadow-2xl" />
              
              {/* Cheerful Mascot in Foreground (like the character in the video!) */}
              <div className="pointer-events-auto cursor-pointer pb-4 pr-2 sm:pr-8">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  onMouseEnter={() => setMascotState("correct")}
                  onMouseLeave={() => setMascotState("idle")}
                  className="bg-white/80 backdrop-blur-md p-3 sm:p-4 rounded-3xl border-2 border-white shadow-xl flex items-center gap-3"
                >
                  <Mascot state={mascotState} className="w-16 h-16 sm:w-20 sm:h-20" />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-black text-emerald-950">Halo, Sobat IGNITE! 👋</div>
                    <div className="text-[11px] font-bold text-emerald-700">Pilih sekolah atau bimbel di atas ya!</div>
                  </div>
                </motion.div>
              </div>

              {/* Right Foreground Foliage */}
              <div className="w-44 h-32 sm:w-64 sm:h-52 bg-gradient-to-tl from-[#052E16] to-[#15803D] rounded-t-[5rem] rotate-12 translate-y-10 blur-[0.5px] opacity-90 shadow-2xl" />
            </motion.div>

            {/* 🌟 HERO CONTENT INSIDE THE FRAME */}
            <div className="relative z-30 p-6 sm:p-12 md:p-16 flex flex-col justify-between h-full">
              
              {/* Top Pill Tags & Brand Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 backdrop-blur-md border border-white text-emerald-950 text-xs sm:text-sm font-black shadow-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Satu Ekosistem Super • Dua Masa Depan Cerah</span>
                </div>

                {/* Sound / Ambient Toggle Pill (As seen in the Dribbble Reference Video) */}
                <button
                  onClick={() => setSoundOn(!soundOn)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 backdrop-blur-md border border-white text-emerald-950 text-xs font-black shadow-md hover:bg-white transition-all active:scale-95"
                >
                  {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <span>{soundOn ? "Suara Suasana: Aktif 🍃" : "Suara Suasana"}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </button>
              </div>

              {/* Center Main Stage & Frosted Glass Controller Card */}
              <div className="my-10 max-w-4xl mx-auto text-center flex flex-col items-center">
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl sm:text-6xl md:text-7xl font-black text-emerald-950 tracking-tight leading-[1.08] mb-6 drop-shadow-sm"
                >
                  Belajar Tanpa Batas,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-700">
                    Tumbuh Bersama
                  </span>{" "}
                  IGNITE.
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-base sm:text-xl text-emerald-950/85 font-bold max-w-2xl mb-8 leading-relaxed drop-shadow-sm"
                >
                  Menghubungkan pendidikan formal di <strong className="text-emerald-900 underline decoration-amber-400 decoration-4">MMIS School</strong> dan bimbingan belajar intensif di <strong className="text-orange-900 underline decoration-orange-400 decoration-4">NIA Tutoring</strong> dalam satu genggaman.
                </motion.p>

                {/* 🪟 CENTRAL FROSTED GLASS DUAL-PORTAL CARD (Inspired by the Video Reference) */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="w-full max-w-2xl p-6 sm:p-8 rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border-2 sm:border-4 border-white shadow-2xl relative text-left"
                >
                  {/* Card Header & Interactive Slider */}
                  <div className="flex items-center justify-between pb-5 border-b border-emerald-900/10 mb-6">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                        Pintu Gerbang Belajar
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-emerald-950">
                        Pilih Portal Aksesmu Sekarang
                      </h3>
                    </div>

                    {/* Interactive Slider Pill Indicator */}
                    <div className="hidden sm:flex items-center gap-2 bg-emerald-900/10 p-1.5 rounded-full">
                      <button 
                        onClick={() => setPortalTab("mmis")}
                        className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                          portalTab === "mmis" ? "bg-white text-emerald-900 shadow-sm" : "text-emerald-800 hover:text-emerald-950"
                        }`}
                      >
                        MMIS
                      </button>
                      <button 
                        onClick={() => setPortalTab("all")}
                        className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                          portalTab === "all" ? "bg-white text-emerald-900 shadow-sm" : "text-emerald-800 hover:text-emerald-950"
                        }`}
                      >
                        Keduanya
                      </button>
                      <button 
                        onClick={() => setPortalTab("nia")}
                        className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                          portalTab === "nia" ? "bg-white text-orange-950 shadow-sm" : "text-emerald-800 hover:text-emerald-950"
                        }`}
                      >
                        NIA
                      </button>
                    </div>
                  </div>

                  {/* Dual Portal Selection Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* 🏫 PORTAL 1: MMIS School */}
                    <Link 
                      href="/login" 
                      className="group p-5 rounded-3xl bg-gradient-to-br from-white to-emerald-50/80 border-2 border-emerald-600/30 hover:border-emerald-600 hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                          <School className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-emerald-950">MMIS School</h4>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            /login
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-semibold mt-2 leading-relaxed">
                          Portal resmi siswa, guru, & wali kelas. Absensi QR pintar, jadwal harian, e-rapor, dan kelas digital.
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-emerald-900/10 flex items-center justify-between text-xs font-black text-emerald-800 group-hover:text-emerald-950">
                        <span>Masuk Sekolah</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </div>
                    </Link>

                    {/* 🎯 PORTAL 2: NIA Tutoring */}
                    <Link 
                      href="/app" 
                      className="group p-5 rounded-3xl bg-gradient-to-br from-white to-amber-50/80 border-2 border-orange-500/30 hover:border-orange-500 hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                          <Target className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-emerald-950">NIA Tutoring</h4>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-900">
                            /app
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-semibold mt-2 leading-relaxed">
                          Bimbel intensif UTBK-SNBT. Live Class LiveKit, CBT & Drills adaptif, klinik privat 1-on-1, dan gamifikasi XP.
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-orange-900/10 flex items-center justify-between text-xs font-black text-orange-800 group-hover:text-orange-950">
                        <span>Mulai Bimbingan</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </div>
                    </Link>

                  </div>

                  {/* PWA Direct Installation Button */}
                  <div className="mt-5 pt-4 border-t border-emerald-900/10">
                    <PwaInstallButton />
                  </div>

                </motion.div>

              </div>

              {/* Bottom Quick Footnote inside Hero Frame */}
              <div className="flex items-center justify-between text-xs font-black text-emerald-950/70 pt-4">
                <span>© MMIS School & NIA Tutoring Unified Platform</span>
                <span>Didukung Teknologi WebRTC & Supabase</span>
              </div>

            </div>

          </motion.div>
        </div>

      </section>

      {/* 🌿 DUA SAYAP IGNITE: MMIS SCHOOL & NIA TUTORING SHOWCASE */}
      <section id="ekosistem" className="py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
              Harmoni Dua Dunia Pendidikan
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-emerald-950 mt-4 mb-4">
              Semua Kebutuhan Belajar dalam Satu Atap
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-medium">
              Baik aktivitas kurikulum harian sekolah formal maupun akselerasi persiapan ujian masuk perguruan tinggi negeri, IGNITE hadir mendampingi setiap langkahmu.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Wing 1: MMIS School */}
            <motion.div 
              whileHover={{ y: -6 }} 
              className="p-8 sm:p-10 rounded-[2.5rem] bg-white border-2 border-emerald-600/20 shadow-xl shadow-emerald-900/5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
                  <School className="w-7 h-7" />
                </div>
                <Link href="/login">
                  <button className="px-4 py-2 rounded-xl text-xs font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5">
                    <span>Akses Portal /login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-3">
                MMIS School: Sistem Akademik Sekolah Cerdas
              </h3>
              <p className="text-slate-600 text-sm sm:text-base font-medium mb-8 leading-relaxed">
                Dirancang khusus untuk mendukung operasional harian sekolah. Guru, siswa, dan wali murid saling terhubung dalam ekosistem digital yang tertib dan akuntabel.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#F7FBF8] border border-emerald-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-200/60 flex items-center justify-center text-emerald-800 mb-2 font-black">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-950">Presensi & QR Scanner</h4>
                  <p className="text-xs text-slate-500 mt-1">Absensi harian cepat dan validasi piket guru real-time.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7FBF8] border border-emerald-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-200/60 flex items-center justify-center text-emerald-800 mb-2 font-black">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-950">Jadwal Pelajaran KBM</h4>
                  <p className="text-xs text-slate-500 mt-1">Sinkronisasi ruang kelas, mata pelajaran, dan modul ajar.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7FBF8] border border-emerald-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-200/60 flex items-center justify-center text-emerald-800 mb-2 font-black">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-950">E-Rapor & Jurnal Guru</h4>
                  <p className="text-xs text-slate-500 mt-1">Rekap nilai tugas, UTS, UAS, dan catatan wali kelas.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7FBF8] border border-emerald-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-200/60 flex items-center justify-center text-emerald-800 mb-2 font-black">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-950">Portal Multi-Peran</h4>
                  <p className="text-xs text-slate-500 mt-1">Akses khusus Kepala Sekolah, Guru, Staf, & Orang Tua.</p>
                </div>
              </div>
            </motion.div>

            {/* Wing 2: NIA Tutoring */}
            <motion.div 
              whileHover={{ y: -6 }} 
              className="p-8 sm:p-10 rounded-[2.5rem] bg-white border-2 border-orange-500/20 shadow-xl shadow-orange-900/5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Target className="w-7 h-7" />
                </div>
                <Link href="/app">
                  <button className="px-4 py-2 rounded-xl text-xs font-black text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors flex items-center gap-1.5">
                    <span>Akses Portal /app</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-3">
                NIA Tutoring: Akselerasi Juara & Sukses PTN
              </h3>
              <p className="text-slate-600 text-sm sm:text-base font-medium mb-8 leading-relaxed">
                Bimbingan belajar intensif dengan kurikulum adaptif. Dari pemahaman konsep paling mendasar hingga trik cepat menembus ujian seleksi PTN dan Kedinasan.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FFFBF5] border border-orange-100">
                  <div className="w-8 h-8 rounded-xl bg-orange-200/60 flex items-center justify-center text-orange-900 mb-2 font-black">
                    <Video className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-950">Virtual Classroom LiveKit</h4>
                  <p className="text-xs text-slate-500 mt-1">Webcam PIP draggable, audio share screen, dan polling.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFFBF5] border border-orange-100">
                  <div className="w-8 h-8 rounded-xl bg-orange-200/60 flex items-center justify-center text-orange-900 mb-2 font-black">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-950">CBT Tryout & Drills</h4>
                  <p className="text-xs text-slate-500 mt-1">Simulasi standar SNBT, timer real-time, & rumus KaTeX.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFFBF5] border border-orange-100">
                  <div className="w-8 h-8 rounded-xl bg-orange-200/60 flex items-center justify-center text-orange-900 mb-2 font-black">
                    <Heart className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-950">Klinik Konsultasi 1-on-1</h4>
                  <p className="text-xs text-slate-500 mt-1">Sesi privat kupas tuntas PR dan materi sulit kapan saja.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFFBF5] border border-orange-100">
                  <div className="w-8 h-8 rounded-xl bg-orange-200/60 flex items-center justify-center text-orange-900 mb-2 font-black">
                    <Flame className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-950">Gamifikasi XP & Streak</h4>
                  <p className="text-xs text-slate-500 mt-1">Koleksi poin belajar harian, lencana, & leaderboard seru.</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 🚀 FITUR UNGGULAN DENGAN PARALLAX SLIDER */}
      <section id="fitur" className="py-24 bg-[#F5F2EB] relative z-20 border-y border-amber-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900 px-4 py-1.5 rounded-full bg-amber-200/70 border border-amber-300">
              Fitur Lengkap & Canggih
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-emerald-950 mt-4 mb-4">
              Teknologi Pendidikan Tanpa Kompromi
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-medium">
              Dirancang dengan perhatian penuh pada pengalaman belajar siswa dan kemudahan kerja pengajar.
            </p>
          </div>

          {/* Interactive Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {[
              { id: "school", label: "MMIS Digital School", icon: School },
              { id: "live", label: "Live Classroom (LiveKit)", icon: Video },
              { id: "cbt", label: "CBT & Smart Drills", icon: BookOpen },
              { id: "tutoring", label: "Klinik 1-on-1 & Konsultasi", icon: Heart },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all border ${
                    isActive 
                      ? "bg-emerald-800 text-white border-emerald-900 shadow-md scale-105" 
                      : "bg-white text-slate-600 border-amber-900/15 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-emerald-700"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feature Details Display */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border-2 border-amber-900/10 shadow-xl">
            <AnimatePresence mode="wait">
              {activeFeatureTab === "school" && (
                <motion.div 
                  key="school"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                >
                  <div className="space-y-6">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      Sekolah Formal Modern • MMIS School
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-black text-emerald-950">
                      Presensi QR, Jadwal KBM, & E-Rapor Terintegrasi
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Sistem absensi berbasis QR scanner memastikan kehadiran siswa dan guru tercatat akurat dalam hitungan detik. Semua nilai tugas, kuis, dan ujian terakumulasi rapi menjadi buku rapor digital yang dapat diunduh kapan saja.
                    </p>
                    <ul className="space-y-3 text-sm font-bold text-slate-700">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Validasi kehadiran guru piket & jurnal materi harian</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Pemberitahuan absensi langsung ke akun orang tua</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Ekspor rapor PDF otomatis standar kementerian</span>
                      </li>
                    </ul>
                    <div className="pt-2">
                      <Link href="/login">
                        <button className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-2 shadow-md">
                          <span>Buka Portal MMIS School</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-[#FAF7F2] p-6 border-2 border-emerald-100 shadow-inner space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-900/10">
                      <span className="text-xs font-black text-emerald-950">KARTU PRESENSI KELAS X-MIPA 1</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">QR Aktif</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                          <QrCode className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-emerald-950">Scan QR Absensi Siswa</div>
                          <div className="text-xs text-slate-500">Kamera aktif untuk validasi masuk</div>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-700">98% Hadir</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-emerald-100 text-xs space-y-2">
                      <div className="flex justify-between font-bold text-slate-600">
                        <span>Pelajaran Berlangsung:</span>
                        <span className="text-emerald-900">Biologi - Sel & Jaringan</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-600">
                        <span>Guru Pengampu:</span>
                        <span className="text-emerald-900">Dra. Endang Sulistyowati</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeFeatureTab === "live" && (
                <motion.div 
                  key="live"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                >
                  <div className="space-y-6">
                    <span className="px-3.5 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-black">
                      Ruang Kelas Virtual • LiveKit WebRTC
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-black text-emerald-950">
                      Kamera PIP Bebas Geser & Share Screen Bersuara
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Siswa dan tutor menikmati interaksi tatap muka layaknya di satu ruangan. Kamera tutor dalam format PIP (Picture-in-Picture) dapat digeser ke sudut mana saja, sementara screen share menyertakan suara materi yang jernih.
                    </p>
                    <ul className="space-y-3 text-sm font-bold text-slate-700">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
                        <span>Draggable PIP Webcam: Letakkan video tutor di mana saja</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
                        <span>Antrean Raise Hand tertib dengan persetujuan tutor</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
                        <span>Polling kuis kilat langsung tampil di layar semua siswa</span>
                      </li>
                    </ul>
                    <div className="pt-2">
                      <Link href="/app">
                        <button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs flex items-center gap-2 shadow-md">
                          <span>Eksplor Kelas NIA Tutoring</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-[#FAF7F2] p-6 border-2 border-orange-100 shadow-inner space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-orange-900/10">
                      <span className="text-xs font-black text-emerald-950">SESI LIVE: PENALARAN MATEMATIKA</span>
                      <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                        LIVE HD
                      </span>
                    </div>
                    <div className="h-44 rounded-2xl bg-slate-900 p-4 flex flex-col justify-between text-white relative overflow-hidden">
                      <div className="text-xs font-mono text-amber-300">Share Screen: Tutor Ridwan M.Si</div>
                      <div className="text-sm font-black">Integral Substitusi: ∫ 2x √(x² + 9) dx</div>
                      <div className="absolute bottom-3 right-3 w-28 h-20 bg-slate-800 border-2 border-amber-400 rounded-xl flex items-center justify-center text-xs font-bold">
                        PIP Tutor Cam
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-orange-100 text-xs flex items-center justify-between">
                      <span className="font-bold text-slate-700">Polling: 94% Siswa Menjawab Benar</span>
                      <span className="font-black text-emerald-700">Opsi B ✓</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeFeatureTab === "cbt" && (
                <motion.div 
                  key="cbt"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                >
                  <div className="space-y-6">
                    <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                      Simulasi CBT Standar Nasional • NIA Drills
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-black text-emerald-950">
                      Simulasi UTBK Realistis dengan Rumus Tajam KaTeX
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Latih kecepatan dan ketepatan dengan antarmuka yang dirancang presisi menyerupai sistem seleksi resmi. Timer otomatis, navigasi nomor kilat, dan pembahasan langkah demi langkah.
                    </p>
                    <ul className="space-y-3 text-sm font-bold text-slate-700">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                        <span>Rendering simbol sains dan matematika tanpa blur</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                        <span>Analisis skor per-subtes untuk deteksi materi lemah</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                        <span>Bank soal SNBT, Literasi Bahasa, & Ujian Mandiri</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-3xl bg-[#FAF7F2] p-6 border-2 border-amber-100 shadow-inner space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-amber-900/10 text-xs font-black">
                      <span>TRYOUT SNBT #5</span>
                      <span className="text-rose-600 font-mono">⏱️ 14:20 Tersisa</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-amber-100 space-y-2">
                      <div className="text-xs text-slate-500">Soal 12 dari 20:</div>
                      <div className="text-sm font-bold text-slate-800">
                        Jika matriks A tidak memiliki invers, maka nilai k adalah...
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">A. -4</div>
                        <div className="p-2 rounded-xl bg-amber-100 border-2 border-amber-500 font-bold text-amber-900">B. 2 (Dipilih)</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeFeatureTab === "tutoring" && (
                <motion.div 
                  key="tutoring"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                >
                  <div className="space-y-6">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      Bimbingan Khusus • Klinik Konsultasi
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-black text-emerald-950">
                      Klinik 1-on-1: Bedah PR & Soal Sulit Hingga Paham
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Tidak perlu cemas saat menemukan soal pekerjaan rumah atau konsep yang belum kamu mengerti di sekolah. Jadwalkan sesi konsultasi langsung dengan tutor spesialis mata pelajaran.
                    </p>
                    <ul className="space-y-3 text-sm font-bold text-slate-700">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Pilih tutor favorit dan waktu sesi yang paling fleksibel</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Upload foto lembar soal sebelum sesi dimulai</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Bimbingan santai dua arah tanpa takut salah</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-3xl bg-[#FAF7F2] p-6 border-2 border-emerald-100 shadow-inner space-y-4">
                    <div className="p-4 rounded-2xl bg-white border border-emerald-100">
                      <div className="text-xs font-black text-emerald-800 mb-1">JADWAL KLINIK TERKONFIRMASI</div>
                      <div className="text-sm font-black text-slate-800">Bedah Soal Kimia: Stoikiometri Larutan</div>
                      <div className="text-xs text-slate-500 mt-1">Tutor: Kak Siti Rahma, S.Si • Besok 16:00 WIB</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* 🏆 TESTIMONIALS & KISAH SUKSES SISWA */}
      <section id="prestasi" className="py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
              Keluarga Besar IGNITE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-emerald-950 mt-4 mb-4">
              Kisah Nyata dari Murid & Pengajar
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-medium">
              Bukti nyata bagaimana integrasi MMIS School dan NIA Tutoring mewujudkan mimpi-mimpi besar.
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
                <p className="text-slate-700 text-sm font-medium leading-relaxed italic mb-6">
                  &ldquo;Di MMIS School semua tugas dan absensi QR sangat teratur. Ditambah bimbingan intensif NIA Tutoring saat malam hari, aku berhasil lolos ke Kedokteran UI tanpa panik!&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
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
                <p className="text-slate-700 text-sm font-medium leading-relaxed italic mb-6">
                  &ldquo;Fitur PIP webcam di kelas virtual NIA Tutoring beneran memudahkan fokus. Soal-soal drill CBT-nya sangat mirip dengan tipe soal asli UTBK SNBT.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100">
                <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black">
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
                <p className="text-slate-700 text-sm font-medium leading-relaxed italic mb-6">
                  &ldquo;Sebagai guru di MMIS School, portal penilaian dan jurnal sangat menghemat waktu kami. Rekap nilai otomatis dan orang tua bisa memantau perkembangan anak secara transparan.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100">
                <div className="w-11 h-11 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black">
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

      {/* ❓ FAQ SECTION (ACCORDION) */}
      <section id="faq" className="py-24 bg-[#F5F2EB] relative z-20 border-t border-amber-900/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
              Pertanyaan yang Sering Diajukan
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-emerald-950 mt-4 mb-4">
              Punya Pertanyaan Seputar IGNITE?
            </h2>
            <p className="text-slate-600 text-base font-medium">
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
                        <div className="px-6 pb-6 text-sm font-medium text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
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

      {/* 🌾 GRAND PARALLAX FINAL CALL-TO-ACTION */}
      <section className="py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[3rem] p-10 sm:p-16 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white text-center relative overflow-hidden shadow-2xl border-4 border-white">
            
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-400/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
                Mulai Hari Ini Bersama IGNITE
              </span>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-6">
                Siap Melangkah Menuju Prestasi Terbaikmu?
              </h2>

              <p className="text-white/80 text-base sm:text-lg font-medium mb-10 leading-relaxed">
                Pilih portal yang sesuai dengan kebutuhan belajarmu hari ini dan nikmati kemudahan akses di semua perangkat.
              </p>

              {/* Dual Big CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
                <Link href="/login" className="w-full sm:w-1/2">
                  <button className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
                    <School className="w-4 h-4 text-emerald-600" />
                    <span>MMIS School</span>
                  </button>
                </Link>

                <Link href="/app" className="w-full sm:w-1/2">
                  <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-white font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
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
      <footer className="border-t border-amber-900/10 bg-[#FAF7F2] relative z-20 pt-16 pb-12 text-slate-600 text-sm">
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
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Ekosistem terintegrasi yang menyatukan manajemen sekolah formal di <strong>MMIS School</strong> dan bimbingan belajar intensif di <strong>NIA Tutoring</strong>.
              </p>
              <div className="text-xs font-bold text-emerald-800">
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
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
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
