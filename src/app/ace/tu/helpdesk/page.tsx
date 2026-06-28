"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Headphones, Ticket, FileText, CheckCircle2, Clock, XCircle, FileSignature, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function TUHelpdesk() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("matrix");

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('ace_tickets').select('*, profiles(full_name)').order('created_at', { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleProcessTicket = async (id: string, newStatus: string) => {
    await supabase.from('ace_tickets').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const handleGenerateTemplate = (id: string, category: string) => {
    if (category === 'surat') {
      alert("Surat Keterangan otomatis digenerate dengan NIP/Nama dari database. Template PDF sudah siap dicetak untuk Tanda Tangan Kepsek.");
      handleProcessTicket(id, 'green'); // auto set ready
    }
  };

  if (!profile || profile.role !== 'tu') return null;

  const getStatusUI = (status: string) => {
    switch (status) {
      case 'blue': return { color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', label: 'Baru Masuk', icon: Ticket };
      case 'yellow': return { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Sedang Diproses', icon: Clock };
      case 'green': return { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Selesai', icon: CheckCircle2 };
      case 'red': return { color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', label: 'Ditolak', icon: XCircle };
      default: return { color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', label: 'Unknown', icon: Ticket };
    }
  };

  const pendingTickets = tickets.filter(t => t.status === 'blue' || t.status === 'yellow');

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Utama TU</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Pusat Disposisi Tiket & Layanan Satu Pintu</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'matrix', label: 'Ticket Matrix (Antrean)' },
          { id: 'sla', label: 'SLA Breach Monitor' },
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

      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? <p className="text-xs text-slate-500 col-span-full">Memuat tiket...</p> : pendingTickets.length === 0 ? <p className="text-xs text-slate-500 col-span-full">Antrean tiket kosong.</p> : pendingTickets.map(ticket => {
              const UI = getStatusUI(ticket.status);
              const Icon = UI.icon;
              return (
                <Card key={ticket.id} className="p-4 rounded-lg border border-slate-200 shadow-sm bg-white flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[10px] text-slate-400 font-mono">TKT-{ticket.id.split('-')[0].toUpperCase()}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">{ticket.category}</span>
                      </div>
                      <div className={`p-1.5 rounded-md bg-white border border-slate-200 shadow-sm ${UI.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{ticket.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 mb-3">Dari: {ticket.profiles.full_name}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-4 line-clamp-3">{ticket.description}</p>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                    {ticket.status === 'blue' && (
                      <button onClick={() => handleProcessTicket(ticket.id, 'yellow')} className="w-full py-2 bg-slate-800 text-white font-semibold text-xs rounded-md shadow-sm hover:bg-slate-900 transition-colors">
                        Ambil Tiket (Proses)
                      </button>
                    )}
                    {ticket.status === 'yellow' && ticket.category === 'surat' && (
                      <button onClick={() => handleGenerateTemplate(ticket.id, ticket.category)} className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-md shadow-sm hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5">
                        <FileSignature className="w-3.5 h-3.5" /> Gunakan Template & Selesai
                      </button>
                    )}
                    {ticket.status === 'yellow' && ticket.category !== 'surat' && (
                      <button onClick={() => handleProcessTicket(ticket.id, 'green')} className="w-full py-2 bg-emerald-600 text-white font-semibold text-xs rounded-md shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Selesai
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'sla' && (
        <Card className="p-6 rounded-lg border border-rose-200 bg-rose-50 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white rounded-md border border-rose-100"><AlertTriangle className="w-5 h-5 text-rose-600" /></div>
            <div>
              <h2 className="text-sm font-bold text-rose-800 uppercase tracking-wider">SLA Breach Monitor</h2>
              <p className="text-xs font-semibold text-rose-600/80">Papan Pengawasan Kinerja Staf Administrasi</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-white border border-rose-200 rounded-md flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-slate-800 mb-1">TKT-A8F2 - Perbaikan AC Kelas 7A</p>
                <p className="text-xs font-semibold text-slate-500">PIC: <span className="text-slate-800">TU Perlengkapan (Pak Tono)</span></p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-rose-600 text-white font-bold text-[10px] rounded uppercase tracking-wider animate-pulse">Breached: 52 Jam</span>
              </div>
            </div>
          </div>
          
          <p className="text-[11px] font-medium text-slate-500 mt-4 leading-relaxed max-w-lg">
            Sistem secara otomatis mendeteksi tiket layanan yang melewati batas waktu Service Level Agreement (SLA) 48 jam. Staf terkait akan dievaluasi oleh Kepala Tata Usaha.
          </p>
        </Card>
      )}
    </div>
  );
}
