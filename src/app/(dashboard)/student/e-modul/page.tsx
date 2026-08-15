"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { FolderOpen, ExternalLink, BookOpen } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Card } from "@/components/ui/card";
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
      setTimeout(() => setLoading(false), 1500);
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans pb-20">
      {uiMode === 'clean' ? (
        <div className="mb-6 pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">E-Modul Center</h1>
          <p className="text-slate-500 mt-1">Akses semua modul pelajaranmu dari Google Drive kapan saja.</p>
        </div>
      ) : (
        <div className="bg-red-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border-b-4 border-red-600">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col justify-center items-center py-12">
            <CenterLoader size="md" />
          </div>
        ) : modules.length > 0 ? (
          modules.map(mod => (
            <Card key={mod.id} className={cn(
              "p-6 transition-all group flex flex-col h-full",
              uiMode === 'clean' 
                ? "border border-slate-200 shadow-sm hover:border-slate-300"
                : "border-slate-200 hover:border-red-300 hover:shadow-lg"
            )}>
              <div className="flex-1">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
                  uiMode === 'clean' ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-600"
                )}>
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h3 className={cn("mb-2 line-clamp-2 text-slate-800", uiMode === 'clean' ? "font-semibold text-lg" : "font-bold text-lg")}>{mod.title}</h3>
                {mod.grade_level && (
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg mb-4">
                    {mod.grade_level}
                  </span>
                )}
              </div>
              <a href={mod.drive_link} target="_blank" rel="noopener noreferrer" className="mt-auto">
                <Button className="w-full bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border-0 font-bold">
                  Buka Drive <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-1">Belum Ada E-Modul</h3>
            <p className="text-slate-500">Tata Usaha belum menambahkan link Google Drive untuk kelasmu.</p>
          </div>
        )}
      </div>
    </div>
  );
}
