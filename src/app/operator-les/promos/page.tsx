"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Plus, Trash2, Tag, Percent, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function PromosPage() {
  const supabase = createClient();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("nia_promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) setPromos(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      code: code.toUpperCase().replace(/\s+/g, ''),
      discount_type: discountType,
      discount_value: parseInt(discountValue),
      max_uses: maxUses ? parseInt(maxUses) : null,
    };

    const { error } = await supabase.from("nia_promo_codes").insert(payload);
    
    if (error) {
      alert("Gagal membuat promo. Pastikan kode unik dan belum pernah digunakan.");
    }

    setShowModal(false);
    resetForm();
    fetchPromos();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus voucher ini?")) {
      await supabase.from("nia_promo_codes").delete().eq("id", id);
      fetchPromos();
    }
  };

  const resetForm = () => {
    setCode(""); setDiscountType("percent"); setDiscountValue(""); setMaxUses("");
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manajemen Kode Voucher</h1>
          <p className="text-slate-500 font-medium">Buat kode promo diskon untuk pembelian paket bimbel.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" /> Buat Voucher Baru
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map(promo => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={promo.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-4">
                {promo.discount_type === 'percent' ? <Percent className="w-6 h-6" /> : <Receipt className="w-6 h-6" />}
              </div>
              <div className="inline-block px-4 py-2 bg-slate-900 text-white font-black tracking-widest uppercase rounded-lg mb-4 text-lg">
                {promo.code}
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-sm font-medium">Nilai Diskon</p>
                <p className="text-2xl font-black text-green-600">
                  {promo.discount_type === 'percent' ? `${promo.discount_value}% OFF` : `Rp ${promo.discount_value.toLocaleString()}`}
                </p>
              </div>
              {promo.max_uses && (
                <p className="text-xs font-bold text-slate-400 mt-4 bg-slate-50 p-2 rounded-lg inline-block">
                  Batas Penggunaan: {promo.max_uses} kali
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-900">Buat Voucher Baru</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kode Voucher</label>
                <input required type="text" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none uppercase font-bold tracking-widest" placeholder="DISC50" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <button type="button" onClick={() => setDiscountType('percent')} className={`py-2 rounded-lg font-bold text-sm transition-colors ${discountType === 'percent' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Persentase (%)</button>
                <button type="button" onClick={() => setDiscountType('flat')} className={`py-2 rounded-lg font-bold text-sm transition-colors ${discountType === 'flat' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Nominal (Rp)</button>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Besar Diskon {discountType === 'percent' ? '(%)' : '(Rp)'}
                </label>
                <input required type="number" value={discountValue} onChange={e=>setDiscountValue(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder={discountType === 'percent' ? '50' : '50000'} />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Maksimal Penggunaan (Opsional)</label>
                <input type="number" value={maxUses} onChange={e=>setMaxUses(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Biarkan kosong jika unlimited" />
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">Batal</button>
                <button type="submit" className="px-5 py-2.5 font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600">Buat Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
