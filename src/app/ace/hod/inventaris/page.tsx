"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Wallet, CheckCircle2, Box, Send, AlertTriangle, XCircle, Clock, Activity } from "lucide-react";
import { useEffect, useState } from "react";

export default function HoDInventaris() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [requests, setRequests] = useState<any[]>([]);
  const [budgetLimit, setBudgetLimit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ace_asset_requests')
      .select('*, profiles(full_name)')
      .in('status', ['pending_hod', 'processed_tu']); // We show pending ones to approve, and processed ones to track SLA
      
    if (data) setRequests(data);

    // Fetch budget (assuming 1 department for simplicity, or we match HoD's department if we had it in profiles)
    // For now, fetch any budget for this year or default
    const year = new Date().getFullYear();
    const { data: budgets } = await supabase.from('ace_budgets').select('total_budget').eq('year', year).limit(1);
    if (budgets && budgets.length > 0) {
      setBudgetLimit(budgets[0].total_budget);
    } else {
      setBudgetLimit(15000000); // fallback if no budget is set in db
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleAction = async (id: string, action: 'approved_hod' | 'rejected') => {
    setProcessing(true);
    try {
      await supabase.from('ace_asset_requests').update({ status: action }).eq('id', id);
      setRequests(prev => prev.filter(r => r.id !== id || action === 'approved_hod' ? false : true)); // Remove if rejected or approved (since we only fetch pending/processed)
      // Actually, if approved, we shouldn't just remove it, we should refetch or update status locally.
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
      alert(`Permohonan telah di-${action === 'approved_hod' ? 'setujui dan diteruskan ke TU' : 'tolak'}.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!profile || !profile.is_hod) return null;

  const pendingRequests = requests.filter(r => r.status === 'pending_hod');
  const trackingRequests = requests.filter(r => r.status === 'approved_hod' || r.status === 'processed_tu');

  const totalCost = pendingRequests.reduce((acc, curr) => acc + (curr.estimated_cost * curr.quantity), 0);
  const isOverBudget = totalCost > budgetLimit;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Anggaran & Sarana</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Departmental Asset & Budget Planner</p>
      </div>

      <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Wallet className="w-32 h-32 text-emerald-600" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 w-full">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Verifikasi Plafond Departemen (Tahun Ini)</h2>
            
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Total Permohonan Mengantre</p>
                <p className={`text-3xl font-black ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}`}>
                  Rp {totalCost.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium mb-1">Pagu Tersedia</p>
                <p className="text-xl font-bold text-emerald-600">Rp {budgetLimit.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
              <div 
                className={`h-3 rounded-full transition-all ${isOverBudget ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${budgetLimit > 0 ? Math.min((totalCost / budgetLimit) * 100, 100) : 100}%` }}
              ></div>
            </div>
            
            {isOverBudget && (
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-3 bg-rose-50 p-2 rounded">
                <AlertTriangle className="w-4 h-4" /> 
                Plafon anggaran melebihi batas. Sistem mengunci tombol pengiriman ke TU. Silakan tolak beberapa item atau revisi kuantitas.
              </p>
            )}
          </div>
          
          <div className="shrink-0 w-full md:w-auto">
            <button 
              disabled={isOverBudget || pendingRequests.length === 0}
              className={`w-full md:w-auto px-6 py-4 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-colors ${
                isOverBudget || pendingRequests.length === 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Send className="w-5 h-5" /> 
              Kirim Semua ke TU
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Konsolidasi Permohonan Barang</h2>
              <p className="text-xs text-slate-500 font-medium">Sortir dan setujui usulan dari guru di departemen Anda.</p>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : pendingRequests.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
                <p className="text-sm font-medium text-slate-500">Tidak ada permohonan baru.</p>
              </div>
            ) : pendingRequests.map(req => (
              <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{req.item_name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Oleh: {req.profiles?.full_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    req.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                    req.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {req.priority}
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 mb-3">
                  <div className="text-xs font-bold text-slate-600">{req.quantity} Unit</div>
                  <div className="text-xs font-bold text-slate-800">@ Rp {req.estimated_cost.toLocaleString('id-ID')}</div>
                  <div className="text-sm font-black text-indigo-600">Rp {(req.quantity * req.estimated_cost).toLocaleString('id-ID')}</div>
                </div>

                <div className="flex gap-2">
                  <button 
                    disabled={processing}
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="flex-1 py-2 bg-white border border-slate-300 text-rose-600 font-bold text-xs rounded hover:bg-rose-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Tolak Permohonan
                  </button>
                  <button 
                    disabled={processing}
                    onClick={() => handleAction(req.id, 'approved_hod')}
                    className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Setujui Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">SLA Procurement Tracking</h2>
                <p className="text-xs text-slate-500 font-medium">Lacak status barang yang sudah dikirim ke TU.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : trackingRequests.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
                <p className="text-sm font-medium text-slate-500">Tidak ada barang dalam proses pengadaan.</p>
              </div>
            ) : trackingRequests.map(req => (
              <div key={req.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-1">{req.item_name} <span className="text-xs font-normal text-slate-500">({req.quantity} unit)</span></h3>
                
                <div className="mt-4 relative">
                  <div className="absolute top-2.5 left-4 right-4 h-0.5 bg-slate-100 z-0"></div>
                  
                  <div className="relative z-10 flex justify-between">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 text-center w-16">Disetujui HoD</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${req.status === 'processed_tu' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {req.status === 'processed_tu' ? <Activity className="w-3 h-3" /> : <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      <span className={`text-[9px] font-bold text-center w-16 ${req.status === 'processed_tu' ? 'text-indigo-600' : 'text-slate-400'}`}>Diproses TU</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 text-center w-16">Barang Tiba</span>
                    </div>
                  </div>
                </div>

                {req.status === 'approved_hod' && (
                  <button className="w-full mt-5 py-2 bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-wider rounded border border-rose-200 hover:bg-rose-100 transition-colors">
                    Kirim Nota Penagihan Otomatis ke Kepala TU (SLA Terlampaui)
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
