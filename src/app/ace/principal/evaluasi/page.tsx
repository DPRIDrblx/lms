"use client";

import { useAuth } from "@/lib/auth-context";
import { BarChart3, Search, Filter, Star, UserCircle2, ArrowUpRight, CheckCircle2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function EvaluasiGuru() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Evaluasi Kinerja Guru</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Pemantauan hasil supervisi, absensi, dan penilaian siswa</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
          Unduh Laporan PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div>
            <p className="text-sm font-bold text-slate-500">Rata-rata Nilai</p>
            <p className="text-2xl font-black text-slate-800">88.5</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 border-l-4 border-l-blue-500">
          <div>
            <p className="text-sm font-bold text-slate-500">Telah Dievaluasi</p>
            <p className="text-2xl font-black text-slate-800">112<span className="text-sm text-slate-400 font-normal">/142</span></p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 border-l-4 border-l-purple-500">
          <div>
            <p className="text-sm font-bold text-slate-500">Predikat Sangat Baik</p>
            <p className="text-2xl font-black text-slate-800">45</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 border-l-4 border-l-rose-500">
          <div>
            <p className="text-sm font-bold text-slate-500">Perlu Pembinaan</p>
            <p className="text-2xl font-black text-slate-800">4</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama guru atau NIP..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> Filter Predikat
          </button>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4 font-bold">Nama Guru</th>
                <th className="p-4 font-bold">NIP</th>
                <th className="p-4 font-bold">Mapel</th>
                <th className="p-4 font-bold text-center">Kehadiran</th>
                <th className="p-4 font-bold text-center">Skor Supervisi</th>
                <th className="p-4 font-bold text-center">Penilaian Siswa</th>
                <th className="p-4 font-bold text-center">Predikat</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { nama: "Budi Santoso, S.Pd.", nip: "198005122005011001", mapel: "Matematika", hadir: "99%", skor: 92, siswa: 4.8, predikat: "Sangat Baik", color: "bg-emerald-100 text-emerald-700" },
                { nama: "Siti Aminah, M.Pd.", nip: "198207152006042002", mapel: "Fisika", hadir: "100%", skor: 88, siswa: 4.6, predikat: "Baik", color: "bg-blue-100 text-blue-700" },
                { nama: "Ahmad Fauzi, S.Kom.", nip: "199012052015031004", mapel: "TIK", hadir: "95%", skor: 76, siswa: 3.9, predikat: "Cukup", color: "bg-amber-100 text-amber-700" },
                { nama: "Dewi Lestari, S.S.", nip: "198503222010012003", mapel: "Bahasa Inggris", hadir: "88%", skor: 65, siswa: 3.2, predikat: "Pembinaan", color: "bg-rose-100 text-rose-700" },
              ].map((guru, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800 flex items-center gap-3">
                    <UserCircle2 className="w-8 h-8 text-slate-300" />
                    {guru.nama}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">{guru.nip}</td>
                  <td className="p-4 text-slate-600">{guru.mapel}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{guru.hadir}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{guru.skor}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-slate-700">{guru.siswa}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${guru.color}`}>
                      {guru.predikat}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center justify-end gap-1 w-full">
                      Detail <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
