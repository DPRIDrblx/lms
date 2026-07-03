"use client";

import { useAuth } from "@/lib/auth-context";
import { ClipboardList, Plus, Search, Filter, MapPin, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function TUInventaris() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Manajemen Inventaris</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Pencatatan aset sarana dan prasarana sekolah</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Aset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 border-l-4 border-l-purple-500">
          <div>
            <p className="text-sm font-bold text-slate-500">Total Aset Aktif</p>
            <p className="text-2xl font-black text-slate-800">1,245</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div>
            <p className="text-sm font-bold text-slate-500">Sedang Dipinjam</p>
            <p className="text-2xl font-black text-slate-800">32</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 border-l-4 border-l-rose-500">
          <div>
            <p className="text-sm font-bold text-slate-500">Kondisi Rusak</p>
            <p className="text-2xl font-black text-slate-800">14</p>
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
              placeholder="Cari kode barang, nama barang, atau lokasi..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4 font-bold">Kode Barang</th>
                <th className="p-4 font-bold">Nama Barang</th>
                <th className="p-4 font-bold">Kategori</th>
                <th className="p-4 font-bold">Lokasi</th>
                <th className="p-4 font-bold">Kondisi</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { kode: "INV-EL-001", nama: "Proyektor Epson EB-X400", kategori: "Elektronik", lokasi: "Ruang Guru", kondisi: "Baik", color: "bg-emerald-100 text-emerald-700" },
                { kode: "INV-EL-002", nama: "Proyektor Epson EB-X400", kategori: "Elektronik", lokasi: "Kelas 10A", kondisi: "Dipinjam", color: "bg-amber-100 text-amber-700" },
                { kode: "INV-MB-045", nama: "Meja Guru Kayu Jati", kategori: "Mebel", lokasi: "Kelas 11 IPA", kondisi: "Baik", color: "bg-emerald-100 text-emerald-700" },
                { kode: "INV-MB-046", nama: "Kursi Siswa Besi", kategori: "Mebel", lokasi: "Gudang Sarpras", kondisi: "Rusak", color: "bg-rose-100 text-rose-700" },
                { kode: "INV-IT-112", nama: "Laptop Asus Vivobook", kategori: "IT", lokasi: "Lab Komputer", kondisi: "Perbaikan", color: "bg-blue-100 text-blue-700" },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500">{item.kode}</td>
                  <td className="p-4 font-bold text-slate-800">{item.nama}</td>
                  <td className="p-4 text-slate-600">{item.kategori}</td>
                  <td className="p-4 text-slate-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.lokasi}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${item.color}`}>
                      {item.kondisi}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 font-bold text-xs">Detail</button>
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
