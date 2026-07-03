"use client";

import { useAuth } from "@/lib/auth-context";
import { LayoutGrid, Users, CheckSquare, BarChart3, Wallet, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function PrincipalDashboard() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Dashboard Kepala Sekolah</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Pemantauan eksekutif dan persetujuan strategis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+98% Hadir</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">142</p>
            <p className="text-sm font-bold text-slate-500 mt-0.5">Guru Aktif Hari Ini</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">3 Urgent</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">12</p>
            <p className="text-sm font-bold text-slate-500 mt-0.5">Menunggu Persetujuan</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Naik 4%</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">86.4</p>
            <p className="text-sm font-bold text-slate-500 mt-0.5">Rata-rata Indeks Mutu</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Batas Aman</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">64%</p>
            <p className="text-sm font-bold text-slate-500 mt-0.5">Serapan Anggaran</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Butuh Perhatian Segera</h2>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Pengajuan Cuti Umrah - Budi Santoso</h3>
                <p className="text-xs text-slate-500 mt-1">Cuti selama 14 hari. Diajukan 2 hari yang lalu.</p>
              </div>
              <div className="ml-auto flex items-center">
                <Link href="/ace/principal/izin" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg">Review</Link>
              </div>
            </div>
            
            <div className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Pencairan Dana BOS Tahap 2</h3>
                <p className="text-xs text-slate-500 mt-1">Membutuhkan otorisasi Kepala Sekolah segera.</p>
              </div>
              <div className="ml-auto flex items-center">
                <Link href="/ace/principal/keuangan" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg">Review</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Ruang Kepsek</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/ace/principal/akuntabilitas" className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors group">
              <LayoutGrid className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-emerald-900 text-sm">Akuntabilitas</h3>
              <p className="text-xs text-emerald-700/70 mt-1">Laporan Kinerja</p>
            </Link>
            <Link href="/ace/principal/izin" className="p-4 rounded-xl bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-colors group">
              <CheckSquare className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-teal-900 text-sm">Persetujuan</h3>
              <p className="text-xs text-teal-700/70 mt-1">Cuti & Dokumen</p>
            </Link>
            <Link href="/ace/principal/evaluasi" className="p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group">
              <BarChart3 className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-blue-900 text-sm">Evaluasi Guru</h3>
              <p className="text-xs text-blue-700/70 mt-1">Penilaian Kinerja</p>
            </Link>
            <Link href="/ace/principal/keuangan" className="p-4 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group">
              <Wallet className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-amber-900 text-sm">Keuangan</h3>
              <p className="text-xs text-amber-700/70 mt-1">Laporan & RAPBS</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
