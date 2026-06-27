"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Sparkles, PlayCircle, Trophy, Flame, BookOpen } from "lucide-react";

export default function SobatNiaDashboard() {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      // Mock fetching subscriptions
      // In reality, this would be: supabase.from('nia_subscriptions').select('*, nia_packages(*)').eq('student_id', profile.id)
      setTimeout(() => {
        setSubscriptions([
          {
            id: 'sub-1',
            status: 'active',
            nia_packages: {
              name: 'Paket Intensif UTBK',
              level: 'SMA',
              major: 'Sains'
            }
          }
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [profile]);

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Halo Sobat IGNITE, {profile?.full_name?.split(' ')[0]}! 👋</h1>
          <p className="text-orange-100 text-lg">Siap untuk menaklukkan materi hari ini? Mari kita mulai belajar!</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total XP", value: "1,250", icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50" },
          { label: "Streak Belajar", value: "5 Hari", icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Materi Selesai", value: "12", icon: PlayCircle, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Paket Aktif", value: subscriptions.length.toString(), icon: Sparkles, color: "text-purple-500", bg: "bg-purple-50" }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active Packages */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-orange-500" /> Paket Belajar Aktif
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-100 animate-pulse rounded-3xl" />
          </div>
        ) : subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subscriptions.map(sub => (
              <div key={sub.id} className="bg-white border-2 border-orange-100 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg mb-2 inline-block">
                      {sub.nia_packages.level} - {sub.nia_packages.major}
                    </span>
                    <h3 className="text-xl font-black text-slate-900">{sub.nia_packages.name}</h3>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">Aktif</span>
                </div>
                <div className="mt-auto pt-6">
                  <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                    Lanjut Belajar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Paket</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">Kamu belum memiliki paket belajar yang aktif. Yuk cari paket yang cocok buatmu!</p>
            <a href="/bayarnia" className="inline-block px-8 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">
              Cari Paket Belajar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
