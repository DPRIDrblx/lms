"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Plus, Tag, Package, Users, Settings2, Percent } from "lucide-react";

export default function OperatorLesDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"packages" | "promos">("packages");

  // Mock data for UI presentation
  const mockPackages = [
    { name: "Paket Intensif UTBK", level: "SMA", price: 450000, subs: 124 },
    { name: "Paket Juara Kelas 9", level: "SMP", price: 250000, subs: 89 },
  ];

  const mockPromos = [
    { code: "DISKONJUARA", type: "percent", value: 20, uses: 45 },
    { code: "POTONGAN50K", type: "flat", value: 50000, uses: 12 },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Operator Dashboard</h1>
          <p className="text-slate-500 font-medium">Kelola harga paket les dan voucher diskon.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">
            <Plus className="w-5 h-5" /> Buat Paket
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
            <Tag className="w-5 h-5" /> Buat Promo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Package className="w-6 h-6" /></div>
          <h3 className="text-slate-500 font-bold mb-1">Total Paket Aktif</h3>
          <p className="text-3xl font-black text-slate-900">8</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4"><Users className="w-6 h-6" /></div>
          <h3 className="text-slate-500 font-bold mb-1">Total Sobat IGNITE</h3>
          <p className="text-3xl font-black text-slate-900">213</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Percent className="w-6 h-6" /></div>
          <h3 className="text-slate-500 font-bold mb-1">Promo Aktif</h3>
          <p className="text-3xl font-black text-slate-900">5</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200">
          <button onClick={() => setActiveTab("packages")} className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'packages' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-500 hover:bg-slate-50'}`}>Paket Belajar</button>
          <button onClick={() => setActiveTab("promos")} className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'promos' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-500 hover:bg-slate-50'}`}>Kode Voucher</button>
        </div>
        <div className="p-6">
          {activeTab === "packages" ? (
            <div className="space-y-4">
              {mockPackages.map((pkg, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 rounded-2xl hover:border-orange-200 transition-colors">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{pkg.name}</h4>
                    <p className="text-sm text-slate-500">{pkg.level} • {pkg.subs} Pelanggan Aktif</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-4">
                    <span className="text-xl font-black text-slate-900">Rp {pkg.price.toLocaleString()}</span>
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><Settings2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {mockPromos.map((promo, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 rounded-2xl hover:border-orange-200 transition-colors">
                  <div>
                    <span className="px-3 py-1 bg-slate-900 text-white font-black uppercase text-sm rounded-lg tracking-wider mb-2 inline-block">{promo.code}</span>
                    <p className="text-sm text-slate-500">{promo.uses} Kali Digunakan</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-4">
                    <span className="text-lg font-bold text-green-600">
                      Diskon {promo.type === 'percent' ? `${promo.value}%` : `Rp ${promo.value.toLocaleString()}`}
                    </span>
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><Settings2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
