"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Wallet, BookOpen, Clock, Calendar, Search, MapPin, X, AlertCircle, Building2, Ticket, CheckCircle, ChevronRight, CheckCircle2, ChevronLeft, MonitorPlay, School, LayoutGrid, Target, Sparkles, GraduationCap, Calculator, Globe, Loader2, Phone, Building, User, Mail, Key, Users, SearchIcon, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { XenditPaymentModal } from "@/components/finance/XenditPaymentModal";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { registerSobatNiaAction } from "./actions";

export default function BayarNiaPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  
  // States
  const [selectedLevel, setSelectedLevel] = useState("Semua");
  const [selectedMode, setSelectedMode] = useState("Online"); // Center or Online
  const [selectedProgram, setSelectedProgram] = useState("Reguler"); // Reguler or Premium
  const [selectionStep, setSelectionStep] = useState<"mode" | "program" | "packages">("mode");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // UI Modals
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showXendit, setShowXendit] = useState(false);

  const supabase = createClient();
  const [isProcessingSignup, setIsProcessingSignup] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");

  // Form & Checkout State
  const [form, setForm] = useState({ name: "", email: "", password: "", voucher: "", phone: "", schoolName: "", parentName: "", parentPhone: "" });
  const [checkoutStep, setCheckoutStep] = useState(0); // 0: Main, 1: Form, 2: Invoice, 3: Success
  const [paymentMethod, setPaymentMethod] = useState("Lunas");
  const [installmentVariation, setInstallmentVariation] = useState("3x");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [availablePromos, setAvailablePromos] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingPackages(true);
      // Fetch packages
      const { data: pkgData } = await supabase.from("nia_packages").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (pkgData) {
        if (pkgData.length > 0) {
          const maxPrice = Math.max(...pkgData.map((d: any) => d.price));
          pkgData.forEach((d: any) => {
            if (d.price === maxPrice) d.popular = true;
          });
        }
        setPackages(pkgData);
      }
      
      // Fetch branches
      const { data: branchData } = await supabase.from("nia_branches").select("*").eq("is_active", true);
      if (branchData && branchData.length > 0) {
        setBranches(branchData);
      } else {
        setBranches([
          { id: 'b1', name: 'NIA Center Jakarta Selatan', address: 'Jl. Kemang Raya No. 12', city: 'Jakarta', is_active: true },
          { id: 'b2', name: 'NIA Center Bandung', address: 'Jl. Dago No. 100', city: 'Bandung', is_active: true },
          { id: 'b3', name: 'NIA Center Surabaya', address: 'Jl. Raya Darmo No. 50', city: 'Surabaya', is_active: true }
        ]);
      }

      // Fetch active promos
      const { data: promoData } = await supabase.from("nia_promo_codes").select("*");
      if (promoData) setAvailablePromos(promoData);

      setLoadingPackages(false);
    };
    fetchData();
  }, []);

  const filteredPackages = packages.filter(p => 
    (selectedLevel === "Semua" || p.level === selectedLevel) && 
    (p.learning_mode === selectedMode || (!p.learning_mode && selectedMode === "Online")) &&
    (p.program_type === selectedProgram || (!p.program_type && selectedProgram === "Reguler"))
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
    
    // Simple mock logic for installments
    if (paymentMethod === 'Cicilan') {
      const divider = parseInt(installmentVariation.replace('x', ''));
      price = (price / divider) + 50000; // adding admin fee
    }

    return Math.max(0, price);
  };
  const finalPrice = getFinalPrice();

  const handleApplyVoucher = (promo: any) => {
    setAppliedPromo(promo);
    setForm({...form, voucher: promo.code});
    setShowPromoModal(false);
    toast.success(`Voucher ${promo.code} digunakan!`);
  };

  const handleApplyVoucherText = async () => {
    if (!form.voucher) return;
    const { data } = await supabase.from("nia_promo_codes").select("*").eq("code", form.voucher.toUpperCase()).single();
    if (data) {
      setAppliedPromo(data);
      setShowPromoModal(false);
      toast.success("Voucher berhasil digunakan!");
    } else {
      setAppliedPromo(null);
      toast.error("Kode voucher tidak valid!");
    }
  };

  const initiateCheckout = (pkg: any) => {
    setSelectedPackage(pkg);
    setAppliedPromo(null);
    if (selectedMode === "Center") {
      setShowBranchModal(true);
    } else {
      setSelectedBranch(null);
      setCheckoutStep(1); // Go straight to Form
    }
  };

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (checkoutStep === 2) {
      generatePdf();
    }
  }, [checkoutStep, paymentMethod, installmentVariation, appliedPromo, finalPrice, form, selectedPackage, selectedBranch]);

  const generatePdf = () => {
    const doc = new jsPDF();
    
    // Kop Surat
    doc.setFontSize(22);
    doc.setTextColor(20, 184, 166);
    doc.text("NIA Tutoring", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("DRAFT INVOICE", 14, 28);
    
    // Garis pemisah
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 32, 196, 32);
    
    // Informasi Siswa
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 42);
    doc.text(`Nama Lengkap: ${form.name || '-'}`, 14, 49);
    doc.text(`Email: ${form.email || '-'}`, 14, 56);
    doc.text(`Asal Sekolah: ${form.schoolName || '-'}`, 14, 63);
    
    doc.text(`Paket Pilihan: ${selectedPackage?.name || '-'}`, 120, 42);
    doc.text(`Mode Belajar: ${selectedMode}`, 120, 49);
    doc.text(`Cabang: ${selectedBranch?.name || 'Online'}`, 120, 56);
    
    // Tabel Rincian
    const tableBody = [
      ['Biaya Paket ' + (selectedPackage?.name || ''), 'Rp ' + (selectedPackage?.price || 0).toLocaleString('id-ID')]
    ];
    
    if (paymentMethod === 'Cicilan') {
      tableBody.push(['Biaya Admin Cicilan (' + installmentVariation + ')', 'Rp 50.000']);
    }
    
    if (appliedPromo) {
      tableBody.push(['Diskon Promo (' + appliedPromo.code + ')', '- Rp ' + appliedPromo.discount_value.toLocaleString('id-ID')]);
    }

    autoTable(doc, {
      startY: 75,
      head: [['Deskripsi Tagihan', 'Nominal']],
      body: tableBody,
      foot: [['TOTAL PEMBAYARAN', 'Rp ' + finalPrice.toLocaleString('id-ID')]],
      theme: 'grid',
      headStyles: { fillColor: [20, 184, 166], textColor: 255 },
      footStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("* Ini adalah draft invoice yang dibuat sebelum pembayaran selesai.", 14, finalY + 15);
    doc.text("* Invoice resmi akan diterbitkan setelah pembayaran lunas / termin pertama dibayarkan.", 14, finalY + 20);
    
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);
  };

  const processForm = () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.schoolName) {
      toast.error("Mohon lengkapi form wajib (Nama, Email, Password, No WA, Asal Sekolah)");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setCheckoutStep(2); // Go to Invoice
  };

  const handleBeliClick = () => {
    setInvoiceId(`INV-${new Date().getFullYear()}${new Date().getMonth()+1}${new Date().getDate()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setShowXendit(true);
  };

  const handlePaymentSuccess = async () => {
    setShowXendit(false);
    setIsProcessingSignup(true);
    try {
      // 1. Sign Up & Assign Subscription
      const result = await registerSobatNiaAction({
        name: form.name,
        email: form.email,
        password: form.password,
        packageId: selectedPackage.id,
        phone: form.phone,
        schoolName: form.schoolName,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        invoiceId,
        amount: finalPrice,
        paymentMethod: paymentMethod === 'Lunas' ? 'Lunas' : installmentVariation,
        promoCode: appliedPromo?.code || undefined
      });

      if (!result.success) throw new Error(result.error);

      // 2. Login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });

      if (signInError) {
        toast.error("Akun dibuat, namun gagal login otomatis.");
      }
      
      setCheckoutStep(3); // Success Screen
    } catch (error: any) {
      toast.error("Gagal membuat akun: " + error.message);
    } finally {
      setIsProcessingSignup(false);
    }
  };

  // -------------------------------------------------------------
  // RENDERING COMPONENTS
  // -------------------------------------------------------------

  if (checkoutStep === 4) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[2rem] shadow-xl max-w-md w-full border border-slate-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">Pembayaran Berhasil!</h2>
          <p className="text-slate-500 mb-6 text-center">Terima kasih, pendaftaran kamu telah selesai dan paket belajar sudah aktif.</p>
          
          <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-200 border-dashed">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-slate-500">No. Invoice</span>
              <span className="font-bold text-slate-900">{invoiceId}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-slate-500">Paket</span>
              <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">{selectedPackage?.name}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-slate-500">Metode</span>
              <span className="font-bold text-slate-900">{paymentMethod === 'Lunas' ? 'Lunas' : installmentVariation}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center mt-2">
              <span className="font-bold text-slate-900">Total Dibayar</span>
              <span className="text-lg font-black text-orange-600">Rp {finalPrice.toLocaleString()}</span>
            </div>
          </div>
          
          <button onClick={() => window.location.href = '/sobat-nia'} className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-500/20">
            Masuk ke Kelas
          </button>
        </div>
      </div>
    );
  }

  if (checkoutStep === 3) {
    // -------------------------------------------------------------
    // INVOICE PREVIEW PAGE (PDF)
    // -------------------------------------------------------------
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-6 flex flex-col items-center">
        <div className="w-full max-w-4xl mb-8 mt-10">
          <button onClick={() => setCheckoutStep(2)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-4">
            <ChevronRight className="w-5 h-5 rotate-180" /> Kembali ke Data Diri
          </button>
          
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 flex flex-col items-center">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Pratinjau Draft Invoice</h2>
            <p className="text-slate-500 mb-8 text-center max-w-lg">Mohon periksa kembali rincian pesanan Anda sebelum melanjutkan ke pembayaran.</p>
            
            <div className="w-full max-w-3xl bg-slate-100 rounded-2xl overflow-hidden h-[600px] flex flex-col mb-8 border border-slate-200">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-2 text-xs font-bold text-slate-500">Draft Invoice - Pratinjau PDF</span>
              </div>
              {pdfUrl ? (
                <iframe src={pdfUrl} className="w-full flex-1 border-none bg-white" title="Draft Invoice PDF"></iframe>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-bold">Membuat PDF...</div>
              )}
            </div>
            
            <div className="w-full max-w-md">
              <button 
                onClick={handleBeliClick}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-lg flex justify-center items-center gap-2"
              >
                Lanjutkan Pembayaran
              </button>
              <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-400">Dengan menekan tombol di atas, kamu menyetujui Syarat dan Ketentuan.</p>
              </div>
            </div>
          </div>
        </div>
        
        <XenditPaymentModal
          isOpen={showXendit}
          onClose={() => setShowXendit(false)}
          amount={finalPrice}
          onSuccess={handlePaymentSuccess}
          title={`Pembayaran: ${selectedPackage?.name}`}
        />
        
        {isProcessingSignup && (
          <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
            <h2 className="text-xl font-bold">Memproses Pembayaran & Akun...</h2>
            <p className="text-slate-300">Mohon tunggu sebentar</p>
          </div>
        )}
      </div>
    );
  }

  if (checkoutStep === 2) {
    // -------------------------------------------------------------
    // REGISTRATION FORM
    // -------------------------------------------------------------
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-8 mt-10">
          <button onClick={() => setCheckoutStep(1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-4">
            <ChevronRight className="w-5 h-5 rotate-180" /> Kembali
          </button>
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Lengkapi Data Diri</h2>
            <p className="text-slate-500 mb-8">Data ini akan digunakan untuk pendaftaran ke sistem NIA Tutoring.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nomor WA Siswa *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Asal Sekolah *</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" value={form.schoolName} onChange={e => setForm({...form, schoolName: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email untuk Login *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 outline-none" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Password Baru *</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 outline-none" placeholder="Minimal 6 karakter" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 md:col-span-2">
                <h4 className="font-bold text-slate-800 mb-4">Data Orang Tua (Opsional)</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nama Orang Tua</label>
                    <input type="text" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">No. WA Orang Tua</label>
                    <input type="tel" value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={processForm} className="px-8 py-4 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition-colors">
                Pratinjau Draft Invoice <ChevronRight className="w-5 h-5 inline" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (checkoutStep === 1) {
    // -------------------------------------------------------------
    // PAYMENT CONFIG PAGE (PROMO, METODE)
    // -------------------------------------------------------------
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        {/* Header Checkout */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-400 p-4 flex items-center gap-4 text-white">
          <button onClick={() => setCheckoutStep(0)} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <div className="text-xl font-bold">{selectedMode === 'Center' ? 'NIA Tutoring Center' : 'NIA Tutoring Online'}</div>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-8 grid md:grid-cols-[1fr_400px] gap-6">
          {/* LEFT: Package Info */}
          <div className="space-y-4">
            {selectedMode === 'Center' && selectedBranch && (
              <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-200">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-slate-700" />
                  <div>
                    <div className="font-bold text-slate-900">{selectedBranch.name}</div>
                    <div className="text-xs text-slate-500">{selectedBranch.address}</div>
                  </div>
                </div>
                <button onClick={() => { setCheckoutStep(0); setShowBranchModal(true); }} className="px-4 py-1.5 border border-slate-300 rounded-full text-sm font-bold text-slate-700">Ubah</button>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border-2 border-teal-500/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-6 right-6 w-5 h-5 rounded-full border-4 border-teal-500 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-teal-500 rounded-full"></div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 pr-12 mb-2">{selectedBranch?.city || ''} - {selectedPackage?.name}</h2>
              <p className="text-slate-500 text-sm mb-4">Paket aktif selama 1 tahun ajaran penuh</p>
              
              <div className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-6 ${selectedPackage?.program_type === 'Premium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>Program {selectedPackage?.program_type || 'Reguler'}</div>
              
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-4">Deskripsi Paket</h3>
                <p className="text-sm text-slate-600 mb-4">Pembelajaran terpadu untuk persiapan akademik dan ujian, termasuk:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {selectedPackage?.features?.map((feat: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-sm text-slate-700 leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Payment Config */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-900 mb-2">Pilih metode pelunasan</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none">
                <option value="Lunas">Pembayaran Lunas</option>
                <option value="Cicilan">Pembayaran Cicilan</option>
              </select>

              {paymentMethod === 'Cicilan' && (
                <div className="mt-3">
                  <label className="block text-sm text-slate-500 mb-2">Opsi Cicilan (Setiap opsi akan dikenakan biaya admin Rp 50.000 / termin)</label>
                  <select value={installmentVariation} onChange={(e) => setInstallmentVariation(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none">
                    <option value="3x">Cicilan 3x (3 Bulan)</option>
                    <option value="6x">Cicilan 6x (6 Bulan)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-900 mb-2">Gunakan kode diskon</label>
              <div 
                onClick={() => setShowPromoModal(true)}
                className={`w-full p-4 border rounded-xl flex items-center justify-between cursor-pointer transition ${appliedPromo ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${appliedPromo ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{appliedPromo ? appliedPromo.code : 'Punya kode diskon atau referral?'}</div>
                    {appliedPromo && <div className="text-xs text-green-700">Dapat potongan harga Rp {appliedPromo.discount_value.toLocaleString()}</div>}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-end justify-between">
                <span className="text-slate-500 font-medium">Total Harga</span>
                <span className="text-2xl font-black text-red-600">Rp {finalPrice.toLocaleString()}</span>
              </div>
              {paymentMethod === 'Cicilan' && (
                <p className="text-xs text-slate-500 mt-2 text-right">*(Ini adalah tagihan bulan pertama)</p>
              )}

              <button 
                onClick={() => setCheckoutStep(2)}
                className="w-full mt-6 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-lg flex justify-center items-center gap-2"
              >
                Lanjut Isi Data Pribadi
              </button>
            </div>
          </div>
        </div>

        {/* Promo Modal */}
        <AnimatePresence>
          {showPromoModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40" onClick={() => setShowPromoModal(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Gunakan kode diskon</h3>
                  <button onClick={() => setShowPromoModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                
                <div className="flex gap-2 mb-6">
                  <input type="text" value={form.voucher} onChange={e => setForm({...form, voucher: e.target.value})} placeholder="Ketik kode diskon..." className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:border-orange-500 uppercase" />
                  <button onClick={handleApplyVoucherText} className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Terapkan</button>
                </div>

                <h4 className="font-bold text-slate-700 mb-3">Kamu bisa langsung pakai kode ini!</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {availablePromos.map(promo => (
                    <div key={promo.id} className="border border-teal-200 bg-teal-50/50 rounded-xl p-4 relative overflow-hidden flex justify-between items-center">
                      <div className="absolute right-0 top-0 text-teal-100 opacity-20 transform translate-x-4 -translate-y-4">
                        <Ticket className="w-24 h-24" />
                      </div>
                      <div className="relative z-10">
                        <div className="font-black text-slate-900 text-lg mb-1">{promo.code}</div>
                        <div className="text-sm text-slate-600 mb-2">Hemat {promo.discount_type === 'percent' ? `${promo.discount_value}%` : `Rp ${promo.discount_value.toLocaleString()}`}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3"/> Berlaku hingga {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString('id-ID') : 'Selamanya'}</div>
                      </div>
                      <button onClick={() => handleApplyVoucher(promo)} className="relative z-10 px-4 py-2 bg-white text-teal-600 font-bold text-sm border border-teal-200 rounded-full hover:bg-teal-50">Gunakan</button>
                    </div>
                  ))}
                  {appliedPromo && (
                    <button onClick={() => setAppliedPromo(null)} className="w-full py-3 text-center text-red-500 font-bold hover:bg-red-50 rounded-xl">Hapus Promo</button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN PACKAGE LIST PAGE
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-200/50 font-sans text-slate-800">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="text-xl font-black text-teal-600 tracking-tight">NIA<span className="text-slate-800">Tutoring</span></div>
            </div>
            <div className="hidden md:flex gap-6 text-sm font-bold text-slate-600">
              <a href="/bayarnia" className="hover:text-teal-600 transition-colors">Produk Kami</a>
              <a href="/bayarnia/history" className="hover:text-teal-600 transition-colors">Riwayat & Status Pembelian</a>
              <a href="/bayarnia/search-invoice" className="hover:text-teal-600 transition-colors">Cari Invoice</a>
            </div>
          </div>
          <a href="/app" className="px-5 py-2 bg-[#b8623b] text-white text-sm font-bold rounded-full hover:bg-orange-700 transition-colors">
            Masuk / Daftar
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-1 gap-6">
        
        {/* Filters Top Bar */}
        <div className="grid md:grid-cols-1 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer max-w-sm" onClick={() => setShowLevelModal(true)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-700">{selectedLevel === 'Semua' ? 'Pilih Jenjang' : selectedLevel}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        {/* Level Modal */}
        <AnimatePresence>
          {showLevelModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40" onClick={() => setShowLevelModal(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white p-6 rounded-3xl w-full max-w-lg shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Pilih Jenjang</h3>
                <div className="flex flex-wrap gap-3 mb-6">
                  {["PAUD", "SD", "SMP", "SMA/SMK", "UTBK", "Mahasiswa/Umum", "Kedinasan"].map(lvl => (
                    <button 
                      key={lvl}
                      onClick={() => { setSelectedLevel(lvl); setShowLevelModal(false); }}
                      className={`px-4 py-2 border rounded-full text-sm font-medium transition-colors ${selectedLevel === lvl ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                {selectedLevel === 'Semua' && <p className="text-sm text-slate-500 mb-6">Mohon pilih jenjang terlebih dahulu</p>}
                <button onClick={() => setShowLevelModal(false)} className="w-full py-3 bg-[#f2cdb3] text-orange-800 font-bold rounded-full hover:bg-[#eebb99] transition-colors">
                  Simpan
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Branch Modal */}
        <AnimatePresence>
          {showBranchModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40" onClick={() => setShowBranchModal(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                  <h3 className="text-xl font-bold">Pilih Cabang</h3>
                  <button onClick={() => setShowBranchModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <div className="relative">
                    <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Cari Lokasi Cabang" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500" />
                  </div>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-white">
                  {branches.map(branch => (
                    <div 
                      key={branch.id} 
                      onClick={() => setSelectedBranch(branch)}
                      className={`p-4 border rounded-2xl cursor-pointer flex gap-4 items-center transition-colors ${selectedBranch?.id === branch.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'}`}
                    >
                       <div className="flex-1">
                         <div className="font-bold text-slate-900 mb-1">{branch.name}</div>
                         <div className="text-xs text-slate-500">{branch.address}</div>
                       </div>
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedBranch?.id === branch.id ? 'border-teal-500' : 'border-slate-300'}`}>
                         {selectedBranch?.id === branch.id && <div className="w-2.5 h-2.5 bg-teal-500 rounded-full"></div>}
                       </div>
                    </div>
                  ))}
                  {branches.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-sm">Tidak ada data cabang.</div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-white">
                  <button 
                    onClick={() => {
                      if (!selectedBranch) {
                        toast.error("Pilih cabang terlebih dahulu");
                        return;
                      }
                      setShowBranchModal(false);
                      setCheckoutStep(1);
                    }} 
                    className="w-full py-3 bg-[#f2cdb3] text-orange-800 font-bold rounded-full hover:bg-[#eebb99] transition-colors"
                  >
                    Pilih
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Step-by-Step Selection */}
        <div className="mb-10">
          
          {selectionStep === "mode" && (
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Pilih Mode Belajar</h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div onClick={() => { setSelectedMode("Online"); setSelectionStep("program"); }} className="bg-white border-2 border-transparent hover:border-teal-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-xl transition-all group">
                  <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <MonitorPlay className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Video Belajar Online</h3>
                  <p className="text-slate-500 text-sm">Belajar fleksibel kapan saja, di mana saja dengan modul dan video interaktif.</p>
                </div>
                <div onClick={() => { setSelectedMode("Center"); setSelectionStep("program"); }} className="bg-white border-2 border-transparent hover:border-orange-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-xl transition-all group">
                  <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Building2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Bimbel Tatap Muka</h3>
                  <p className="text-slate-500 text-sm">Belajar intensif dan interaktif langsung di cabang NIA Tutoring Center terdekat.</p>
                </div>
              </div>
            </div>
          )}

          {selectionStep === "program" && (
            <div>
              <div className="flex items-center gap-4 mb-6 max-w-4xl mx-auto">
                <button onClick={() => setSelectionStep("mode")} className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-full hover:bg-slate-50">
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-2xl font-black text-slate-800">Pilih Tipe Program</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div onClick={() => { setSelectedProgram("Reguler"); setSelectionStep("packages"); }} className="bg-white border-2 border-transparent hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-xl transition-all group">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Program Reguler</h3>
                  <p className="text-slate-500 text-sm">Paket belajar esensial dengan fitur kurikulum lengkap dan latihan soal.</p>
                </div>
                <div onClick={() => { setSelectedProgram("Premium"); setSelectionStep("packages"); }} className="bg-white border-2 border-transparent hover:border-amber-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">Disarankan</div>
                  <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Program Premium</h3>
                  <p className="text-slate-500 text-sm">Akses tanpa batas ke seluruh materi, tryout eksklusif, dan pendampingan khusus.</p>
                </div>
              </div>
            </div>
          )}

          {selectionStep === "packages" && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setSelectionStep("program")} className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-full hover:bg-slate-50">
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 leading-tight">Pilih Paket Belajar</h2>
                  <p className="text-sm font-medium text-slate-500">
                    Menampilkan paket {selectedMode === "Center" ? "Tatap Muka" : "Online"} - {selectedProgram}
                  </p>
                </div>
              </div>
              
              {loadingPackages ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-teal-500" /></div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPackages.map(pkg => (
                    <div key={pkg.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col hover:shadow-xl transition-all">
                      {pkg.popular && <div className="inline-block px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full self-start mb-4">Paling Diminati</div>}
                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{pkg.name}</h3>
                      <div className="text-xs text-slate-500 mb-4">{pkg.level} • {pkg.grade || 'Umum'} {pkg.major ? `• ${pkg.major}` : ''}</div>
                      
                      <div className="mt-auto pt-4 border-t border-slate-100">
                        {pkg.original_price && <div className="text-sm text-slate-400 line-through mb-1">Rp {pkg.original_price.toLocaleString()}</div>}
                        <div className="text-xl font-black text-red-600 mb-4">Rp {pkg.price.toLocaleString()}</div>
                        <button 
                          onClick={() => initiateCheckout(pkg)}
                          className="w-full py-3 border-2 border-[#b8623b] text-[#b8623b] font-bold rounded-full hover:bg-orange-50 transition-colors"
                        >
                          Beli Paket Ini
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredPackages.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-2xl flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                        <SearchIcon className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">Belum ada paket</h3>
                      <p className="text-slate-500">Belum ada paket untuk kriteria jenjang dan program ini.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);
