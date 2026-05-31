"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Printer, ChevronLeft, Loader2 } from "lucide-react";
import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ReportPdfView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const reportType = searchParams.get("type") || "monthly";
  const router = useRouter();
  
  const { profile } = useAuth();
  const supabase = createClient();

  const [data, setData] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
           const { data: eks } = await supabase.from("report_card_extracurriculars").select("*").eq("report_card_id", report.id);
           setData((prev: any) => ({ ...prev, extracurriculars: eks || [] }));
        }
      }
      setLoading(false);
    };
    
    fetchData();
  }, [id, reportType, supabase]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-20 text-center flex flex-col justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-slate-400" /></div>;
  if (!data) return <div className="p-20 text-center font-bold text-red-500">Report not found.</div>;

  const renderKopSurat = () => (
    <div className="text-center border-b-[4px] border-double border-black pb-4 mb-6">
       <h1 className="text-2xl font-black font-serif uppercase tracking-wider text-black">Nusantara International Academy</h1>
       <p className="text-sm font-medium mt-1 text-black font-serif">"Empowering the Leaders of Tomorrow"</p>
       <p className="text-xs text-black mt-1 font-serif">Jl. Pendidikan No. 123, Nusantara Raya 12345 | Telp: (021) 1234567</p>
    </div>
  );

  const renderBiodata = () => (
    <table className="w-full text-[11pt] font-serif mb-6 text-black">
      <tbody>
         <tr>
            <td className="w-40 py-1 font-bold">Nama Peserta Didik</td><td className="w-4 py-1">:</td><td className="py-1 uppercase font-bold">{student?.full_name}</td>
            <td className="w-32 py-1 font-bold">Kelas</td><td className="w-4 py-1">:</td><td className="py-1 uppercase font-bold">{classData?.name}</td>
         </tr>
         <tr>
            <td className="py-1 font-bold">Nomor Induk / NISN</td><td className="py-1">:</td><td className="py-1 uppercase">{student?.id.substring(0,8).toUpperCase()}</td>
            <td className="py-1 font-bold">Semester</td><td className="py-1">:</td><td className="py-1 uppercase">{reportType === 'monthly' ? data.month_year : data.semester}</td>
         </tr>
         <tr>
            <td className="py-1 font-bold">Nama Sekolah</td><td className="py-1">:</td><td className="py-1 uppercase">Nusantara Int. Academy</td>
            <td className="py-1 font-bold">Tahun Pelajaran</td><td className="py-1">:</td><td className="py-1 uppercase">{reportType === 'monthly' ? '2025/2026' : data.academic_year}</td>
         </tr>
      </tbody>
    </table>
  );

  const renderSignatures = () => (
    <div className="mt-12 flex justify-between px-8 text-center text-[11pt] font-serif text-black page-break-inside-avoid">
       <div className="space-y-20">
          <p className="font-bold">Mengetahui,<br/>Orang Tua / Wali</p>
          <div className="border-b border-black w-48 mx-auto"></div>
       </div>
       <div className="space-y-20">
          <p className="font-bold">Nusantara, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br/>Wali Kelas</p>
          <div className="border-b border-black w-48 mx-auto"></div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-200 pb-20 pt-8 flex flex-col items-center font-serif text-black print:bg-white print:p-0 print:m-0">
      
      {/* Floating Actions */}
      <div className="fixed top-6 right-6 flex flex-col gap-3 z-50 print:hidden">
        <Button onClick={() => router.back()} variant="secondary" className="shadow-xl rounded-full bg-white text-slate-700 hover:bg-slate-50 w-full font-sans" icon={<ChevronLeft className="h-4 w-4" />}>
          Kembali
        </Button>
        <Button 
          onClick={handlePrint} 
          className="shadow-2xl rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 font-sans" 
          icon={<Printer className="h-5 w-5" />}
        >
          Cetak / Save PDF
        </Button>
      </div>

      {reportType === "monthly" ? (
         <>
            {/* MONTHLY PAGE 1 */}
            <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] relative shadow-xl mb-8 print:shadow-none print:mb-0 box-border break-after-page text-black">
               {renderKopSurat()}
               <div className="text-center mb-6">
                  <h2 className="text-lg font-bold uppercase tracking-wider">Laporan Hasil Belajar Bulanan</h2>
               </div>
               {renderBiodata()}
               
               <div className="mb-6">
                  <h3 className="font-bold mb-2 uppercase border-b border-black pb-1">Sambutan Kepala Sekolah</h3>
                  <div className="text-[11pt] leading-relaxed text-justify whitespace-pre-wrap">
                     {data.principal_remarks || "Terus tingkatkan prestasi belajar Anda di Nusantara International Academy."}
                  </div>
               </div>
            </div>

            {/* MONTHLY PAGE 2 */}
            <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] relative shadow-xl mb-8 print:shadow-none print:mb-0 box-border break-after-page text-black">
               {renderKopSurat()}
               <div className="text-center mb-6">
                  <h2 className="text-lg font-bold uppercase tracking-wider">Capaian Kompetensi dan Kehadiran</h2>
               </div>
               {renderBiodata()}

               <div className="mb-6">
                  <h3 className="font-bold mb-2 uppercase border-b border-black pb-1">Capaian Akademik</h3>
                  <table className="w-full text-[11pt] border-collapse border border-black">
                     <thead>
                        <tr className="bg-slate-100 print:bg-transparent">
                           <th className="border border-black p-2 text-center w-12 font-bold">No</th>
                           <th className="border border-black p-2 text-left font-bold">Mata Pelajaran</th>
                           <th className="border border-black p-2 text-center w-32 font-bold">Nilai Rata-rata</th>
                        </tr>
                     </thead>
                     <tbody>
                        {data.grades_summary && Object.entries(data.grades_summary).length > 0 ? (
                           Object.entries(data.grades_summary).map(([course, score]: any, idx) => (
                              <tr key={course}>
                                 <td className="border border-black p-2 text-center">{idx + 1}</td>
                                 <td className="border border-black p-2">{course}</td>
                                 <td className="border border-black p-2 text-center font-bold">{score}</td>
                              </tr>
                           ))
                        ) : (
                           <tr><td colSpan={3} className="border border-black p-4 text-center italic">Belum ada data nilai</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>

               <div className="mb-6 flex gap-6">
                  <div className="w-1/2">
                     <h3 className="font-bold mb-2 uppercase border-b border-black pb-1">Ketidakhadiran</h3>
                     <table className="w-full text-[11pt] border-collapse border border-black">
                        <tbody>
                           <tr><td className="border border-black p-2 w-48">Hadir (Sesi Kelas)</td><td className="border border-black p-2 text-center">{data.attendance_summary?.present || 0}</td></tr>
                           <tr><td className="border border-black p-2">Sakit</td><td className="border border-black p-2 text-center">{data.attendance_summary?.sick || 0}</td></tr>
                           <tr><td className="border border-black p-2">Izin</td><td className="border border-black p-2 text-center">{data.attendance_summary?.excused || 0}</td></tr>
                           <tr><td className="border border-black p-2">Tanpa Keterangan</td><td className="border border-black p-2 text-center">{data.attendance_summary?.unexcused || 0}</td></tr>
                        </tbody>
                     </table>
                  </div>
                  <div className="w-1/2">
                     <h3 className="font-bold mb-2 uppercase border-b border-black pb-1">Catatan Wali Kelas</h3>
                     <div className="h-full border border-black p-3 text-[11pt] text-justify min-h-[120px] whitespace-pre-wrap">
                        {data.homeroom_notes || "-"}
                     </div>
                  </div>
               </div>

               {renderSignatures()}
            </div>
         </>
      ) : (
         <>
            {/* SEMESTER PAGE 1 */}
            <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] relative shadow-xl mb-8 print:shadow-none print:mb-0 box-border break-after-page text-black">
               {renderKopSurat()}
               <div className="text-center mb-6">
                  <h2 className="text-lg font-bold uppercase tracking-wider">Rapor Peserta Didik</h2>
               </div>
               {renderBiodata()}

               <div className="mb-6">
                  <h3 className="font-bold mb-2 uppercase border-b border-black pb-1">A. Sikap</h3>
                  <table className="w-full text-[11pt] border-collapse border border-black mb-4">
                     <tbody>
                        <tr>
                           <td className="border border-black p-2 font-bold w-48 align-top">Sikap Spiritual</td>
                           <td className="border border-black p-2 text-justify whitespace-pre-wrap">{data.attitude_spiritual || "Baik."}</td>
                        </tr>
                        <tr>
                           <td className="border border-black p-2 font-bold w-48 align-top">Sikap Sosial</td>
                           <td className="border border-black p-2 text-justify whitespace-pre-wrap">{data.attitude_social || "Baik."}</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>

            {/* SEMESTER PAGE 2 */}
            <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] relative shadow-xl mb-8 print:shadow-none print:mb-0 box-border break-after-page text-black">
               {renderKopSurat()}
               {renderBiodata()}

               <div className="mb-6">
                  <h3 className="font-bold mb-2 uppercase border-b border-black pb-1">B. Pengetahuan & Keterampilan</h3>
                  <table className="w-full text-[11pt] border-collapse border border-black">
                     <thead>
                        <tr>
                           <th className="border border-black p-2 text-center w-12 font-bold">No</th>
                           <th className="border border-black p-2 text-left font-bold">Mata Pelajaran</th>
                           <th className="border border-black p-2 text-center w-32 font-bold">Nilai Akhir</th>
                        </tr>
                     </thead>
                     <tbody>
                        {data.grades_summary && Object.entries(data.grades_summary).length > 0 ? (
                           Object.entries(data.grades_summary).map(([course, score]: any, idx) => (
                              <tr key={course}>
                                 <td className="border border-black p-2 text-center">{idx + 1}</td>
                                 <td className="border border-black p-2">{course}</td>
                                 <td className="border border-black p-2 text-center font-bold">{score}</td>
                              </tr>
                           ))
                        ) : (
                           <tr><td colSpan={3} className="border border-black p-4 text-center italic">Belum ada data nilai</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* SEMESTER PAGE 3 */}
            <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] relative shadow-xl mb-8 print:shadow-none print:mb-0 box-border break-after-page text-black">
               {renderKopSurat()}
               {renderBiodata()}

               <div className="mb-6">
                  <h3 className="font-bold mb-2 uppercase border-b border-black pb-1">C. Ekstrakurikuler</h3>
                  <table className="w-full text-[11pt] border-collapse border border-black">
                     <thead>
                        <tr>
                           <th className="border border-black p-2 text-center w-12 font-bold">No</th>
                           <th className="border border-black p-2 text-left font-bold">Kegiatan</th>
                           <th className="border border-black p-2 text-center w-32 font-bold">Predikat</th>
                        </tr>
                     </thead>
                     <tbody>
                        {data.extracurriculars && data.extracurriculars.length > 0 ? (
                           data.extracurriculars.map((e: any, idx: number) => (
                              <tr key={idx}>
                                 <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                                 <td className="border border-black p-2">
                                    <div className="font-bold">{e.activity_name}</div>
                                    <div className="text-[10pt] mt-1">{e.description}</div>
                                 </td>
                                 <td className="border border-black p-2 text-center font-bold align-top">{e.predicate}</td>
                              </tr>
                           ))
                        ) : (
                           <tr><td colSpan={3} className="border border-black p-4 text-center italic">-</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>

               <div className="mb-6 flex gap-6">
                  <div className="w-1/2">
                     <h3 className="font-bold mb-2 uppercase border-b border-black pb-1">D. Ketidakhadiran</h3>
                     <table className="w-full text-[11pt] border-collapse border border-black">
                        <tbody>
                           <tr><td className="border border-black p-2 w-48">Sakit</td><td className="border border-black p-2 text-center">{data.attendance_sick || 0} hari</td></tr>
                           <tr><td className="border border-black p-2">Izin</td><td className="border border-black p-2 text-center">{data.attendance_excused || 0} hari</td></tr>
                           <tr><td className="border border-black p-2">Tanpa Keterangan</td><td className="border border-black p-2 text-center">{data.attendance_unexcused || 0} hari</td></tr>
                        </tbody>
                     </table>
                  </div>
                  <div className="w-1/2">
                     <h3 className="font-bold mb-2 uppercase border-b border-black pb-1">E. Catatan Wali Kelas</h3>
                     <div className="h-full border border-black p-3 text-[11pt] text-justify min-h-[80px] whitespace-pre-wrap">
                        {data.homeroom_notes || "-"}
                     </div>
                  </div>
               </div>

               {renderSignatures()}
            </div>
         </>
      )}

      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
           @page { size: A4; margin: 0; }
           body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
           .break-after-page { page-break-after: always; break-after: page; }
           * { color: black !important; border-color: black !important; }
        }
      `}} />
    </div>
  );
}
