"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useConfirmStore } from "@/components/ui/GlobalConfirmModal";
import { Plus, Trash2, ArrowLeft, Search, BookOpen } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PackageCoursesPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [pkg, setPkg] = useState<any>(null);
  const [packageCourses, setPackageCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch package details
    const { data: pkgData } = await supabase.from("nia_packages").select("*").eq("id", id).single();
    if (pkgData) setPkg(pkgData);

    // Fetch courses already in the package
    const { data: linkedData } = await supabase
      .from("nia_package_courses")
      .select("course_id, courses(*)")
      .eq("package_id", id);
    
    if (linkedData) setPackageCourses(linkedData.map((d: any) => d.courses).filter((c: any) => c !== null));

    // Fetch all courses to add
    const { data: coursesData } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (coursesData) setAllCourses(coursesData);

    setLoading(false);
  };

  const handleAddCourse = async (courseId: string) => {
    const { error } = await supabase.from("nia_package_courses").insert({
      package_id: id,
      course_id: courseId
    });
    if (!error) {
      fetchData();
      setShowAddModal(false);
    } else {
      alert("Gagal menambahkan course. Mungkin sudah ada di dalam paket.");
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    useConfirmStore.getState().showConfirm({
      title: "Keluarkan Materi?",
      message: "Keluarkan course ini dari paket?",
      onConfirm: async () => {
        await supabase.from("nia_package_courses").delete().match({ package_id: id, course_id: courseId });
        fetchData();
      }
    });
  };

  // Filter courses that are not already in the package
  const availableCourses = allCourses.filter(
    ac => !packageCourses.find(pc => pc.id === ac.id) && 
          ac.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto">
      <button onClick={() => router.push("/operator-les/packages")} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-4">
        <ArrowLeft className="w-5 h-5" /> Kembali ke Manajemen Paket
      </button>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/20">
            <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-bold mb-3 inline-block">
              {pkg?.level} {pkg?.major ? `- ${pkg?.major}` : ''}
            </span>
            <h1 className="text-3xl font-black mb-2">{pkg?.name}</h1>
            <p className="text-orange-100 font-medium">Atur materi (Course) apa saja yang bisa diakses oleh Sobat IGNITE yang membeli paket ini.</p>
          </div>

          <div className="flex justify-between items-center mt-8 mb-4">
            <h2 className="text-2xl font-black text-slate-900">Materi dalam Paket ({packageCourses.length})</h2>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-5 h-5" /> Tambah Materi
            </button>
          </div>

          {packageCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packageCourses.map(course => (
                <div key={course.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-start justify-between group hover:border-orange-200 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{course.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{course.description || "Tidak ada deskripsi"}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveCourse(course.id)} className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Belum ada materi di dalam paket ini.</p>
            </div>
          )}

          {/* Add Course Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                  <h2 className="text-xl font-black text-slate-900">Tambahkan Materi ke Paket</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                </div>
                
                <div className="p-4 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari nama materi..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {availableCourses.length > 0 ? availableCourses.map(course => (
                    <div key={course.id} className="border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-900">{course.title}</h4>
                        <p className="text-sm text-slate-500 truncate max-w-md">{course.description || "Tidak ada deskripsi"}</p>
                      </div>
                      <button 
                        onClick={() => handleAddCourse(course.id)}
                        className="px-4 py-2 bg-orange-100 text-orange-600 font-bold rounded-lg hover:bg-orange-200 shrink-0"
                      >
                        Tambah
                      </button>
                    </div>
                  )) : (
                    <p className="text-center text-slate-500 py-10 font-medium">Tidak ada materi yang ditemukan.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
