"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Headphones, Ticket, Plus, FileText, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function ACEHelpdesk() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("tiket-saya");
  
  if (!profile) return null;

  const mockTickets = [
    { id: "TKT-1042", category: "Surat", title: "Permohonan Surat Keterangan Aktif Mengajar", status: "green", date: "28 Juni 2026", sla: 0 },
    { id: "TKT-1088", category: "Sarpras", title: "Laporan Kerusakan Printer Ruang Guru Lantai 2", status: "yellow", date: "Hari Ini", sla: 2 }, // 2 hours left
    { id: "TKT-1089", category: "IT", title: "Reset Password Akun Belajar.id", status: "blue", date: "Baru Saja", sla: 24 },
    { id: "TKT-1090", category: "Surat", title: "Permohonan Legalisir Ijazah", status: "red", reason: "Dokumen ijazah asli belum diserahkan ke loket.", date: "Kemarin", sla: -1 }, // SLA Breached
  ];

  const getStatusUI = (status: string) => {
    switch (status) {
      case 'blue': return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Tiket Dibuat', icon: Ticket };
      case 'yellow': return { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Diproses TU', icon: Clock };
      case 'green': return { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Selesai / Ambil di Loket', icon: CheckCircle2 };
      case 'red': return { color: 'text-rose-600', bg: 'bg-rose-100', label: 'Ditolak', icon: XCircle };
      default: return { color: 'text-slate-600', bg: 'bg-slate-100', label: 'Unknown', icon: Ticket };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">TU Concierge & Helpdesk</h1>
          <p className="text-slate-500 font-medium mt-1">Pusat Pelayanan Birokrasi Tanpa Tatap Muka</p>
        </div>
        <button onClick={() => setActiveTab("buat-tiket")} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Buat Permohonan Baru
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'tiket-saya', label: 'Daftar Tiket Saya' },
          { id: 'buat-tiket', label: 'Formulir Permohonan' },
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'tiket-saya' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {mockTickets.map(ticket => {
              const UI = getStatusUI(ticket.status);
              const Icon = UI.icon;
              return (
                <Card key={ticket.id} className={`p-5 border-2 rounded-2xl transition-colors ${ticket.status === 'red' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${UI.bg} ${UI.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-xs text-slate-400">{ticket.id}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest">{ticket.category}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{ticket.title}</h3>
                        <p className={`text-xs font-bold ${UI.color}`}>{UI.label} &bull; {ticket.date}</p>
                        
                        {ticket.status === 'red' && (
                          <div className="mt-3 p-3 bg-rose-100/50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">
                            <span className="font-bold block mb-1">Alasan Penolakan:</span>
                            {ticket.reason}
                          </div>
                        )}
                        
                        {ticket.status === 'green' && ticket.category === 'Surat' && (
                          <button className="mt-3 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold text-xs rounded-xl hover:bg-emerald-100 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Unduh Dokumen (Auto-Generated)
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* SLA Timer */}
                    {ticket.status === 'blue' || ticket.status === 'yellow' ? (
                      <div className="text-right sm:shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">SLA Target</p>
                        <p className={`font-black text-xl flex items-center justify-end gap-1 ${ticket.sla < 5 ? 'text-amber-500 animate-pulse' : 'text-slate-700'}`}>
                          <Clock className="w-5 h-5" /> {ticket.sla} Jam
                        </p>
                      </div>
                    ) : ticket.status === 'red' && ticket.sla < 0 ? (
                      <div className="text-right sm:shrink-0 bg-rose-50 p-3 rounded-xl border border-rose-100 text-rose-600">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 justify-end"><AlertTriangle className="w-3 h-3" /> SLA BREACHED</p>
                        <p className="font-bold text-xs">Email otomatis dikirim ke Kepsek</p>
                      </div>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="md:col-span-1">
            <Card className="p-6 rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 sticky top-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-slate-800 mb-2">Disposisi Otomatis</h2>
              <p className="text-sm font-medium text-slate-600 mb-6">Sistem secara cerdas merutekan tiket Anda langsung ke layar komputer Staf TU yang berwenang berdasarkan kategori permohonan.</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="font-bold text-slate-700">Surat-Menyurat</span>
                  <span className="font-black text-indigo-600">TU Kepegawaian</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="font-bold text-slate-700">Sarana Prasarana</span>
                  <span className="font-black text-indigo-600">TU Perlengkapan</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'buat-tiket' && (
        <Card className="max-w-2xl mx-auto p-8 rounded-3xl border-2 border-slate-200">
          <h2 className="text-2xl font-black text-slate-800 mb-6">Formulir Permohonan</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kategori Layanan</label>
              <select className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 font-medium">
                <option>Surat Keterangan Aktif Mengajar</option>
                <option>Laporan Kerusakan Inventaris (Sarpras)</option>
                <option>Permohonan Legalisir Dokumen</option>
                <option>Kendala IT / Akun</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Detail Keperluan / Keluhan</label>
              <textarea 
                rows={5} 
                className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 font-medium"
                placeholder="Jelaskan secara spesifik agar staf TU dapat segera memproses..."
              />
            </div>
            
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 text-indigo-800">
              <FileText className="w-6 h-6 shrink-0 text-indigo-500" />
              <div>
                <p className="font-bold text-sm mb-1">Auto-Generate Template Aktif</p>
                <p className="text-xs">Jika Anda memilih kategori Surat, sistem akan otomatis merakit PDF Surat Keterangan Aktif dengan nama dan NIP Anda dari sistem setelah TU menekan tombol Setuju.</p>
              </div>
            </div>

            <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
              Kirim Tiket Permohonan
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
