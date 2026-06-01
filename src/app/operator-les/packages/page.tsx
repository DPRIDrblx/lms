"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Plus, Edit, Settings2, Trash2, Package, Tag, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function PackagesPage() {
  const supabase = createClient();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [level, setLevel] = useState("SMA");
  const [major, setMajor] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [features, setFeatures] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("nia_packages")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) setPackages(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      name, level, major, 
      price: parseInt(price), 
      original_price: originalPrice ? parseInt(originalPrice) : null,
      features: features ? features.split(',').map(f => f.trim()) : [],
      is_active: isActive
    };

    if (editingId) {
      await supabase.from("nia_packages").update(payload).eq("id", editingId);
    } else {
      await supabase.from("nia_packages").insert(payload);
    }

    setShowModal(false);
    resetForm();
    fetchPackages();
  };

  const handleEdit = (pkg: any) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setLevel(pkg.level);
    setMajor(pkg.major || "");
    setPrice(pkg.price.toString());
    setOriginalPrice(pkg.original_price?.toString() || "");
    setFeatures(pkg.features ? pkg.features.join(", ") : "");
    setIsActive(pkg.is_active);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus paket ini?")) {
      await supabase.from("nia_packages").delete().eq("id", id);
      fetchPackages();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName(""); setLevel("SMA"); setMajor(""); setPrice(""); setOriginalPrice(""); setFeatures(""); setIsActive(true);
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manajemen Paket Belajar</h1>
          <p className="text-slate-500 font-medium">Buat dan atur harga paket bimbingan belajar untuk Sobat NIA.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" /> Buat Paket Baru
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={pkg.id} className={`bg-white rounded-2xl border ${pkg.is_active ? 'border-orange-200' : 'border-slate-200'} shadow-sm overflow-hidden flex flex-col`}>
              <div className={`p-6 ${pkg.is_active ? 'bg-orange-50/50' : 'bg-slate-50'} border-b border-slate-100 flex-1`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${pkg.is_active ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'}`}>
                    {pkg.level} {pkg.major ? `- ${pkg.major}` : ''}
                  </span>
                  {!pkg.is_active && <span className="px-2 py-1 text-xs font-bold text-slate-400 bg-slate-100 rounded">Nonaktif</span>}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{pkg.name}</h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-2xl font-black text-slate-900">Rp {pkg.price.toLocaleString()}</span>
                  {pkg.original_price && <span className="text-sm font-bold text-slate-400 line-through mb-1">Rp {pkg.original_price.toLocaleString()}</span>}
                </div>
                {pkg.features && pkg.features.length > 0 && (
                  <ul className="space-y-2 mt-4">
                    {pkg.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Tag className="w-4 h-4 text-orange-500" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-2">
                <a href={`/operator-les/packages/${pkg.id}/courses`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex gap-2 items-center text-sm font-bold">
                  <BookOpen className="w-4 h-4" /> Atur Materi
                </a>
                <div className="flex-1" />
                <button onClick={() => handleEdit(pkg)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                <button onClick={() => handleDelete(pkg.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-900">{editingId ? "Edit Paket" : "Buat Paket Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Paket</label>
                <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Contoh: Paket Intensif UTBK" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Jenjang</label>
                  <select value={level} onChange={e=>setLevel(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none">
                    <option>SD</option><option>SMP</option><option>SMA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Jurusan (Opsional)</label>
                  <input type="text" value={major} onChange={e=>setMajor(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Contoh: IPA / IPS" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Harga Jual (Rp)</label>
                  <input required type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="450000" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Harga Coret (Rp)</label>
                  <input type="number" value={originalPrice} onChange={e=>setOriginalPrice(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="600000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Fitur Utama (Pisahkan dengan Koma)</label>
                <textarea value={features} onChange={e=>setFeatures(e.target.value)} rows={3} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Tryout UTBK 10x, Konsultasi 24/7, Materi Lengkap" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={isActive} onChange={e=>setIsActive(e.target.checked)} className="w-5 h-5 accent-orange-500 rounded" />
                <label htmlFor="isActive" className="font-bold text-slate-700">Tampilkan Paket ini di Publik</label>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">Batal</button>
                <button type="submit" className="px-5 py-2.5 font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600">Simpan Paket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
