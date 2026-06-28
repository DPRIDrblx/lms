"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Receipt, ScanLine, Wallet, CheckCircle2, ShieldAlert, Lock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function TUKeuangan() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("payroll");

  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    // Fetch benefits for Plafond Control
    const { data } = await supabase.from('ace_benefits').select('*, profiles(full_name)').eq('year', new Date().getFullYear());
    if (data) setBenefits(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  if (!profile || profile.role !== 'tu') return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">TU Keuangan / Bendahara</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Konsol Penggajian & Audit Klaim</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'payroll', label: 'Lembar Kerja Payroll' },
          { id: 'klaim', label: 'Verifikator Klaim (OCR)' },
          { id: 'plafond', label: 'Plafond Control & Budget' },
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'payroll' && (
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Draft Payroll: Juni 2026</h2>
            <button className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-md shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Lock & Release Payslip
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 border-b border-slate-200">Nama Guru</th>
                  <th className="p-3 border-b border-slate-200">Gaji Pokok</th>
                  <th className="p-3 border-b border-slate-200 text-rose-600">Potongan (Absen/Telat)</th>
                  <th className="p-3 border-b border-slate-200 text-emerald-600">Tambahan (Lembur/Dinas)</th>
                  <th className="p-3 border-b border-slate-200">Total Take Home Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-semibold text-slate-800">Pak Budi</td>
                  <td className="p-3 text-slate-600">Rp 4.500.000</td>
                  <td className="p-3 text-rose-600 font-semibold">- Rp 50.000 (Telat 2x)</td>
                  <td className="p-3 text-emerald-600 font-semibold">+ Rp 300.000</td>
                  <td className="p-3 font-bold text-slate-800">Rp 4.750.000</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-semibold text-slate-800">Bu Dina</td>
                  <td className="p-3 text-slate-600">Rp 5.200.000</td>
                  <td className="p-3 text-slate-400 font-medium">- Rp 0</td>
                  <td className="p-3 text-emerald-600 font-semibold">+ Rp 150.000</td>
                  <td className="p-3 font-bold text-slate-800">Rp 5.350.000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'klaim' && (
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <h2 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Antrean Verifikasi Kuitansi (Medis / Operasional)</h2>
          
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/3 bg-slate-200 h-40 rounded flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-300 border-dashed">
              [Preview Foto Kuitansi]
            </div>
            <div className="w-full md:w-2/3 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-bold text-sm text-slate-800">Klaim Pengobatan Pak Budi</p>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded uppercase">Tunjangan Kesehatan</span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-white border border-slate-200 rounded-md">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Input Guru</p>
                  <p className="font-bold text-sm text-slate-800">Rp 150.000</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1"><ScanLine className="w-3 h-3" /> Hasil Baca OCR (Sistem)</p>
                  <p className="font-bold text-sm text-indigo-700">Rp 150.000</p>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded flex gap-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Nominal Valid & Sesuai Kuitansi.
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button className="px-4 py-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 font-bold text-xs rounded transition-colors">Tolak</button>
                <button className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded shadow-sm transition-colors">Approve Transfer</button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'plafond' && (
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Plafond Control & Budgeting Ledger</h2>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Tahun Anggaran {new Date().getFullYear()}</p>
            </div>
            <Wallet className="w-6 h-6 text-indigo-200" />
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-xs text-slate-500">Memuat data budget...</p> : benefits.length === 0 ? <p className="text-xs text-slate-500">Belum ada guru yang mengunci paket tunjangan tahun ini.</p> : benefits.map(b => (
              <div key={b.id} className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-sm text-slate-800">{b.profiles.full_name}</p>
                  <p className="text-xs font-semibold text-indigo-600">{b.package_name}</p>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                  <span>Terpakai: Rp {b.claimed_amount.toLocaleString('id-ID')}</span>
                  <span>Max: Rp {b.max_plafond.toLocaleString('id-ID')}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(b.claimed_amount / b.max_plafond) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {benefits.length > 0 && (
            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-3 text-indigo-800">
              <AlertTriangle className="w-5 h-5 text-indigo-600 shrink-0" />
              <p className="text-xs font-semibold leading-relaxed">
                Sistem telah secara otomatis menjumlahkan kewajiban anggaran tunjangan tahun ini berdasarkan pilihan seluruh guru dan mengunci dana tersebut agar tidak tercampur dengan anggaran Sarpras.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
