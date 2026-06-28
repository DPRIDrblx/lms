"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { FileSignature, AlertCircle, Printer, Download, BarChart3, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function TUKinerja() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("monitor");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    // Fetch workload alerts for blacklist checking
    const { data } = await supabase.from('ace_workload_alerts').select('*, profiles(full_name)').order('days_overdue', { ascending: false });
    if (data) setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  if (!profile || profile.role !== 'tu') return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">TU Kepegawaian & Principal</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Rekapitulasi Mutu & Arsip Supervisi</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'monitor', label: 'Progress Supervisi' },
          { id: 'vault', label: 'Arsip BAP Digital' },
          { id: 'warning', label: 'Blacklist & Teguran' },
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'monitor' && (
        <Card className="p-8 rounded-lg border border-slate-200 shadow-sm bg-white text-center">
          <BarChart3 className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Keterlaksanaan Supervisi Semester Ganjil</h2>
          
          <div className="max-w-md mx-auto my-6">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-slate-600">Target: 45 Guru</span>
              <span className="text-indigo-700">Teleselesaikan: 34 Guru (75%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 w-[75%]" />
            </div>
          </div>

          <p className="text-sm text-slate-500 font-medium mb-6">Terdapat 11 guru yang belum dijadwalkan supervisi oleh Wakasek Kurikulum.</p>
          <button className="px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-md border border-indigo-200 transition-colors">
            Kirim Surat Penagihan Jadwal Otomatis
          </button>
        </Card>
      )}

      {activeTab === 'vault' && (
        <Card className="p-0 rounded-lg border border-slate-200 shadow-sm bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <FileSignature className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">Digital Vault</h2>
              <p className="text-[10px] font-semibold text-slate-500">Arsip BAP Kinerja yang Telah Disahkan</p>
            </div>
          </div>
          
          <div className="p-4 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div>
              <p className="font-bold text-sm text-slate-800">Pak Budi (Matematika)</p>
              <p className="text-xs text-slate-500 mt-0.5">Selesai: 14 Agustus 2026 &bull; <span className="text-emerald-600 font-semibold flex items-center gap-1 inline-flex"><CheckCircle2 className="w-3 h-3" /> Digital Sign Valid</span></p>
            </div>
            <button className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-md shadow-sm transition-all" title="Unduh PDF">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {activeTab === 'warning' && (
        <Card className="p-6 rounded-lg border border-rose-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-50 rounded-md border border-rose-100"><AlertCircle className="w-5 h-5 text-rose-600" /></div>
            <div>
              <h2 className="text-sm font-bold text-rose-800 uppercase tracking-wider">Blacklist & Warning Trigger</h2>
              <p className="text-xs font-semibold text-rose-600/80">Guru dengan tunggakan koreksi melebihi batas (Otomatis)</p>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : alerts.length === 0 ? <p className="text-xs text-slate-500">Aman! Tidak ada guru yang melanggar batas SLA koreksi tugas.</p> : alerts.map(alert => (
              <div key={alert.id} className="p-4 bg-rose-50 border border-rose-200 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm text-slate-800">{alert.profiles.full_name}</p>
                  <p className="text-xs font-semibold text-rose-600 mt-0.5">Menunggak: {alert.task_title} (Telat {alert.days_overdue} Hari)</p>
                </div>
                {alert.days_overdue >= 7 ? (
                  <button className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs rounded-md shadow-sm transition-colors flex items-center gap-2">
                    <Printer className="w-3.5 h-3.5" /> Cetak Surat Teguran SP1
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-[10px] rounded uppercase tracking-wider">Warning Level 1</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
