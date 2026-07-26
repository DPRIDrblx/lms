"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Target, Sparkles, CheckCircle2, ChevronRight, GraduationCap, Calculator, Globe, X, Loader2, Phone, Building, User, Mail, Key, Ticket, Users } from "lucide-react";
import { XenditPaymentModal } from "@/components/finance/XenditPaymentModal";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { registerSobatNiaAction } from "./actions";

export default function BayarNiaPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("Semua");
  const [selectedMode, setSelectedMode] = useState("Online"); // Center or Online
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const supabase = createClient();
  const [isProcessingSignup, setIsProcessingSignup] = useState(false);

  // Form State
  const [form, setForm] = useState({ name: "", email: "", password: "", voucher: "", phone: "", schoolName: "", parentName: "", parentPhone: "" });
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Form, 2: Xendit Mock, 3: Success
  const [appliedPromo, setAppliedPromo] = useState<any>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      const { data } = await supabase.from("nia_packages").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (data) {
        // Find most expensive to mark as popular
        if (data.length > 0) {
          const maxPrice = Math.max(...data.map((d: any) => d.price));
          data.forEach((d: any) => {
            if (d.price === maxPrice) d.popular = true;
          });
        }
        setPackages(data);
      }
      setLoadingPackages(false);
    };
    fetchPackages();
  }, []);

  const filteredPackages = packages.filter(p => 
    (selectedLevel === "Semua" || p.level === selectedLevel) && 
    (p.learning_mode === selectedMode || (!p.learning_mode && selectedMode === "Online"))
  );

  // Compute Final Price
  const getFinalPrice = () => {
    if (!selectedPackage) return 0;
    let price = selectedPackage.price;
    if (appliedPromo) {
      if (appliedPromo.discount_type === 'percent') {
        price = price - (price * (appliedPromo.discount_value / 100));
      } else {
        price = price - appliedPromo.discount_value;
      }
    }
    return Math.max(0, price);
  };
  const finalPrice = getFinalPrice();

  const handleApplyVoucher = async () => {
    if (!form.voucher) return;
    const { data } = await supabase.from("nia_promo_codes").select("*").eq("code", form.voucher.toUpperCase()).single();
    if (data) {
      setAppliedPromo(data);
      toast.success("Voucher berhasil digunakan!");
    } else {
      setAppliedPromo(null);
      toast.error("Kode voucher tidak valid!");
    }
  };

  const handleCheckout = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowCheckout(true);
    setCheckoutStep(1);
    setForm({ name: "", email: "", password: "", voucher: "", phone: "", schoolName: "", parentName: "", parentPhone: "" });
    setAppliedPromo(null);
  };

  const processPayment = () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.schoolName) {
      toast.error("Mohon lengkapi form wajib (Nama, Email, Password, No WA, Asal Sekolah)");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setCheckoutStep(2); // Show Xendit Mock
  };

  const handlePaymentSuccess = async () => {
    setIsProcessingSignup(true);
    
    try {
      // 1. Sign Up & Assign Subscription via Server Action (bypasses Supabase 3/hour rate limit)
      const result = await registerSobatNiaAction({
        name: form.name,
        email: form.email,
        password: form.password,
        packageId: selectedPackage.id,
        phone: form.phone,
        schoolName: form.schoolName,
        parentName: form.parentName,
        parentPhone: form.parentPhone
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // 2. Log the user in to establish the session in the browser
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });

      if (signInError) {
        console.error("Login after signup error:", signInError);
        // We don't throw here because the account was successfully created and paid for
        toast.error("Akun berhasil dibuat, namun gagal login otomatis. Silakan login manual.");
      }
      
      setCheckoutStep(3);
    } catch (error: any) {
      toast.error("Gagal membuat akun: " + error.message);
      setCheckoutStep(1);
    } finally {
      setIsProcessingSignup(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-amber-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BookOpen className="text-yellow-400 w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">NIA<span className="text-blue-600">Tutoring</span></span>
          </div>
          <div className="flex gap-4">
            <a href="/login" className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Masuk</a>
            <button className="px-6 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
              Daftar Sekarang
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-bold text-sm mb-6">
              <BookOpen className="w-4 h-4" /> Sistem Manajemen Belajar Terbaik
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
              Belajar Lebih Pintar, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-yellow-500 to-orange-500">Bukan Lebih Keras.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
              Bergabunglah dengan ribuan siswa NIA lainnya. Dapatkan akses ke video interaktif, rangkuman materi cerdas, dan tutor berpengalaman.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full text-lg shadow-xl shadow-blue-500/30 hover:-translate-y-1 transition-all">
                Mulai Belajar
              </button>
              <button className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 font-bold rounded-full text-lg hover:border-slate-300 hover:bg-slate-50 transition-all">
                Lihat Paket
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-yellow-500/20 to-orange-500/20 rounded-[3rem] blur-3xl"></div>
            <div className="relative bg-white p-8 rounded-[3rem] shadow-2xl border border-white/50 aspect-square flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-100 rounded-full blur-2xl"></div>
                <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-100 rounded-full blur-2xl"></div>
                
                <div className="z-10 text-center space-y-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/40 rotate-12">
                        <GraduationCap className="w-12 h-12 text-yellow-400 -rotate-12" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">Tembus Kampus Impian</h3>
                        <p className="text-slate-500 font-medium mt-2">Belajar terarah dengan AI & Tutor</p>
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Pilih Paket Belajarmu</h2>
            <p className="text-lg text-slate-600">Diskon spesial hingga 50% untuk pendaftaran bulan ini. Pilih sesuai jenjang dan kebutuhanmu.</p>
          </div>

          {/* Mode Filters (Center / Online) */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-slate-100 rounded-full shadow-inner border border-slate-200/50">
              {["Center", "Online"].map(mode => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`px-8 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
                    selectedMode === mode 
                      ? "bg-white text-blue-700 shadow-md shadow-slate-200 border border-slate-200" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {mode === "Center" ? <Building className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Level Filters */}
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {["Semua", "SD", "SMP", "SMA"].map(lvl => (
              <button 
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${
                  selectedLevel === lvl 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {loadingPackages ? (
            <div className="flex justify-center my-20">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPackages.length === 0 && (
                <div className="col-span-full text-center py-20 text-slate-500 font-medium bg-slate-50 rounded-3xl border border-slate-100">
                  Belum ada paket {selectedMode} untuk jenjang ini.
                </div>
              )}
              {filteredPackages.map((pkg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={pkg.id} 
                  className={`relative bg-white rounded-3xl p-8 border-2 transition-all hover:shadow-2xl hover:-translate-y-2 flex flex-col ${
                    pkg.popular ? "border-blue-500 shadow-xl shadow-blue-500/10" : "border-slate-100 shadow-lg"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-lg">
                      Paling Laris
                    </div>
                  )}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">{pkg.level}</span>
                      {pkg.grade && <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">{pkg.grade}</span>}
                      {pkg.major && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">{pkg.major}</span>}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">{pkg.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900">Rp{(pkg.price / 1000).toLocaleString()}k</span>
                      {pkg.original_price && <span className="text-lg text-slate-400 line-through">Rp{(pkg.original_price / 1000).toLocaleString()}k</span>}
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 flex-1">
                    {pkg.features && pkg.features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                        <span className="text-slate-700 font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleCheckout(pkg)}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      pkg.popular 
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40" 
                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    Beli Paket Ini
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Checkout Modal / Overlay */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowCheckout(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Order Summary Sidebar */}
              <div className="w-full md:w-2/5 bg-slate-50 p-8 border-r border-slate-100">
                <button onClick={() => setShowCheckout(false)} className="md:hidden absolute top-4 right-4 p-2 bg-white rounded-full text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-black text-slate-900 mb-6">Ringkasan Pesanan</h3>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
                  <div className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wider">{selectedPackage?.level} - {selectedPackage?.major}</div>
                  <div className="text-lg font-bold text-slate-900 mb-4">{selectedPackage?.name}</div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                    <span className="text-slate-500">Harga Normal</span>
                    <span className={appliedPromo ? "text-slate-400 line-through" : "text-slate-900 font-bold"}>Rp {selectedPackage?.price.toLocaleString()}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                      <span className="text-slate-500">Voucher {appliedPromo.code}</span>
                      <span className="text-green-600 font-bold">
                        - {appliedPromo.discount_type === 'percent' ? `${appliedPromo.discount_value}%` : `Rp ${appliedPromo.discount_value.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-800 font-bold">Total Bayar</span>
                    <span className="text-2xl font-black text-slate-900">Rp {finalPrice.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> Jaminan uang kembali 7 hari
                </div>
              </div>

              {/* Form / Payment Area */}
              <div className="w-full md:w-3/5 p-8 overflow-y-auto">
                <button onClick={() => setShowCheckout(false)} className="hidden md:block absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>

                {checkoutStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-2">Buat Akun NIA Tutoring</h2>
                      <p className="text-slate-500">Isi data diri untuk membuat akun belajar kamu.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Grid for 2 columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                          <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-orange-600 transition-colors">Nama Lengkap *</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all focus:bg-white" placeholder="Budi Santoso" />
                          </div>
                        </div>
                        <div className="relative group">
                          <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-orange-600 transition-colors">Nomor WA Siswa *</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all focus:bg-white" placeholder="081234567890" />
                          </div>
                        </div>
                        <div className="relative group">
                          <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-orange-600 transition-colors">Email *</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all focus:bg-white" placeholder="budi@example.com" />
                          </div>
                        </div>
                        <div className="relative group">
                          <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-orange-600 transition-colors">Password (Min. 6 Karakter) *</label>
                          <div className="relative">
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all focus:bg-white" placeholder="••••••••" />
                          </div>
                        </div>
                        <div className="relative group md:col-span-2">
                          <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-orange-600 transition-colors">Asal Sekolah *</label>
                          <div className="relative">
                            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input type="text" value={form.schoolName} onChange={e => setForm({...form, schoolName: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all focus:bg-white" placeholder="SMA Negeri 1 Jakarta" />
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-100 my-6" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                          <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-orange-600 transition-colors">Nama Orang Tua (Opsional)</label>
                          <div className="relative">
                            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input type="text" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all focus:bg-white" placeholder="Nama Orang Tua/Wali" />
                          </div>
                        </div>
                        <div className="relative group">
                          <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-orange-600 transition-colors">Nomor WA Orang Tua (Opsional)</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input type="tel" value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all focus:bg-white" placeholder="081234567891" />
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-100 my-6" />

                      <div className="relative group">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-orange-600 transition-colors">Kode Voucher (Opsional)</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input type="text" value={form.voucher} onChange={e => setForm({...form, voucher: e.target.value.toUpperCase()})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all focus:bg-white uppercase placeholder:normal-case" placeholder="Punya kode diskon?" />
                          </div>
                          <button onClick={handleApplyVoucher} disabled={!form.voucher} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0">
                            Gunakan
                          </button>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={processPayment}
                      className="w-full py-4 mt-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-lg rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all"
                    >
                      Lanjut ke Pembayaran
                    </button>
                  </div>
                )}

                {checkoutStep === 2 && (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                    {isProcessingSignup ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        <div className="text-slate-500 font-medium">Sedang menyiapkan akun belajarmu...</div>
                      </div>
                    ) : (
                      <>
                        <div className="text-slate-500 font-medium">
                          Membuka gerbang pembayaran...
                        </div>
                        <XenditPaymentModal
                          isOpen={true}
                          onClose={() => setCheckoutStep(1)}
                          amount={finalPrice}
                          onSuccess={handlePaymentSuccess}
                          title="IGNITE Tutoring"
                        />
                      </>
                    )}
                  </div>
                )}

                {checkoutStep === 3 && (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-slate-900">Pembayaran Berhasil!</h2>
                    <p className="text-slate-600 max-w-sm">Akun Sobat IGNITE kamu telah aktif. Selamat bergabung dan selamat belajar!</p>
                    <a 
                      href="/login"
                      className="inline-block w-full max-w-xs py-4 mt-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors"
                    >
                      Masuk ke Dashboard
                    </a>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
