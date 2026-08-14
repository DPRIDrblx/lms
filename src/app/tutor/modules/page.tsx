"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { BookOpen, ExternalLink, Filter, Search } from "lucide-react";

export default function TutorModulesPage() {
  const supabase = createClient();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchModules = async () => {
      const { data } = await supabase
        .from("e_modules")
        .select("*, classes(name)")
        .order("created_at", { ascending: false });
      
      if (data) setModules(data);
      setLoading(false);
    };
    fetchModules();
  }, []);

  const filtered = modules.filter(m => 
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.grade_level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Materi Modul</h1>
        <p className="text-slate-500 font-medium">Akses seluruh modul pembelajaran dan materi referensi.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari modul atau kelas..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500"
        />
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
          Belum ada modul yang tersedia atau ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(mod => (
            <Card key={mod.id} className="p-6 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 line-clamp-2">{mod.title}</h3>
                <div className="flex gap-2 mt-3">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                    {mod.grade_level || 'Umum'}
                  </span>
                  {mod.classes?.name && (
                    <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-100">
                      Kelas: {mod.classes.name}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100">
                <a 
                  href={mod.drive_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-full px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Buka Modul <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
