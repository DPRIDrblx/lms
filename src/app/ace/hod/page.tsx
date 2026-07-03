"use client";

import { useAuth } from "@/lib/auth-context";
import { LayoutGrid, BookOpen, FileText, CheckCircle2, AlertTriangle, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HoDDashboard() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Dashboard Kepala Departemen</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Pemantauan kurikulum dan supervisi akademik</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Guru Binaan</p>
            <p className="text-2xl font-black text-slate-800">12</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Supervisi Selesai</p>
            <p className="text-2xl font-black text-slate-800">8<span className="text-sm text-slate-400 font-normal">/12</span></p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Ketercapaian RPP</p>
            <p className="text-2xl font-black text-slate-800">76%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Agenda Supervisi Terdekat</h2>
          <div className="space-y-4">
            <div className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Observasi Kelas - Siti Aminah</h3>
                <p className="text-xs text-slate-500 mt-1">Fisika Kelas 11 IPA 2 • Besok, 08:00 WIB</p>
              </div>
              <div className="ml-auto">
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">Menunggu</span>
              </div>
            </div>
            <div className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Pemeriksaan RPP - Ahmad Fauzi</h3>
                <p className="text-xs text-slate-500 mt-1">TIK Lintas Minat • Lusa, 13:00 WIB</p>
              </div>
              <div className="ml-auto">
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">Menunggu</span>
              </div>
            </div>
          </div>
          <Link href="/ace/hod/supervisi" className="block mt-4 text-center text-sm font-bold text-indigo-600 hover:text-indigo-700">
            Buka Panel Supervisi &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Ruang HoD</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/ace/hod/kurikulum" className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors group">
              <BookOpen className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-indigo-900 text-sm">Kurikulum</h3>
              <p className="text-xs text-indigo-700/70 mt-1">Silabus & RPP</p>
            </Link>
            <Link href="/ace/hod/supervisi" className="p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group">
              <FileText className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-blue-900 text-sm">Supervisi</h3>
              <p className="text-xs text-blue-700/70 mt-1">Observasi Akademik</p>
            </Link>
            <Link href="/ace/hod/akademik" className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors group">
              <LayoutGrid className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-emerald-900 text-sm">Akademik</h3>
              <p className="text-xs text-emerald-700/70 mt-1">Pencapaian KBM</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
