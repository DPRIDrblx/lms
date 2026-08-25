"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { BookOpen, Search, Clock, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

export default function NiaPediaPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      let query = supabase
        .from("nia_pedia")
        .select("*, author:author_id(full_name)")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("title", `%${search}%`); // Basic search for now
      }

      const { data } = await query;
      if (data) setPosts(data);
      setLoading(false);
    };

    const timer = setTimeout(fetchPosts, 300);
    return () => clearTimeout(timer);
  }, [search, supabase]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl text-slate-800 tracking-tight">NIA Pedia</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5">
              <Home className="w-4 h-4" /> Beranda
            </Link>
            <Link href="/login" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full font-bold text-sm hover:bg-indigo-100 transition-colors">
              Masuk
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-indigo-600 text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Eksplorasi Ilmu & Informasi</h1>
          <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Temukan berbagai artikel menarik, panduan belajar, dan pengumuman terbaru seputar dunia pendidikan di IGNITE.
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari artikel, panduan, atau informasi..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full text-slate-900 border-none outline-none shadow-xl focus:ring-4 focus:ring-indigo-500/30 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Belum Ada Artikel</h2>
            <p className="text-slate-500">Artikel tidak ditemukan atau belum ada artikel yang diterbitkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link href={`/nia-pedia/${post.slug}`} key={post.id} className="bg-white rounded-[24px] overflow-hidden border border-slate-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all hover:-translate-y-1 group flex flex-col">
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {post.banner_url ? (
                    <img src={post.banner_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-black text-xl text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h3>
                  {post.keywords && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.keywords.split(',').map((kw: string, i: number) => (
                        <span key={i} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1.5 truncate">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
