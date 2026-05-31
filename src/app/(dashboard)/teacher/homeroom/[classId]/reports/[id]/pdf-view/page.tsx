"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, Loader2, FileText } from "lucide-react";
import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSearchParams } from "next/navigation";

export default function ReportPdfView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const reportType = searchParams.get("type") || "monthly";
  
  const { profile } = useAuth();
  const supabase = createClient();
  const reportRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      let reportTable = reportType === "semester" ? "report_cards" : "monthly_reports";
      
      const { data: report } = await supabase.from(reportTable).select("*").eq("id", id).single();
      
      if (report) {
        setData(report);
        const { data: std } = await supabase.from("profiles").select("*").eq("id", report.student_id).single();
        const { data: cls } = await supabase.from("classes").select("*").eq("id", report.class_id).single();
        
        if (std) setStudent(std);
        if (cls) setClassData(cls);
        
        if (reportType === "semester") {
           // fetch ekstrakurikuler if semester
           const { data: eks } = await supabase.from("report_card_extracurriculars").select("*").eq("report_card_id", report.id);
           setData((prev: any) => ({ ...prev, extracurriculars: eks || [] }));
        }
      }
      setLoading(false);
    };
    
    fetchData();
  }, [id, reportType, supabase]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan_${student?.full_name}_${reportType}.pdf`);
    } catch (err) {
      console.error(err);
    }
    setDownloading(false);
  };

  if (loading) return <div className="p-20 text-center flex flex-col justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-slate-400" /></div>;
  if (!data) return <div className="p-20 text-center font-bold text-red-500">Report not found.</div>;

  return (
    <div className="min-h-screen bg-slate-200 pb-20 pt-8 flex justify-center">
      <div className="fixed top-6 right-6 flex flex-col gap-3 z-50">
        <Link href="/parent/reports">
          <Button variant="secondary" className="shadow-xl rounded-full bg-white text-slate-700 hover:bg-slate-50 w-full" icon={<ChevronLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <Button 
          onClick={handleDownloadPdf} 
          disabled={downloading}
          className="shadow-2xl rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6" 
          icon={downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        >
          {downloading ? "Generating..." : "Download PDF"}
        </Button>
      </div>

      {/* A4 Page Container */}
      <div 
        ref={reportRef}
        className="bg-white shadow-2xl relative"
        style={{ width: "210mm", minHeight: "297mm", padding: "20mm 15mm" }}
      >
        {/* Header */}
        <div className="text-center border-b-[3px] border-double border-slate-800 pb-6 mb-8">
           <h1 className="text-3xl font-black font-serif text-slate-900 uppercase tracking-widest">Mainan Middle International School</h1>
           <p className="text-sm font-medium mt-2 text-slate-600 italic">"Empowering the Leaders of Tomorrow"</p>
           <p className="text-xs text-slate-500 mt-1">123 Education Boulevard, Mainan City 12345</p>
        </div>

        {/* Report Title */}
        <div className="text-center mb-10">
           <h2 className="text-xl font-bold uppercase tracking-widest bg-slate-800 text-white inline-block px-6 py-2 rounded">
              {reportType === "monthly" ? "Laporan Hasil Belajar Bulanan" : "Rapor Akhir Semester"}
           </h2>
           <p className="font-bold text-slate-700 mt-4 text-sm">{reportType === "monthly" ? data.month_year : `${data.semester} - ${data.academic_year}`}</p>
        </div>

        {/* Student Info */}
        <div className="flex justify-between items-start border border-slate-300 p-4 rounded bg-slate-50 mb-8">
           <div className="space-y-2">
              <div className="flex text-sm"><span className="w-32 font-bold text-slate-600 uppercase">Nama Siswa</span> <span className="font-bold text-slate-900">: {student?.full_name}</span></div>
              <div className="flex text-sm"><span className="w-32 font-bold text-slate-600 uppercase">NIS</span> <span className="font-bold text-slate-900">: {student?.id.substring(0,8).toUpperCase()}</span></div>
           </div>
           <div className="space-y-2">
              <div className="flex text-sm"><span className="w-24 font-bold text-slate-600 uppercase">Kelas</span> <span className="font-bold text-slate-900">: {classData?.name}</span></div>
           </div>
        </div>

        {reportType === "monthly" && (
           <>
              <div className="mb-8">
                 <h3 className="font-black text-slate-800 mb-2 uppercase border-b border-slate-300 pb-1">Sambutan Kepala Sekolah</h3>
                 <p className="text-sm text-slate-700 italic leading-relaxed text-justify bg-slate-50 p-4 rounded border border-slate-200">
                    "{data.principal_remarks || "Terus tingkatkan prestasi belajar Anda di Mainan Middle International School."}"
                 </p>
              </div>

              <div className="mb-8">
                 <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Capaian Akademik</h3>
                 <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead>
                       <tr className="bg-slate-100">
                          <th className="border border-slate-300 p-2 text-left font-bold text-slate-700">Mata Pelajaran</th>
                          <th className="border border-slate-300 p-2 text-center font-bold text-slate-700 w-32">Rata-rata Nilai</th>
                       </tr>
                    </thead>
                    <tbody>
                       {data.grades_summary && Object.entries(data.grades_summary).length > 0 ? (
                          Object.entries(data.grades_summary).map(([course, score]: any) => (
                             <tr key={course}>
                                <td className="border border-slate-300 p-2 font-medium">{course}</td>
                                <td className="border border-slate-300 p-2 text-center font-bold">{score}</td>
                             </tr>
                          ))
                       ) : (
                          <tr><td colSpan={2} className="border border-slate-300 p-4 text-center text-slate-500 italic">Belum ada data nilai</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>

              <div className="mb-8 flex gap-8">
                 <div className="w-1/2">
                    <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Rekapitulasi Kehadiran</h3>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                       <tbody>
                          <tr>
                             <td className="border border-slate-300 p-2 font-medium">Hadir (Sesi Kelas)</td>
                             <td className="border border-slate-300 p-2 text-center font-bold">{data.attendance_summary?.present || 0}</td>
                          </tr>
                          <tr>
                             <td className="border border-slate-300 p-2 font-medium">Sakit</td>
                             <td className="border border-slate-300 p-2 text-center font-bold">{data.attendance_summary?.sick || 0}</td>
                          </tr>
                          <tr>
                             <td className="border border-slate-300 p-2 font-medium">Izin</td>
                             <td className="border border-slate-300 p-2 text-center font-bold">{data.attendance_summary?.excused || 0}</td>
                          </tr>
                          <tr>
                             <td className="border border-slate-300 p-2 font-medium">Alpa (Tanpa Keterangan)</td>
                             <td className="border border-slate-300 p-2 text-center font-bold text-red-600">{data.attendance_summary?.unexcused || 0}</td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
                 <div className="w-1/2">
                    <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Catatan Wali Kelas</h3>
                    <div className="h-full border border-slate-300 rounded p-3 text-sm text-slate-700 italic bg-yellow-50/50">
                       {data.homeroom_notes || "Tidak ada catatan."}
                    </div>
                 </div>
              </div>
           </>
        )}

        {reportType === "semester" && (
           <>
              <div className="mb-8 flex gap-8">
                 <div className="w-1/2">
                    <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Sikap Spiritual</h3>
                    <div className="border border-slate-300 rounded p-3 text-sm text-slate-700 bg-slate-50 min-h-[100px]">
                       {data.attitude_spiritual || "Baik."}
                    </div>
                 </div>
                 <div className="w-1/2">
                    <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Sikap Sosial</h3>
                    <div className="border border-slate-300 rounded p-3 text-sm text-slate-700 bg-slate-50 min-h-[100px]">
                       {data.attitude_social || "Baik."}
                    </div>
                 </div>
              </div>

              <div className="mb-8">
                 <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Capaian Akademik</h3>
                 <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead>
                       <tr className="bg-slate-100">
                          <th className="border border-slate-300 p-2 text-left font-bold text-slate-700">Mata Pelajaran</th>
                          <th className="border border-slate-300 p-2 text-center font-bold text-slate-700 w-32">Nilai Akhir</th>
                       </tr>
                    </thead>
                    <tbody>
                       {data.grades_summary && Object.entries(data.grades_summary).length > 0 ? (
                          Object.entries(data.grades_summary).map(([course, score]: any) => (
                             <tr key={course}>
                                <td className="border border-slate-300 p-2 font-medium">{course}</td>
                                <td className="border border-slate-300 p-2 text-center font-bold">{score}</td>
                             </tr>
                          ))
                       ) : (
                          <tr><td colSpan={2} className="border border-slate-300 p-4 text-center text-slate-500 italic">Belum ada data nilai</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
              <div className="mb-8 flex gap-8">
                 <div className="w-1/2">
                    <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Sikap Spiritual</h3>
                    <div className="border border-slate-300 rounded p-3 text-sm text-slate-700 bg-slate-50 min-h-[100px]">
                       {data.attitude_spiritual || "Baik."}
                    </div>
                 </div>
                 <div className="w-1/2">
                    <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Sikap Sosial</h3>
                    <div className="border border-slate-300 rounded p-3 text-sm text-slate-700 bg-slate-50 min-h-[100px]">
                       {data.attitude_social || "Baik."}
                    </div>
                 </div>
              </div>

              <div className="mb-8">
                 <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Ekstrakurikuler</h3>
                 <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead>
                       <tr className="bg-slate-100">
                          <th className="border border-slate-300 p-2 text-left font-bold text-slate-700">Kegiatan</th>
                          <th className="border border-slate-300 p-2 text-center font-bold text-slate-700 w-24">Predikat</th>
                          <th className="border border-slate-300 p-2 text-left font-bold text-slate-700">Keterangan</th>
                       </tr>
                    </thead>
                    <tbody>
                       {data.extracurriculars && data.extracurriculars.length > 0 ? (
                          data.extracurriculars.map((e: any, idx: number) => (
                             <tr key={idx}>
                                <td className="border border-slate-300 p-2 font-medium">{e.activity_name}</td>
                                <td className="border border-slate-300 p-2 text-center font-black text-slate-900">{e.predicate}</td>
                                <td className="border border-slate-300 p-2">{e.description}</td>
                             </tr>
                          ))
                       ) : (
                          <tr><td colSpan={3} className="border border-slate-300 p-4 text-center text-slate-500 italic">Tidak mengikuti kegiatan ekstrakurikuler</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>

              <div className="mb-8 flex gap-8">
                 <div className="w-1/2">
                    <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Ketidakhadiran</h3>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                       <tbody>
                          <tr>
                             <td className="border border-slate-300 p-2 font-medium">Sakit</td>
                             <td className="border border-slate-300 p-2 text-center font-bold">{data.attendance_sick || 0} hari</td>
                          </tr>
                          <tr>
                             <td className="border border-slate-300 p-2 font-medium">Izin</td>
                             <td className="border border-slate-300 p-2 text-center font-bold">{data.attendance_excused || 0} hari</td>
                          </tr>
                          <tr>
                             <td className="border border-slate-300 p-2 font-medium">Tanpa Keterangan</td>
                             <td className="border border-slate-300 p-2 text-center font-bold text-red-600">{data.attendance_unexcused || 0} hari</td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
                 <div className="w-1/2">
                    <h3 className="font-black text-slate-800 mb-3 uppercase border-b border-slate-300 pb-1">Catatan Wali Kelas</h3>
                    <div className="h-[100px] border border-slate-300 rounded p-3 text-sm text-slate-700 italic bg-yellow-50/50">
                       {data.homeroom_notes || "Tidak ada catatan."}
                    </div>
                 </div>
              </div>
           </>
        )}

        {/* Footer / Signatures */}
        <div className="mt-16 flex justify-between px-10 text-center text-sm">
           <div className="space-y-16">
              <p className="font-bold">Mengetahui,<br/>Orang Tua / Wali</p>
              <div className="border-b border-slate-800 w-48 mx-auto"></div>
           </div>
           <div className="space-y-16">
              <p className="font-bold">Mainan City, {new Date().toLocaleDateString('id-ID')}<br/>Wali Kelas</p>
              <div className="border-b border-slate-800 w-48 mx-auto"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
