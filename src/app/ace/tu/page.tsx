"use client";

import { useAuth } from "@/lib/auth-context";
import { Briefcase, Mail, Wallet, ClipboardList, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TUDashboard() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Dashboard Tata Usaha</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Ringkasan administrasi dan operasional sekolah</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats Cards */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Surat Masuk Baru</p>
            <p className="text-2xl font-black text-slate-800">12</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Aset Dipinjam</p>
            <p className="text-2xl font-black text-slate-800">8</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Klaim Menunggu</p>
            <p className="text-2xl font-black text-slate-800">5</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Guru Cuti</p>
            <p className="text-2xl font-black text-slate-800">2</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Aktivitas Persuratan Terkini</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">Surat Edaran Dinas Pendidikan</h3>
                  <p className="text-xs text-slate-500 mt-1">Diterima: 12 Agustus 2026 • Status: Menunggu Disposisi</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/ace/tu/persuratan" className="block mt-4 text-center text-sm font-bold text-indigo-600 hover:text-indigo-700">
            Lihat Semua Surat &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Layanan Cepat TU</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/ace/tu/kepegawaian" className="p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group">
              <Briefcase className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-blue-900 text-sm">Kepegawaian</h3>
              <p className="text-xs text-blue-700/70 mt-1">Data Guru & Staf</p>
            </Link>
            <Link href="/ace/tu/keuangan" className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors group">
              <Wallet className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-emerald-900 text-sm">Keuangan</h3>
              <p className="text-xs text-emerald-700/70 mt-1">SPP & Honorarium</p>
            </Link>
            <Link href="/ace/tu/persuratan" className="p-4 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors group">
              <Mail className="w-6 h-6 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-orange-900 text-sm">Persuratan</h3>
              <p className="text-xs text-orange-700/70 mt-1">Surat Masuk/Keluar</p>
            </Link>
            <Link href="/ace/tu/inventaris" className="p-4 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors group">
              <ClipboardList className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-purple-900 text-sm">Inventaris</h3>
              <p className="text-xs text-purple-700/70 mt-1">Manajemen Aset</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
