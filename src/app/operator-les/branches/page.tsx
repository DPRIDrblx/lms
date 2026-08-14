"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useConfirmStore } from "@/components/ui/GlobalConfirmModal";
import { Plus, Trash2, MapPin, Building, Map } from "lucide-react";
import { motion } from "framer-motion";

export default function BranchesPage() {
  const supabase = createClient();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("nia_branches")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) setBranches(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      name,
      address,
      city,
      province,
      is_active: true
    };

    const { error } = await supabase.from("nia_branches").insert(payload);
    
    if (error) {
      useConfirmStore.getState().showConfirm({
        title: "Gagal",
        message: "Gagal membuat cabang: " + error.message,
        isAlert: true,
        onConfirm: () => {}
      });
    }

    setShowModal(false);
    resetForm();
    fetchBranches();
  };

  const handleDelete = async (id: string) => {
    useConfirmStore.getState().showConfirm({
      title: "Hapus Cabang?",
      message: "Yakin ingin menghapus cabang ini?",
      onConfirm: async () => {
        await supabase.from("nia_branches").delete().eq("id", id);
        fetchBranches();
      }
    });
  };

  const resetForm = () => {
    setName(""); setAddress(""); setCity(""); setProvince("");
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manajemen Cabang (Center)</h1>
          <p className="text-slate-500 font-medium">Kelola lokasi cabang untuk pilihan paket Bimbel Tatap Muka.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Cabang
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map(branch => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={branch.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDelete(branch.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{branch.name}</h3>
                  <div className="flex items-start gap-2 text-slate-500 text-sm mb-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="leading-tight">{branch.address}</p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <Map className="w-4 h-4" />
                    {branch.city}, {branch.province}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {branches.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              Belum ada cabang terdaftar.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Tambah Cabang Baru</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Cabang (e.g., Ambon - Said Perintah)</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea required rows={3} value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kota / Kabupaten</label>
                  <input required type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Provinsi</label>
                  <input required type="text" value={province} onChange={e => setProvince(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">Simpan Cabang</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
