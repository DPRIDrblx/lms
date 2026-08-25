"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, User, BookOpen, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function NiaPediaDetailPage() {
  const { slug } = useParams();
  const supabase = createClient();
  const router = useRouter();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from("nia_pedia")
        .select("*, author:author_id(full_name)")
        .eq("slug", slug as string)
        .single();
        
      if (data) {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [slug, supabase]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: `Baca artikel "${post?.title}" di NIA Pedia`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tautan disalin ke clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6">
        <BookOpen className="w-20 h-20 text-slate-300 mb-6" />
        <h1 className="text-3xl font-black text-slate-800 mb-4">Artikel Tidak Ditemukan</h1>
        <p className="text-slate-500 max-w-md mx-auto mb-8">Maaf, artikel yang Anda cari mungkin telah dihapus atau URL-nya salah.</p>
        <Link href="/nia-pedia">
          <Button className="bg-indigo-600 hover:bg-indigo-700">Kembali ke NIA Pedia</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/nia-pedia" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-bold text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Bagikan
          </Button>
        </div>
      </nav>

      {/* Hero Banner */}
      {post.banner_url && (
        <div className="w-full h-[40vh] md:h-[60vh] bg-slate-200 relative">
          <img src={post.banner_url} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl border border-slate-100 mb-12">
          
          {post.keywords && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.keywords.split(',').map((kw: string, i: number) => (
                <span key={i} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  {kw.trim()}
                </span>
              ))}
            </div>
          )}
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500 mb-10 pb-10 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <span>Ditulis oleh <span className="font-bold text-slate-800">{post.author?.full_name || 'Admin'}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          
          {/* Rich Text Content */}
          <div 
            className="prose prose-lg prose-indigo max-w-none prose-headings:font-black prose-a:text-indigo-600 prose-img:rounded-2xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </main>
    </div>
  );
}
