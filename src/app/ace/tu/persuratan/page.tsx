"use client";

import { useAuth } from "@/lib/auth-context";
import { Mail, FileText, Send, Inbox, Plus, Search, Filter } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function TUPersuratan() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('masuk');

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Administrasi Persuratan</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manajemen surat masuk dan keluar sekolah</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Buat Surat Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('masuk')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'masuk' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Inbox className="w-4 h-4" /> Surat Masuk
          </button>
          <button 
            onClick={() => setActiveTab('keluar')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'keluar' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Send className="w-4 h-4" /> Surat Keluar
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nomor surat, perihal, atau pengirim..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* Content */}
        <div className="divide-y divide-slate-100">
          {activeTab === 'masuk' ? (
            <>
              {[
                { no: "421/012/Disdik/2026", perihal: "Undangan Rapat Kordinasi Kepala Sekolah", pengirim: "Dinas Pendidikan Kota", tanggal: "12 Ags 2026", status: "Menunggu Disposisi", color: "bg-amber-100 text-amber-700" },
                { no: "005/11/BKN/2026", perihal: "Edaran Pemutakhiran Data ASN", pengirim: "Badan Kepegawaian Negara", tanggal: "10 Ags 2026", status: "Didisposisikan", color: "bg-blue-100 text-blue-700" },
                { no: "089/Srt/Puskes/2026", perihal: "Jadwal Imunisasi Siswa Kelas 1", pengirim: "Puskesmas Kecamatan", tanggal: "05 Ags 2026", status: "Selesai", color: "bg-emerald-100 text-emerald-700" },
              ].map((surat, i) => (
                <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 mt-1">
                      <Mail className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{surat.perihal}</h3>
                      <p className="text-sm text-slate-500 font-medium">{surat.no} • Dari: {surat.pengirim}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:flex-col md:items-end">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${surat.color}`}>
                      {surat.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{surat.tanggal}</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                { no: "045/SMA1/VIII/2026", perihal: "Surat Pengantar Pengajuan Pensiun a.n Budi", tujuan: "Dinas Pendidikan Kota", tanggal: "14 Ags 2026", status: "Menunggu TTD Kepsek", color: "bg-rose-100 text-rose-700" },
                { no: "046/SMA1/VIII/2026", perihal: "Permohonan Bantuan Dana Perbaikan Lab", tujuan: "Komite Sekolah", tanggal: "13 Ags 2026", status: "Terkirim", color: "bg-emerald-100 text-emerald-700" },
              ].map((surat, i) => (
                <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center shrink-0 mt-1">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{surat.perihal}</h3>
                      <p className="text-sm text-slate-500 font-medium">{surat.no} • Tujuan: {surat.tujuan}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:flex-col md:items-end">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${surat.color}`}>
                      {surat.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{surat.tanggal}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
