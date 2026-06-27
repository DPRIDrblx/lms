"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Plus, BookOpen, Video, LayoutList } from "lucide-react";

export default function PengurusNiaDashboard() {
  const { profile } = useAuth();

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pengurus & Tutor Dashboard</h1>
          <p className="text-slate-500 font-medium">Buat dan kelola materi untuk Sobat IGNITE.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all">
          <Plus className="w-5 h-5" /> Buat Materi Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Courses", value: "24", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Video Interaktif", value: "156", icon: Video, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Rangkuman / PDF", value: "89", icon: LayoutList, color: "text-purple-500", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-6">Materi Terbaru</h2>
        <div className="space-y-4">
          {[
            { title: "Matematika Sains: Integral Lanjut", type: "Interactive Video", date: "Hari ini" },
            { title: "Kupas Tuntas Biologi UTBK", type: "PDF / Canva", date: "Kemarin" },
            { title: "Bahasa Inggris: Reading Comprehension", type: "Gamifikasi", date: "2 Hari lalu" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  {item.type === "Interactive Video" ? <Video className="w-5 h-5 text-orange-500" /> : <BookOpen className="w-5 h-5 text-blue-500" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.type} • Dibuat {item.date}</p>
                </div>
              </div>
              <button className="mt-4 sm:mt-0 px-4 py-2 text-sm font-bold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                Edit Materi
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
