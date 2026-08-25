"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function EditNiaPediaPage() {
  const { id } = useParams();
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      const { data, error } = await supabase.from("nia_pedia").select("*").eq("id", id as string).single();
      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setKeywords(data.keywords || "");
        setExistingBannerUrl(data.banner_url);
        if (data.banner_url) setBannerPreview(data.banner_url);
      } else {
        toast.error("Artikel tidak ditemukan");
        router.push("/operator-les/nia-pedia");
      }
      setLoading(false);
    };
    fetchPost();
  }, [id, supabase, router]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Judul wajib diisi");
    if (!content.trim()) return toast.error("Isi konten tidak boleh kosong");

    setSaving(true);
    const toastId = toast.loading("Menyimpan pembaruan...");
    let bannerUrl = existingBannerUrl;

    if (bannerFile) {
      const fileExt = bannerFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("nia_pedia_assets")
        .upload(`banners/${fileName}`, bannerFile);

      if (uploadError) {
        toast.error("Gagal mengunggah banner: " + uploadError.message, { id: toastId });
        setSaving(false);
        return;
      }
      bannerUrl = supabase.storage.from("nia_pedia_assets").getPublicUrl(`banners/${fileName}`).data.publicUrl;
    } else if (bannerPreview === null) {
      // User removed the banner
      bannerUrl = null;
    }

    const { error } = await supabase.from("nia_pedia").update({
      title,
      content,
      keywords,
      banner_url: bannerUrl,
      updated_at: new Date().toISOString()
    }).eq("id", id as string);

    if (error) {
      toast.error("Gagal menyimpan pembaruan: " + error.message, { id: toastId });
      setSaving(false);
    } else {
      toast.success("Blog berhasil diperbarui!", { id: toastId });
      router.push("/operator-les/nia-pedia");
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/operator-les/nia-pedia">
            <Button variant="secondary" size="sm" className="rounded-full px-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">Edit Blog</h1>
            <p className="text-slate-500 font-medium">Perbarui artikel NIA Pedia.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 font-bold gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Simpan Perubahan
        </Button>
      </div>

      <div className="space-y-6">
        {/* Banner Upload */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800">Banner / Gambar Utama</h3>
          {bannerPreview ? (
            <div className="relative rounded-xl overflow-hidden aspect-video max-w-xl border border-slate-200 bg-slate-100">
              <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setBannerPreview(null); setBannerFile(null); }}
                className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full max-w-xl aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-500">
              <Upload className="w-10 h-10 mb-3 text-slate-400" />
              <p className="font-bold mb-1">Unggah Banner</p>
              <p className="text-xs">Klik atau seret file gambar ke sini (Rasio 16:9 direkomendasikan)</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            </label>
          )}
        </div>

        {/* Title & Keywords */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Judul Artikel <span className="text-red-500">*</span></label>
            <input 
              value={title} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
              placeholder="Contoh: 5 Tips Belajar Efektif di Rumah" 
              className="w-full text-lg font-semibold py-3 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Kata Kunci (Opsional)</label>
            <input 
              value={keywords} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeywords(e.target.value)} 
              placeholder="Pisahkan dengan koma (contoh: tips belajar, sbmptn, snbt)" 
              className="w-full py-2 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Rich Text */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Isi Konten <span className="text-red-500">*</span></label>
          <RichTextEditor value={content} onChange={setContent} placeholder="Mulai menulis artikel Anda di sini..." />
        </div>
      </div>
    </div>
  );
}
