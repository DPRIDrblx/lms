"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { FileSignature, CheckSquare, Square, Repeat, FileCheck2, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function AssessmentKonsol() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [gradeFormat, setGradeFormat] = useState<'NUMERIC' | 'GPA' | 'LETTER'>('NUMERIC');

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ace_report_cards')
      .select('*')
      .eq('hoa_signature', false); // Only show pending sign-offs
      
    if (data) setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === readyReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(readyReports.map(r => r.id)));
    }
  };

  const handleSignOff = async () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      await supabase.from('ace_report_cards').update({ hoa_signature: true }).in('id', ids);
      setReports(prev => prev.filter(r => !ids.includes(r.id)));
      setSelectedIds(new Set());
      alert(`Berhasil! ${ids.length} draf rapor telah ditandatangani dan diteruskan ke Kepala Sekolah.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const cycleFormat = () => {
    if (gradeFormat === 'NUMERIC') setGradeFormat('GPA');
    else if (gradeFormat === 'GPA') setGradeFormat('LETTER');
    else setGradeFormat('NUMERIC');
  };

  const getFormatLabel = () => {
    if (gradeFormat === 'NUMERIC') return 'Skala 1-100';
    if (gradeFormat === 'GPA') return 'IPK 4.00';
    return 'Huruf (A-F)';
  };

  const renderGrade = (status: string) => {
    if (status !== 'complete') return <span className="text-rose-500">Incomplete</span>;
    if (gradeFormat === 'NUMERIC') return <span className="text-emerald-600 font-bold">85 - 95</span>; // Mock translation
    if (gradeFormat === 'GPA') return <span className="text-emerald-600 font-bold">3.5 - 4.0</span>;
    return <span className="text-emerald-600 font-bold">A - B+</span>;
  };

  if (!profile || !profile.is_assessment_head) return null;

  const readyReports = reports.filter(r => r.academic_status === 'complete' && r.extracurricular_status === 'complete' && r.attendance_status === 'complete');

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Konsol Kelayakan Rapor</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Report Card Executive Sign-Off</p>
        </div>
        
        <button 
          onClick={cycleFormat}
          className="px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center gap-2 hover:bg-indigo-200 transition-colors"
        >
          <Repeat className="w-4 h-4" /> Switch Format: {getFormatLabel()}
        </button>
      </div>

      <Card className="p-0 rounded-lg border border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600">
              {readyReports.length > 0 && selectedIds.size === readyReports.length ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
            </button>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Antrean Tanda Tangan Massal ({readyReports.length} Siap)</h2>
          </div>
          <button 
            onClick={handleSignOff}
            disabled={selectedIds.size === 0 || processing}
            className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded shadow-sm text-xs flex items-center gap-2 disabled:opacity-50 hover:bg-emerald-700"
          >
            <FileCheck2 className="w-4 h-4" /> {processing ? 'Memproses...' : `Validate & Forward (${selectedIds.size})`}
          </button>
        </div>
        
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Memuat draf rapor...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Tidak ada draf rapor yang menunggu otorisasi.</div>
          ) : (
            reports.map(r => {
              const isReady = r.academic_status === 'complete' && r.extracurricular_status === 'complete' && r.attendance_status === 'complete';
              const isSelected = selectedIds.has(r.id);
              
              return (
                <div key={r.id} className={`p-4 flex items-center gap-4 transition-colors ${!isReady ? 'bg-slate-50 opacity-60 grayscale' : isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                  <button 
                    onClick={() => isReady && toggleSelect(r.id)} 
                    disabled={!isReady}
                    className={`${!isReady ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${isSelected ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-500'}`}
                  >
                    {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                  
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <UserCircle2 className="w-5 h-5 text-slate-500" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{r.student_name} <span className="text-xs text-slate-500 font-medium ml-2">({r.class_name} - {r.term})</span></h3>
                    <div className="flex gap-4 mt-1 text-xs">
                      <span className={`font-medium ${r.academic_status === 'complete' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        Akademik: {renderGrade(r.academic_status)}
                      </span>
                      <span className={`font-medium ${r.extracurricular_status === 'complete' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        Ekskul: {r.extracurricular_status === 'complete' ? 'A' : 'Pending'}
                      </span>
                      <span className={`font-medium ${r.attendance_status === 'complete' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        Presensi: {r.attendance_status === 'complete' ? '100%' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  
                  {!isReady && (
                    <div className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold uppercase rounded border border-rose-200">
                      Terkunci (Komponen Belum Lengkap)
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
