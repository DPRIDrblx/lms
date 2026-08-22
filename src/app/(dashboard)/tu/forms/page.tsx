"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, Link as LinkIcon, Edit, Eye, Copy, Check, FileText, Lock, Globe } from "lucide-react";
import { format } from "date-fns";

export default function FormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setForms(data);
    setLoading(false);
  };

  const handleCopyLink = (formId: string) => {
    const url = `${window.location.origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-gray-500">Kelola dan buat formulir dinamis berstandar korporat.</p>
        </div>
        <button
          onClick={() => router.push("/tu/forms/new")}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Buat Form Baru
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Belum ada form</h3>
          <p className="text-gray-500 max-w-md mx-auto mt-2">Buat form pertama Anda untuk mulai mengumpulkan data dari siswa, guru, maupun umum.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                  {form.logo_type}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCopyLink(form.id)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="Copy Public Link"
                  >
                    {copiedId === form.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{form.title}</h3>
              <p className="text-gray-500 text-sm mt-2 line-clamp-2 min-h-[40px]">{form.description || "Tidak ada deskripsi."}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                <span>Dibuat: {format(new Date(form.created_at), "dd MMM yyyy")}</span>
                {form.require_sso ? (
                  <span className="flex items-center gap-1 text-amber-600"><Lock className="w-3 h-3" /> Wajib SSO</span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600"><Globe className="w-3 h-3" /> Publik</span>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => router.push(`/tu/forms/${form.id}/builder`)}
                  className="flex-1 flex justify-center items-center gap-2 bg-indigo-50 text-indigo-700 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => router.push(`/tu/forms/${form.id}/responses`)}
                  className="flex-1 flex justify-center items-center gap-2 bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  <Eye className="w-4 h-4" /> Hasil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Add missing icons at the top later via imports if needed, but wait I didn't import FileText, Lock, Globe.
// Let me update the file content with the missing imports!
