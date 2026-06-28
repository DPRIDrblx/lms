"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Activity, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function PrincipalAkuntabilitas() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all tickets to calculate SLA
    const { data: ticketsData } = await supabase
      .from('ace_tickets')
      .select('*, profiles(full_name)');
      
    if (ticketsData) setTickets(ticketsData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  if (!profile || profile.role !== 'principal') return null;

  // Calculate Metrics
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');
  
  let totalHours = 0;
  resolvedTickets.forEach(t => {
    const created = new Date(t.created_at).getTime();
    const resolved = new Date(t.updated_at).getTime();
    const hours = (resolved - created) / (1000 * 60 * 60);
    totalHours += hours;
  });
  
  const averageSla = resolvedTickets.length > 0 ? (totalHours / resolvedTickets.length).toFixed(1) : "0";
  
  const now = new Date().getTime();
  const overdueTickets = tickets.filter(t => {
    if (t.status === 'resolved') return false;
    const created = new Date(t.created_at).getTime();
    const hours = (now - created) / (1000 * 60 * 60);
    return hours > 72; // Overdue if unresolved > 3 days
  });

  const efficiencyIndex = tickets.length > 0 ? Math.round((resolvedTickets.length / tickets.length) * 100) : 100;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Akuntabilitas Tata Usaha</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">TU Performance Monitor & SLA Tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Indeks Efisiensi Layanan</p>
          <p className="text-4xl font-black text-slate-800">{efficiencyIndex}%</p>
          <p className="text-xs text-slate-400 mt-2">Rasio penyelesaian tugas / tiket</p>
        </Card>
        
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Rata-Rata Waktu SLA</p>
          <p className="text-4xl font-black text-slate-800">{averageSla} <span className="text-xl">Jam</span></p>
          <p className="text-xs text-slate-400 mt-2">Dari pelaporan s.d penyelesaian</p>
        </Card>

        <Card className="p-6 rounded-lg border border-rose-200 shadow-sm bg-rose-50 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <p className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-1">Tiket Terbengkalai</p>
          <p className="text-4xl font-black text-rose-700">{overdueTickets.length}</p>
          <p className="text-xs text-rose-500 mt-2">Melewati SLA (3 Hari)</p>
        </Card>
      </div>

      <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Review Tiket Terbengkalai (Overdue)</h2>
            <p className="text-xs text-slate-500 font-medium">Bahan evaluasi untuk Rapat Koordinasi dengan Kepala TU</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : overdueTickets.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-emerald-200 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold">Kinerja TU Sangat Baik</p>
              <p className="text-xs mt-1">Tidak ada keluhan atau permintaan guru yang melewati batas waktu.</p>
            </div>
          ) : overdueTickets.map(ticket => (
            <div key={ticket.id} className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-rose-800 text-sm">{ticket.title}</h3>
                  <p className="text-xs text-rose-700">Oleh: {ticket.profiles?.full_name}</p>
                </div>
                <span className="px-2 py-1 bg-rose-200 text-rose-800 font-bold text-[10px] rounded uppercase">Overdue</span>
              </div>
              <p className="text-sm text-slate-700 bg-white p-3 rounded border border-rose-100 mb-3">{ticket.description}</p>
              <p className="text-[10px] font-bold text-slate-400">Dilaporkan pada: {new Date(ticket.created_at).toLocaleString('id-ID')}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
