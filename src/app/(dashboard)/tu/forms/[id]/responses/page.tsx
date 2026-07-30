"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, User } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

export default function FormResponsesPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();
  
  const [form, setForm] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponses();
  }, [id]);

  const fetchResponses = async () => {
    // 1. Fetch form
    const { data: formData } = await supabase.from("forms").select("*").eq("id", id).single();
    if (formData) setForm(formData);

    // 2. Fetch questions ordered by page and index
    const { data: pagesData } = await supabase
      .from("form_pages")
      .select("*, form_questions(*)")
      .eq("form_id", id)
      .order("order_index");

    let allQuestions: any[] = [];
    if (pagesData) {
      pagesData.forEach((p: any) => {
        const sortedQ = p.form_questions.sort((a: any, b: any) => a.order_index - b.order_index);
        allQuestions = [...allQuestions, ...sortedQ];
      });
      setQuestions(allQuestions);
    }

    // 3. Fetch responses with answers and profiles
    const { data: responsesData } = await supabase
      .from("form_responses")
      .select("*, profiles(full_name, email), form_answers(*)")
      .eq("form_id", id)
      .order("submitted_at", { ascending: false });

    if (responsesData) {
      setResponses(responsesData);
    }
    setLoading(false);
  };

  const handleExportExcel = () => {
    if (responses.length === 0) return alert("Belum ada data respons.");
    
    // Prepare data
    const exportData = responses.map(res => {
      const row: any = {
        "Tanggal Submit": format(new Date(res.submitted_at), "yyyy-MM-dd HH:mm:ss"),
        "Nama Akun (SSO)": res.profiles?.full_name || "Guest",
        "Email Akun (SSO)": res.profiles?.email || "-",
      };

      questions.forEach(q => {
        const answer = res.form_answers.find((a: any) => a.question_id === q.id);
        if (!answer) {
          row[q.title] = "-";
        } else if (q.type === "address" && answer.answer_data) {
          row[q.title] = `${answer.answer_data.province || ''}, ${answer.answer_data.regency || ''}, ${answer.answer_data.district || ''}`;
        } else if (q.type === "school" && answer.answer_data) {
          row[q.title] = `${answer.answer_data.name || ''} (NPSN: ${answer.answer_data.npsn || ''})`;
        } else {
          row[q.title] = answer.answer_text || "-";
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    XLSX.writeFile(workbook, `Hasil_Form_${form?.title || 'Data'}.xlsx`);
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Memuat Hasil...</div>;
  if (!form) return <div className="p-10 text-center text-red-500">Form tidak ditemukan.</div>;

  const currentResponse = responses[currentIndex];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/tu/forms")} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hasil: {form.title}</h1>
            <p className="text-gray-500">{responses.length} respons terkumpul</p>
          </div>
        </div>
        <button 
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      {responses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Belum ada respons</h3>
          <p className="text-gray-500 mt-2">Bagikan link kuesioner kepada responden untuk mulai mengumpulkan data.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[60vh]">
          {/* Sidebar / List (Desktop) */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/30 overflow-y-auto max-h-[60vh]">
            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 font-bold text-gray-700 text-sm">
              Daftar Responden
            </div>
            <div className="divide-y divide-gray-100">
              {responses.map((res, idx) => (
                <button
                  key={res.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full text-left p-4 hover:bg-indigo-50 transition-colors flex items-center gap-3 ${
                    currentIndex === idx ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-sm text-gray-900 truncate">
                      {res.profiles?.full_name || `Responden Publik #${idx + 1}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(res.submitted_at), "dd MMM, HH:mm")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Response Detail */}
          <div className="w-full md:w-2/3 p-6 md:p-8 bg-white overflow-y-auto max-h-[60vh]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  {currentResponse.profiles?.full_name || `Responden Publik #${currentIndex + 1}`}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Disubmit pada {format(new Date(currentResponse.submitted_at), "dd MMMM yyyy, HH:mm:ss")}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentIndex(Math.min(responses.length - 1, currentIndex + 1))}
                  disabled={currentIndex === responses.length - 1}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {questions.map((q, idx) => {
                const answer = currentResponse.form_answers.find((a: any) => a.question_id === q.id);
                
                let displayAnswer = <span className="text-gray-400 italic">Tidak dijawab</span>;
                
                if (answer) {
                  if (q.type === 'address' && answer.answer_data) {
                    displayAnswer = (
                      <div className="text-gray-900 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
                        {answer.answer_data.province}, {answer.answer_data.regency}, {answer.answer_data.district}
                      </div>
                    );
                  } else if (q.type === 'school' && answer.answer_data) {
                    displayAnswer = (
                      <div className="text-gray-900 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
                        {answer.answer_data.name} <br/>
                        <span className="text-sm text-gray-500">NPSN: {answer.answer_data.npsn}</span>
                      </div>
                    );
                  } else if (q.type === 'file_upload' && answer.answer_text) {
                    displayAnswer = (
                      <a href={answer.answer_text} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold bg-indigo-50 px-4 py-2 rounded-xl inline-block">
                        Lihat File Terlampir
                      </a>
                    );
                  } else {
                    displayAnswer = (
                      <div className="text-gray-900 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
                        {answer.answer_text || "-"}
                      </div>
                    );
                  }
                }

                return (
                  <div key={q.id}>
                    <div className="text-sm font-bold text-gray-500 mb-2">Soal {idx + 1}</div>
                    <div className="text-lg font-bold text-gray-900 mb-3">{q.title}</div>
                    {displayAnswer}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
