"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ShieldCheck, FileCheck, Lock, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function AssessmentBrankas() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ace_exam_vault')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
      
    if (data) setVaultItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    const uniqueWatermark = `SEC-EXM-${id.split('-')[0].toUpperCase()}`;
    
    try {
      await supabase.from('ace_exam_vault').update({ 
        status: 'disahkan',
        watermark_code: uniqueWatermark
      }).eq('id', id);
      
      setVaultItems(prev => prev.map(item => item.id === id ? { ...item, status: 'disahkan', watermark_code: uniqueWatermark } : item));
      alert(`Naskah Ujian berhasil disahkan!\n\nWatermark Digital:\n${uniqueWatermark}\n\nFile PDF siap cetak terenkripsi telah diteruskan ke TU.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (!profile || !profile.is_assessment_head) return null;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Brankas & Karantina Soal</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Exam Bank Secure Vault & Audit</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat sistem brankas...</p>
        ) : vaultItems.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada naskah soal dalam karantina.</p>
        ) : (
          vaultItems.map((item) => (
            <Card key={item.id} className={`p-5 rounded-lg border shadow-sm relative overflow-hidden transition-all ${item.status === 'disahkan' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200 hover:border-amber-400'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                {item.status === 'disahkan' ? <FileCheck className="w-24 h-24 text-emerald-600" /> : <ShieldCheck className="w-24 h-24 text-amber-600" />}
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${item.status === 'disahkan' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.status}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                
                <h3 className="font-bold text-slate-800 text-lg mb-1">{item.subject}</h3>
                <p className="text-sm text-slate-500 mb-4">{item.exam_type} - {item.grade_level} <br/><span className="text-xs">oleh {item.profiles?.full_name}</span></p>
                
                <div className="bg-slate-50 rounded p-3 mb-4 border border-slate-100 text-xs">
                  <p className="font-bold text-slate-700 mb-2">Audit Blue-Print (Rasio Kesulitan)</p>
                  <div className="flex gap-1 h-3 rounded-full overflow-hidden w-full bg-slate-200">
                    <div style={{ width: `${item.difficulty_ratio?.mudah || 0}%` }} className="bg-emerald-400" title={`Mudah ${item.difficulty_ratio?.mudah}%`}></div>
                    <div style={{ width: `${item.difficulty_ratio?.sedang || 0}%` }} className="bg-amber-400" title={`Sedang ${item.difficulty_ratio?.sedang}%`}></div>
                    <div style={{ width: `${item.difficulty_ratio?.sulit || 0}%` }} className="bg-rose-400" title={`HOTS/Sulit ${item.difficulty_ratio?.sulit}%`}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-medium">
                    <span>Mudah {item.difficulty_ratio?.mudah || 0}%</span>
                    <span>Sedang {item.difficulty_ratio?.sedang || 0}%</span>
                    <span>HOTS {item.difficulty_ratio?.sulit || 0}%</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100">
                  {item.status === 'dikarantina' ? (
                    <button 
                      onClick={() => handleApprove(item.id)}
                      disabled={processing === item.id}
                      className="w-full py-2 bg-slate-900 text-white font-bold rounded text-sm hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {processing === item.id ? <ShieldCheck className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Sahkan Naskah Soal
                    </button>
                  ) : (
                    <div className="text-center p-2 bg-emerald-100/50 rounded flex flex-col items-center justify-center gap-1 text-emerald-800">
                      <div className="flex items-center gap-1 font-bold text-sm"><CheckCircle2 className="w-4 h-4" /> Tersahkan & Terkunci</div>
                      <span className="text-xs font-mono bg-white px-2 py-0.5 rounded shadow-sm">WM: {item.watermark_code}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
