"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Users, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Bell,
  ArrowRight,
  Plus,
  Loader2,
  ShieldCheck,
  Building2,
  Activity
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, Gem as GemIcon, Search, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function TUDashboard() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingBills: 0,
    upcomingEvents: 0,
    collectionRate: "0%"
  });
  const [alerts, setAlerts] = useState<any[]>([
    { id: 1, type: "warning", message: "Initial sync in progress..." }
  ]);
  const [goldenHourActive, setGoldenHourActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [gemAmount, setGemAmount] = useState(100);
  const [sendingGems, setSendingGems] = useState(false);

  const fetchStats = async () => {
    const [stds, bills, events] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("finance_bills").select("*").eq("status", "pending"),
      supabase.from("school_events").select("*", { count: "exact", head: true })
    ]);

    // Calculate Collection Rate
    const { data: allBills } = await supabase.from("finance_bills").select("status");
    const total = allBills?.length || 0;
    const paid = allBills?.filter((b: any) => b.status === "paid").length || 0;
    const rate = total > 0 ? Math.round((paid / total) * 100) : 0;

    setStats({
      totalStudents: stds.count || 0,
      pendingBills: bills.data?.length || 0,
      upcomingEvents: events.count || 0,
      collectionRate: `${rate}%`
    });

    // Generate real alerts
    const newAlerts = [];
    if (bills.data && bills.data.length > 0) {
      const uniqueUnpaid = Array.from(new Set(bills.data.map((b: any) => b.student_id))).length;
      newAlerts.push({ id: 1, type: "warning", message: `${uniqueUnpaid} students have pending tuition payments.` });
    }
    newAlerts.push({ id: 2, type: "info", message: "Academy portal is synchronized with global database." });
    setAlerts(newAlerts);

    // Fetch Golden Hour Settings
    const { data: settings } = await supabase.from("global_settings").select("value").eq("key", "golden_hour_active").single();
    if (settings) {
       setGoldenHourActive(settings.value === "true" || settings.value === true);
    }
  };

  const toggleGoldenHour = async () => {
     const newVal = !goldenHourActive;
     setGoldenHourActive(newVal);
     await supabase.from("global_settings").upsert({ key: "golden_hour_active", value: newVal });
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .ilike("full_name", `%${query}%`)
      .eq("role", "student")
      .limit(5);
    setSearchResults(data || []);
  };

  const handleSendGems = async () => {
     if (!selectedUser || gemAmount <= 0) return;
     setSendingGems(true);
     
     const { data: targetUser } = await supabase.from("profiles").select("id, full_name, gems").eq("id", selectedUser.id).single();
        
     if (!targetUser) {
        toast.error("Siswa tidak ditemukan!");
        setSendingGems(false);
        return;
     }
     
     const newGems = (targetUser.gems || 0) + Number(gemAmount);
     const { error } = await supabase.from("profiles").update({ gems: newGems }).eq("id", targetUser.id);
     
     if (error) {
        toast.error("Gagal mengirim Gems.");
     } else {
        toast.success(`Berhasil mengirim ${gemAmount} Gems ke ${targetUser.full_name}!`);
        setSelectedUser(null);
        setSearchQuery("");
        setGemAmount(100);
     }
     setSendingGems(false);
  };

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel('tu-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_bills' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  return (
    <div className="space-y-8 max-w-6xl font-sans">
      {/* Operation Center Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 p-8 md:p-10 text-white shadow-xl shadow-blue-900/20">
        <div className="absolute inset-0 bg-white/5 pattern-dots pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-8 w-8 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-3xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100">
                Pusat Kendali Operasional
              </h1>
              <p className="text-blue-200 text-sm md:text-base font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Tata Usaha & Administrasi
              </p>
            </div>
          </div>
          {user && !profile && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-100 backdrop-blur-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Sinkronisasi Data...</span>
            </div>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 right-1/4 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
          <Activity className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Ringkasan Metrik</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 relative z-10">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 relative z-10">Total Siswa Aktif</p>
          <h3 className="text-3xl font-black text-slate-800 relative z-10">{stats.totalStudents}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 relative z-10">
            <CreditCard className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 relative z-10">Tagihan SPP Pending</p>
          <h3 className="text-3xl font-black text-slate-800 relative z-10">{stats.pendingBills}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 relative z-10">
            <Calendar className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 relative z-10">Acara & Libur (Bulan Ini)</p>
          <h3 className="text-3xl font-black text-slate-800 relative z-10">{stats.upcomingEvents}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-4 relative z-10">
            <TrendingUp className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 relative z-10">Collection Rate SPP</p>
          <h3 className="text-3xl font-black text-slate-800 relative z-10">{stats.collectionRate}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Links */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Pintasan Operasional</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/tu/finance" className="block">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group h-full">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-600">
                   <CreditCard className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-slate-800">Tagihan SPP Massal</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Buat dan kelola tagihan SPP bulanan untuk seluruh siswa</p>
              </div>
            </Link>
            <Link href="/tu/events" className="block">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group h-full">
                <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center mb-4 group-hover:bg-cyan-500 group-hover:text-white transition-colors text-cyan-600">
                   <Calendar className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-slate-800">Kelola Kalender</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Atur hari libur, jadwal ujian, dan acara sekolah tahunan</p>
              </div>
            </Link>
          </div>
          
          {/* Golden Hour Toggle */}
          <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-amber-200 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                   <Sparkles className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-black text-amber-900 text-lg">The Golden Hour</h3>
                   <p className="text-xs text-amber-700 font-medium">Aktifkan portal kuis gacha harian untuk seluruh siswa.</p>
                </div>
             </div>
             <button 
                onClick={toggleGoldenHour}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${goldenHourActive ? 'bg-amber-500' : 'bg-slate-300'}`}
             >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${goldenHourActive ? 'translate-x-7' : 'translate-x-1'}`} />
             </button>
          </div>
          
          {/* Top-up Gems Manual */}
          <div className="mt-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative z-20">
             <div className="flex items-center gap-2 mb-4">
                <GemIcon className="w-5 h-5 text-pink-500" />
                <h3 className="font-bold text-slate-800">Top-Up Gems Manual</h3>
             </div>
             
             {!selectedUser ? (
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                       type="text" 
                       placeholder="Cari Nama / Email Siswa..." 
                       value={searchQuery}
                       onChange={e => handleSearch(e.target.value)}
                       className="w-full px-4 py-2 pl-9 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500"
                    />
                    
                    {searchResults.length > 0 && (
                       <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                          {searchResults.map(user => (
                             <div 
                                key={user.id} 
                                onClick={() => { setSelectedUser(user); setSearchResults([]); }}
                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between"
                             >
                                <div>
                                   <p className="font-bold text-slate-800 text-sm">{user.full_name}</p>
                                   <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                                <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-md">Pilih</span>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
             ) : (
                 <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                       <div>
                          <p className="text-sm font-bold text-slate-800">{selectedUser.full_name}</p>
                          <p className="text-xs text-slate-500">{selectedUser.email}</p>
                       </div>
                       <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                       </button>
                    </div>
                    <input 
                       type="number" 
                       placeholder="Jumlah" 
                       value={gemAmount}
                       onChange={e => setGemAmount(Number(e.target.value))}
                       className="w-full sm:w-24 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-500"
                    />
                    <button 
                       onClick={handleSendGems}
                       disabled={sendingGems}
                       className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                       {sendingGems ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                       Kirim
                    </button>
                 </div>
             )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-lg font-bold text-slate-800">Pemberitahuan Sistem</h2>
            <Badge className="bg-emerald-100 text-emerald-700 border-none px-2 py-0.5 text-[10px]">Live</Badge>
          </div>
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {alerts.length > 0 ? alerts.map((alert: any) => (
              <div key={alert.id} className={`flex items-start gap-3 p-3.5 rounded-xl border bg-white ${
                alert.type === "warning" 
                  ? "border-l-4 border-l-amber-500 border-y-slate-100 border-r-slate-100 shadow-sm"
                  : "border-l-4 border-l-blue-500 border-y-slate-100 border-r-slate-100 shadow-sm"
              }`}>
                <Bell className={`h-4 w-4 shrink-0 mt-0.5 ${alert.type === "warning" ? "text-amber-500" : "text-blue-500"}`} />
                <p className="text-sm text-slate-600 leading-snug">{alert.message}</p>
              </div>
            )) : (
               <div className="text-center py-6 text-slate-400">
                  <p className="text-sm">Tidak ada pemberitahuan baru.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
