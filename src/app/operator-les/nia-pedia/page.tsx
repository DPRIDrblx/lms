"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { BookOpen, Plus, Edit2, Trash2, Link as LinkIcon, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function OperatorNiaPediaPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("nia_pedia")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus blog ini?")) return;
    
    const toastId = toast.loading("Menghapus blog...");
    const { error } = await supabase.from("nia_pedia").delete().eq("id", id);
    
    if (error) {
      toast.error("Gagal menghapus: " + error.message, { id: toastId });
    } else {
      toast.success("Blog berhasil dihapus", { id: toastId });
      fetchPosts();
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/nia-pedia/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Tautan disalin ke clipboard!");
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">NIA Pedia</h1>
          <p className="text-slate-500 font-medium">Kelola artikel edukasi dan pengumuman (Blog).</p>
        </div>
        <Link href="/operator-les/nia-pedia/create">
          <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 font-bold gap-2">
            <Plus className="w-5 h-5" /> Tulis Blog Baru
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Belum ada artikel</h3>
          <p className="text-slate-500">Mulai tulis artikel pertama Anda untuk NIA Pedia.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-700">Judul Artikel</th>
                  <th className="p-4 font-bold text-slate-700">Kata Kunci</th>
                  <th className="p-4 font-bold text-slate-700">Tanggal</th>
                  <th className="p-4 font-bold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 line-clamp-1">{post.title}</div>
                      <div className="text-sm text-slate-500">/{post.slug}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {post.keywords ? post.keywords.split(',').map((kw: string, i: number) => (
                          <span key={i} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            {kw.trim()}
                          </span>
                        )) : <span className="text-slate-400 text-sm">-</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-500">
                      {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => copyLink(post.slug)} title="Copy Link" className="bg-white border-slate-200">
                          <LinkIcon className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Link href={`/nia-pedia/${post.slug}`} target="_blank">
                          <Button variant="secondary" size="sm" title="Buka" className="bg-white border-slate-200">
                            <ExternalLink className="w-4 h-4 text-indigo-600" />
                          </Button>
                        </Link>
                        <Link href={`/operator-les/nia-pedia/${post.id}`}>
                          <Button variant="secondary" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="secondary" size="sm" onClick={() => handleDelete(post.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
