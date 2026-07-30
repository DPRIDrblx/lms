"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewFormPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    logo_type: "IGNITE",
    require_sso: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert("Judul form harus diisi");

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("forms")
      .insert({
        title: formData.title,
        description: formData.description,
        logo_type: formData.logo_type,
        require_sso: formData.require_sso,
        created_by: userData?.user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Gagal membuat form.");
      setLoading(false);
    } else {
      router.push(`/tu/forms/${data.id}/builder`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tu/forms" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buat Form Baru</h1>
          <p className="text-gray-500">Atur informasi dasar formulir Anda.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Judul Form <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              placeholder="Contoh: Formulir Pendaftaran Siswa Baru"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Deskripsi Singkat</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
              placeholder="Jelaskan tujuan formulir ini secara singkat..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Logo Header</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['IGNITE', 'IGNITE Center', 'NIA Center'].map((logo) => (
                <div 
                  key={logo}
                  onClick={() => setFormData({ ...formData, logo_type: logo })}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center font-bold ${
                    formData.logo_type === logo 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-200 hover:border-indigo-300 text-gray-600'
                  }`}
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={formData.require_sso}
                  onChange={(e) => setFormData({ ...formData, require_sso: e.target.checked })}
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${formData.require_sso ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.require_sso ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <div>
                <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Wajib Login SSO</div>
                <div className="text-sm text-gray-500">Responden harus login menggunakan akun sistem. Memungkinkan data nama dan email otomatis terisi.</div>
              </div>
            </label>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan & Buat Pertanyaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
