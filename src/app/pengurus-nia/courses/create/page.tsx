"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Save, Image as ImageIcon, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreatePengurusCoursePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    cover_image: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("courses")
      .insert({
        teacher_id: profile.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        cover_image: formData.cover_image || null,
        is_published: false,
        class_id: null // Not used for NIA Tutoring
      })
      .select()
      .single();

    if (data) {
      router.push(`/pengurus-nia/courses/${data.id}`);
    } else {
      setLoading(false);
      alert(error?.message || "Gagal membuat materi");
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-4xl mx-auto">
      <Link href="/pengurus-nia/courses" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-4 w-fit">
        <ArrowLeft className="w-5 h-5" /> Kembali ke Manajemen Materi
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-slate-900">Buat Materi Baru</h1>
        <p className="text-slate-500 font-medium mt-1">Buat kerangka kursus yang akan dijual di Paket Belajar.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Informasi Dasar</h2>
            <p className="text-sm text-slate-500">Lengkapi detail materi pembelajaran.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Judul Materi</label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Pengantar Fisika Kuantum"
              className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Materi</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan apa yang akan dipelajari siswa di materi ini..."
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kategori Jurusan</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium appearance-none"
              >
                <option value="Sains">Sains & IPA</option>
                <option value="Sosial">Sosial & IPS</option>
                <option value="Matematika">Matematika</option>
                <option value="Bahasa">Bahasa</option>
                <option value="Komputer">Komputer & IT</option>
                <option value="Bisnis">Bisnis</option>
                <option value="Riset">Riset</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">URL Gambar Sampul (Opsional)</label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                />
                <ImageIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-lg"
            >
              {loading ? "Menyimpan..." : <><Save className="w-5 h-5" /> Simpan & Lanjut ke Editor Materi</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
