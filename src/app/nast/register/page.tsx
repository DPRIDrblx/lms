"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  School, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  MapPin, 
  Award,
  IdCard,
  Hash,
  Eye,
  EyeOff
} from "lucide-react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

export default function NastRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const NAST_CLASS_ID = "07fd41cd-9515-4255-9aab-b815cdb21d4e"; // SMP NAST 2026 (NAST2026JHS)

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Data Akun & Login
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "Laki-laki",

    // Step 2: Data Sekolah & NISN
    nisn: "",
    schoolName: "",
    gradeLevel: "Kelas 8",
    city: "",
    province: "",
    mentorTeacher: "",

    // Step 3: Kategori Kompetisi
    competitionCategory: "Matematika & Penalaran Numerik"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Email tidak valid");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Nomor WhatsApp wajib diisi");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.nisn.trim()) {
      toast.error("NISN wajib diisi");
      return false;
    }
    if (!formData.schoolName.trim()) {
      toast.error("Nama sekolah SMP / MTs wajib diisi");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("Kota / Kabupaten asal sekolah wajib diisi");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign up user with metadata including class_code: 'NAST2026JHS'
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            name: formData.fullName.trim(),
            role: "student",
            class_code: "NAST2026JHS",
            school_name: formData.schoolName.trim(),
            phone: formData.phone.trim(),
            nisn: formData.nisn.trim(),
            grade_level: formData.gradeLevel,
            category: formData.competitionCategory,
            is_nast_participant: true,
            nast_registration_code: `NAST27-${Math.floor(10000 + Math.random() * 90000)}`
          }
        }
      });

      if (authErr) throw authErr;

      // 2. Explicitly ensure profile has class_id and details set
      if (authData.user?.id) {
        await supabase
          .from("profiles")
          .update({
            full_name: formData.fullName.trim(),
            role: "student",
            class_id: NAST_CLASS_ID,
            school_name: formData.schoolName.trim(),
            phone: formData.phone.trim()
          })
          .eq("id", authData.user.id);

        // 3. Register into global_settings nast_results with initial 'pending' (abu-abu)
        try {
          const { data: settingsData } = await supabase
            .from("global_settings")
            .select("value")
            .eq("key", "nast_results")
            .maybeSingle();

          const existingMap = settingsData?.value || {};
          existingMap[authData.user.id] = {
            status: "pending",
            category: formData.competitionCategory,
            nisn: formData.nisn.trim(),
            school_name: formData.schoolName.trim(),
            registered_at: new Date().toISOString()
          };

          await supabase
            .from("global_settings")
            .upsert({
              key: "nast_results",
              value: existingMap
            });
        } catch (settingsErr) {
          console.warn("Could not auto-register to nast_results:", settingsErr);
        }
      }

      // Pop celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#0EA5E9", "#F97316", "#10B981", "#EAB308", "#8B5CF6"]
      });

      toast.success("Pendaftaran Berhasil! Akun otomatis bergabung ke kelas NAST2026JHS.");
      router.push("/nast/dashboard");

    } catch (err: any) {
      console.error("Gagal mendaftar:", err);
      toast.error(err.message || "Terjadi kesalahan saat pendaftaran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans relative overflow-x-hidden flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/nast" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white/10 rounded-xl p-1.5 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <img src="/logo-nast.png" alt="Logo NAST 2027" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white block">NAST 2027</span>
            <span className="text-[10px] font-bold text-cyan-400">Kembali ke Beranda</span>
          </div>
        </Link>

        <div className="text-xs font-bold text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/nast/login" className="text-cyan-400 font-black hover:underline">
            Login di Sini
          </Link>
        </div>
      </div>

      {/* Main Registration Form Container */}
      <div className="max-w-2xl mx-auto w-full my-6">
        <div className="p-6 sm:p-10 rounded-[2.5rem] bg-white/[0.04] backdrop-blur-2xl border border-white/15 shadow-2xl relative overflow-hidden">
          
          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-black uppercase tracking-wider mb-3">
              <Trophy className="w-3.5 h-3.5" />
              <span>Formulir Pendaftaran Resmi NAST 2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Registrasi Peserta Turnamen
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
              Akun peserta akan otomatis terdaftar ke kelas turnamen resmi: <strong className="text-amber-400 font-mono">NAST2026JHS</strong>.
            </p>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="flex items-center justify-between mb-8 max-w-sm mx-auto">
            <div className={`flex flex-col items-center gap-1.5 ${step >= 1 ? "text-cyan-400" : "text-slate-600"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${
                step >= 1 ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "border-slate-700 bg-slate-900 text-slate-600"
              }`}>
                1
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Identitas</span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? "bg-cyan-400" : "bg-slate-800"}`} />

            <div className={`flex flex-col items-center gap-1.5 ${step >= 2 ? "text-cyan-400" : "text-slate-600"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${
                step >= 2 ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "border-slate-700 bg-slate-900 text-slate-600"
              }`}>
                2
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Sekolah</span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? "bg-cyan-400" : "bg-slate-800"}`} />

            <div className={`flex flex-col items-center gap-1.5 ${step >= 3 ? "text-cyan-400" : "text-slate-600"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${
                step >= 3 ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "border-slate-700 bg-slate-900 text-slate-600"
              }`}>
                3
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Kategori</span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ═════════ STEP 1: IDENTITAS & AKUN ═════════ */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Lengkap Peserta (Sesuai Kartu Pelajar):
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Contoh: Muhammad Rayhan Al-Fatih"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Email Login */}
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Aktif (Digunakan untuk Login):
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="nama@email.com"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Password & Konfirmasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      Password Akun:
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      Konfirmasi Password:
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Ulangi password"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Nomor WhatsApp & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      No. WhatsApp / HP Aktif:
                    </label>
                    <div className="relative">
                      <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="081234567890"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      Jenis Kelamin:
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl bg-[#0F172A] border border-white/10 text-sm font-bold text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* Step 1 Button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => validateStep1() && setStep(2)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <span>Lanjut ke Data Sekolah</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* ═════════ STEP 2: DATA SEKOLAH & NISN ═════════ */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                
                {/* NISN & Kelas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      NISN (10 Digit):
                    </label>
                    <div className="relative">
                      <Hash className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        name="nisn"
                        value={formData.nisn}
                        onChange={handleChange}
                        placeholder="Contoh: 0098765432"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      Jenjang Kelas:
                    </label>
                    <select
                      name="gradeLevel"
                      value={formData.gradeLevel}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl bg-[#0F172A] border border-white/10 text-sm font-bold text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                    >
                      <option value="Kelas 7">Kelas 7 SMP / MTs</option>
                      <option value="Kelas 8">Kelas 8 SMP / MTs</option>
                      <option value="Kelas 9">Kelas 9 SMP / MTs</option>
                    </select>
                  </div>
                </div>

                {/* Nama Sekolah */}
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Sekolah Asal (SMP / MTs):
                  </label>
                  <div className="relative">
                    <School className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleChange}
                      placeholder="Contoh: SMP Negeri 1 Jakarta / MTsN 2 Surabaya"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Kota & Provinsi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      Kabupaten / Kota Asal:
                    </label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Contoh: Bandung"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      Provinsi Asal:
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      placeholder="Contoh: Jawa Barat"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Nama Guru Pendamping */}
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Guru Pembina / Pendamping (Opsional):
                  </label>
                  <input
                    type="text"
                    name="mentorTeacher"
                    value={formData.mentorTeacher}
                    onChange={handleChange}
                    placeholder="Contoh: Budi Santoso, S.Pd"
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                  />
                </div>

                {/* Step 2 Buttons */}
                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-4 rounded-2xl border border-white/15 text-slate-400 hover:text-white font-bold text-sm transition-all"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => validateStep2() && setStep(3)}
                    className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <span>Lanjut ke Bidang Lomba</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* ═════════ STEP 3: KATEGORI & FINAL REGISTRATION ═════════ */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                    Pilih Bidang Kompetisi yang Diikuti:
                  </label>

                  <div className="space-y-3">
                    {[
                      {
                        title: "Matematika & Penalaran Numerik",
                        desc: "Aljabar, Geometri, Kombinatorika, dan Logika Deduktif Olimpiade."
                      },
                      {
                        title: "Eksplorasi Sains & IPA Terpadu",
                        desc: "Fisika Terapan, Biosfer Lingkungan, dan Analisis Eksperimen Sains."
                      },
                      {
                        title: "English & Critical Thinking",
                        desc: "Reading Comprehension, Contextual Inference, & Critical Argumentation."
                      }
                    ].map((cat, i) => {
                      const isSelected = formData.competitionCategory === cat.title;
                      return (
                        <div
                          key={i}
                          onClick={() => setFormData({ ...formData, competitionCategory: cat.title })}
                          className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
                            isSelected
                              ? "bg-cyan-500/10 border-cyan-400 shadow-lg shadow-cyan-500/15"
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected ? "border-cyan-400 bg-cyan-400" : "border-slate-500"
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                          </div>
                          <div>
                            <p className="font-black text-sm text-white">{cat.title}</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">{cat.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Automated Enrollment Notification Card */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-black text-amber-300">Konfirmasi Masuk Kelas Otomatis:</p>
                    <p className="text-slate-300 mt-0.5">
                      Dengan mendaftar, akun Anda akan otomatis terdaftar ke kelas <strong className="text-white font-mono">NAST2026JHS</strong> (SMP NAST 2026). Anda dapat langsung mengakses seluruh bank soal, modul, dan simulasi CBT di dasbor peserta.
                    </p>
                  </div>
                </div>

                {/* Step 3 Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={loading}
                    className="w-1/3 py-4 rounded-2xl border border-white/15 text-slate-400 hover:text-white font-bold text-sm transition-all"
                  >
                    Kembali
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 hover:from-orange-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
                  >
                    <Trophy className="w-4 h-4 text-slate-950" />
                    <span>{loading ? "Mendaftarkan Akun..." : "Selesaikan Pendaftaran"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

          </form>

        </div>
      </div>

      {/* Footer Note */}
      <div className="max-w-md mx-auto text-center text-xs text-slate-500 py-2">
        Dilindungi oleh NIA Academic Security & Supabase SSR Auth Encryption.
      </div>

    </div>
  );
}
