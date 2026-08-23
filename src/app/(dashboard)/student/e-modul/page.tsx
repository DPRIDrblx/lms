"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { FolderOpen, ExternalLink, BookOpen, Search, BookText, Bookmark } from "lucide-react";
import Link from "next/link";
import { CenterLoader } from "@/components/ui/center-loader";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export default function EModulPage() {
  const { profile, isCenterStudent } = useAuth();
  const { uiMode } = useTheme();
  const supabase = createClient();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.class_id) {
      setLoading(false);
      return;
    }
    
    const fetchModules = async () => {
      const { data } = await supabase
        .from("e_modules")
        .select("*")
        .eq("class_id", profile.class_id)
        .order("created_at", { ascending: false });
        
      if (data) setModules(data);
      setTimeout(() => setLoading(false), 500);
    };

    fetchModules();
  }, [profile?.class_id, supabase]);

  if (!isCenterStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FolderOpen className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 font-bold max-w-md">Halaman ini khusus untuk siswa Center (7E, 8E, 9E).</p>
      </div>
    );
  }

  // Generate a random gradient for the book cover based on the id
  const getGradient = (index: number) => {
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-emerald-400 to-teal-600",
      "from-orange-400 to-rose-500",
      "from-violet-500 to-fuchsia-600",
      "from-cyan-400 to-blue-600",
      "from-amber-400 to-orange-500"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans pb-20">
      {uiMode === 'clean' ? (
        <div className="mb-8">
          <h1 className="text-[28px] font-black text-slate-800 tracking-tight mb-2">E-Modul Belajar</h1>
          <p className="text-slate-500 text-[15px]">Akses semua buku dan modul pelajaranmu secara digital kapan saja.</p>
        </div>
      ) : (
        <div className="bg-red-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border-b-4 border-red-600 mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/30">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">E-Modul Center</h1>
              <p className="text-red-100 font-bold text-lg">Akses semua modul pelajaranmu dari Google Drive kapan saja.</p>
            </div>
          </div>
        </div>
      )}

      {uiMode === 'clean' && modules.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[16px] border border-slate-200 shadow-sm mb-6">
           <div className="relative w-full sm:w-72">
             <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Cari modul..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold focus:outline-none focus:border-[#108B96] transition-colors" />
           </div>
           <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
             <button className="px-4 py-2 bg-[#108B96] text-white rounded-xl text-[13px] font-bold shrink-0">Semua Modul</button>
             <button className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-[13px] font-bold shrink-0 hover:bg-slate-100">Semester 1</button>
             <button className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-[13px] font-bold shrink-0 hover:bg-slate-100">Semester 2</button>
           </div>
        </div>
      )}

      <div className={cn("grid gap-6", uiMode === 'clean' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
        {loading ? (
          <div className="col-span-full flex flex-col justify-center items-center py-12">
            <CenterLoader size="md" />
          </div>
        ) : modules.length > 0 ? (
          modules.map((mod, index) => (
            <div key={mod.id} className="group relative flex flex-col h-full">
              {/* The Book Cover */}
              {mod.pdf_url ? (
                <Link href={`/student/e-modul/${mod.id}`} className="block relative w-full aspect-[3/4] rounded-r-[16px] rounded-l-[4px] shadow-sm hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 group-hover:rotate-1">
                  {/* Spine effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20 rounded-l-[4px] z-20"></div>
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-white/30 z-20"></div>
                  
                  <div className={cn("absolute inset-0 rounded-r-[16px] rounded-l-[4px] bg-gradient-to-br p-6 flex flex-col z-10", getGradient(index))}>
                     {/* Decorative pattern */}
                     <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                     
                     <div className="relative z-10 flex flex-col h-full">
                       <div className="mb-auto flex justify-between items-start">
                         <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                           <BookText className="w-5 h-5 text-white" />
                         </div>
                         <Bookmark className="w-6 h-6 text-white/50" />
                       </div>
                       
                       <div className="mt-auto">
                         {mod.grade_level && (
                           <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase rounded-[6px] mb-3 border border-white/20">
                             Kelas {mod.grade_level}
                           </span>
                         )}
                         <h3 className="text-white font-black text-xl leading-tight line-clamp-3">{mod.title}</h3>
                       </div>
                     </div>
                  </div>
                </Link>
              ) : (
                <a href={mod.drive_link} target="_blank" rel="noopener noreferrer" className="block relative w-full aspect-[3/4] rounded-r-[16px] rounded-l-[4px] shadow-sm hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 group-hover:rotate-1">
                   {/* Spine effect */}
                   <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20 rounded-l-[4px] z-20"></div>
                   <div className="absolute left-3 top-0 bottom-0 w-px bg-white/30 z-20"></div>
                   
                   <div className={cn("absolute inset-0 rounded-r-[16px] rounded-l-[4px] bg-gradient-to-br p-6 flex flex-col z-10", getGradient(index))}>
                      {/* Decorative pattern */}
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                      
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-auto flex justify-between items-start">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <BookText className="w-5 h-5 text-white" />
                          </div>
                          <Bookmark className="w-6 h-6 text-white/50" />
                        </div>
                        
                        <div className="mt-auto">
                          {mod.grade_level && (
                            <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase rounded-[6px] mb-3 border border-white/20">
                              Kelas {mod.grade_level}
                            </span>
                          )}
                          <h3 className="text-white font-black text-xl leading-tight line-clamp-3">{mod.title}</h3>
                        </div>
                      </div>
                   </div>
                </a>
              )}
              
              {/* Below Cover Details */}
              <div className="mt-4 px-1">
                <h3 className="text-[15px] font-bold text-slate-800 line-clamp-1 group-hover:text-[#108B96] transition-colors">{mod.title}</h3>
                <p className="text-[13px] font-semibold text-slate-500 mt-1">Modul Pembelajaran</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {mod.pdf_url ? (
                    <Link href={`/student/e-modul/${mod.id}`}>
                      <Button variant="ghost" className="w-full h-9 border-2 border-slate-200 text-[#108B96] font-bold text-[12px] hover:bg-[#108B96] hover:text-white hover:border-[#108B96] rounded-[10px]">
                        Buka E-Modul Interaktif
                      </Button>
                    </Link>
                  ) : (
                    <a href={mod.drive_link} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" className="w-full h-9 border-2 border-slate-200 text-[#108B96] font-bold text-[12px] hover:bg-[#108B96] hover:text-white hover:border-[#108B96] rounded-[10px]">
                        Buka Modul Lama <ExternalLink className="w-3.5 h-3.5 ml-2" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white rounded-[20px] border border-dashed border-slate-200">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-700 mb-1">Belum Ada E-Modul</h3>
            <p className="text-slate-500 text-[13px]">Tata Usaha belum menambahkan link Google Drive untuk kelasmu.</p>
          </div>
        )}
      </div>
    </div>
  );
}
