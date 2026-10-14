"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { 
  Trophy, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  Edit3, 
  Save, 
  X, 
  Sparkles, 
  RefreshCw, 
  Award,
  ChevronRight,
  School,
  GraduationCap,
  FileSpreadsheet,
  Check
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

interface Participant {
  id: string;
  full_name: string;
  role: string;
  class_id: string;
  school_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

interface NastResult {
  status: "pending" | "lolos" | "tidak_lolos";
  score?: number | string;
  rank?: string;
  notes?: string;
  updated_at?: string;
  updated_by?: string;
}

export default function OperatorNastPage() {
  const supabase = createClient();
  const NAST_CLASS_ID = "07fd41cd-9515-4255-9aab-b815cdb21d4e"; // SMP NAST 2026 (NAST2026JHS)

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, NastResult>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "lolos" | "tidak_lolos">("all");

  // Selected Participant for Modal Editing
  const [selectedStudent, setSelectedStudent] = useState<Participant | null>(null);
  const [editStatus, setEditStatus] = useState<"pending" | "lolos" | "tidak_lolos">("pending");
  const [editScore, setEditScore] = useState<string>("");
  const [editRank, setEditRank] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all students in NAST class
      const { data: students, error: studentErr } = await supabase
        .from("profiles")
        .select("id, full_name, role, class_id, school_name, phone, avatar_url, created_at")
        .eq("class_id", NAST_CLASS_ID)
        .order("full_name", { ascending: true });

      if (studentErr) throw studentErr;

      // 2. Fetch existing results from global_settings
      const { data: settingsData } = await supabase
        .from("global_settings")
        .select("value")
        .eq("key", "nast_results")
        .maybeSingle();

      const existingMap: Record<string, NastResult> = settingsData?.value || {};

      setParticipants(students || []);
      setResultsMap(existingMap);
    } catch (err: any) {
      console.error("Error fetching NAST data:", err);
      toast.error("Gagal memuat data peserta NAST");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (student: Participant) => {
    setSelectedStudent(student);
    const existing = resultsMap[student.id];
    setEditStatus(existing?.status || "pending");
    setEditScore(existing?.score !== undefined ? String(existing.score) : "");
    setEditRank(existing?.rank || "");
    setEditNotes(existing?.notes || "");
  };

  const handleSaveResult = async () => {
    if (!selectedStudent) return;
    setSaving(true);

    try {
      const updatedMap = {
        ...resultsMap,
        [selectedStudent.id]: {
          status: editStatus,
          score: editScore ? Number(editScore) || editScore : undefined,
          rank: editRank.trim() || undefined,
          notes: editNotes.trim() || undefined,
          updated_at: new Date().toISOString(),
          updated_by: "Operator Les"
        }
      };

      const { error } = await supabase
        .from("global_settings")
        .upsert({
          key: "nast_results",
          value: updatedMap
        });

      if (error) throw error;

      setResultsMap(updatedMap);
      toast.success(`Pengumuman untuk ${selectedStudent.full_name} berhasil disimpan!`);
      setSelectedStudent(null);
    } catch (err: any) {
      console.error("Gagal menyimpan hasil:", err);
      toast.error("Gagal menyimpan pengumuman");
    } finally {
      setSaving(false);
    }
  };

  // Filtered Participants
  const filteredParticipants = participants.filter((p) => {
    const studentResult = resultsMap[p.id];
    const currentStatus = studentResult?.status || "pending";

    const matchesStatus = statusFilter === "all" || currentStatus === statusFilter;
    const matchesSearch = 
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.school_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Counters
  const countTotal = participants.length;
  const countPending = participants.filter((p) => (resultsMap[p.id]?.status || "pending") === "pending").length;
  const countLolos = participants.filter((p) => resultsMap[p.id]?.status === "lolos").length;
  const countTidakLolos = participants.filter((p) => resultsMap[p.id]?.status === "tidak_lolos").length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* 🏆 HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-2xl p-2.5 backdrop-blur-md border border-white/20 shrink-0 flex items-center justify-center">
              <img 
                src="/logo-nast.png" 
                alt="Logo NAST 2027" 
                className="w-full h-full object-contain drop-shadow" 
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black uppercase tracking-wider mb-2">
                <Trophy className="w-3.5 h-3.5 text-orange-400" />
                <span>NAST 2027 Tournament Master Control</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Pengumuman Seleksi & Kelulusan Peserta
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1">
                Kelola status kelulusan peserta NAST (Kode Kelas: <strong className="text-amber-400 font-mono">NAST2026JHS</strong>). Peserta yang belum diinput otomatis berstatus <span className="text-slate-400 font-bold underline">Abu-Abu</span> di dasbor mereka.
              </p>
            </div>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all border border-white/15 backdrop-blur-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* 📊 SUMMARY COUNTERS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Registered */}
        <div 
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer p-5 rounded-3xl bg-white border-2 transition-all shadow-sm flex items-center justify-between ${
            statusFilter === "all" ? "border-blue-500 shadow-md ring-2 ring-blue-500/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Peserta</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{countTotal}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Belum Ada Inputan (Abu-Abu) */}
        <div 
          onClick={() => setStatusFilter("pending")}
          className={`cursor-pointer p-5 rounded-3xl bg-white border-2 transition-all shadow-sm flex items-center justify-between ${
            statusFilter === "pending" ? "border-slate-500 shadow-md ring-2 ring-slate-500/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Abu-Abu (Pending)</p>
            <p className="text-3xl font-black text-slate-600 mt-1">{countPending}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Lolos Semifinal */}
        <div 
          onClick={() => setStatusFilter("lolos")}
          className={`cursor-pointer p-5 rounded-3xl bg-white border-2 transition-all shadow-sm flex items-center justify-between ${
            statusFilter === "lolos" ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Lolos Semifinal</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{countLolos}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Tidak Lolos */}
        <div 
          onClick={() => setStatusFilter("tidak_lolos")}
          className={`cursor-pointer p-5 rounded-3xl bg-white border-2 transition-all shadow-sm flex items-center justify-between ${
            statusFilter === "tidak_lolos" ? "border-rose-500 shadow-md ring-2 ring-rose-500/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Tidak Lolos</p>
            <p className="text-3xl font-black text-rose-600 mt-1">{countTidakLolos}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 🔍 SEARCH & FILTER BAR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama peserta, sekolah, nomor kontak..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider pl-1">Status:</span>
          {(["all", "pending", "lolos", "tidak_lolos"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black capitalize transition-all whitespace-nowrap ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "all" ? "Semua" : st === "pending" ? "Abu-Abu (Pending)" : st === "lolos" ? "Lolos" : "Tidak Lolos"}
            </button>
          ))}
        </div>
      </div>

      {/* 📋 PARTICIPANTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            <h3 className="font-black text-slate-900 text-base">Daftar Peserta NAST 2027</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700">
              {filteredParticipants.length} Peserta
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-bold">Memuat daftar peserta NAST...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-base font-black text-slate-700">Tidak ada peserta yang cocok dengan filter</p>
            <p className="text-xs font-medium">Pastikan peserta sudah mendaftar dengan kode kelas NAST2026JHS</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-500 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Peserta</th>
                  <th className="py-4 px-6">Asal Sekolah</th>
                  <th className="py-4 px-6">Kontak</th>
                  <th className="py-4 px-6">Status Pengumuman</th>
                  <th className="py-4 px-6">Skor & Peringkat</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.map((p) => {
                  const res = resultsMap[p.id];
                  const status = res?.status || "pending";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Name & ID */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                            {p.full_name?.charAt(0)?.toUpperCase() || "P"}
                          </div>
                          <div>
                            <div className="font-black text-slate-900">{p.full_name}</div>
                            <div className="text-[11px] font-mono text-slate-400">ID: {p.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      {/* School */}
                      <td className="py-4 px-6 font-bold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <School className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{p.school_name || "SMP / MTs Peserta"}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-6 text-xs font-bold text-slate-600">
                        {p.phone || "-"}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        {status === "lolos" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Lolos Semifinal</span>
                          </span>
                        ) : status === "tidak_lolos" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Tidak Lolos</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-700 border border-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Abu-Abu (Pending)</span>
                          </span>
                        )}
                      </td>

                      {/* Score & Rank */}
                      <td className="py-4 px-6">
                        <div className="text-xs">
                          {res?.score !== undefined ? (
                            <span className="font-black text-slate-900">Skor: {res.score}</span>
                          ) : (
                            <span className="text-slate-400 italic">Belum ada skor</span>
                          )}
                          {res?.rank && (
                            <div className="text-[11px] font-bold text-blue-600">{res.rank}</div>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-black text-xs transition-all border border-slate-200 hover:border-blue-300 inline-flex items-center gap-1.5 active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Input Status</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🪟 MODAL EDIT STATUS PENGUMUMAN */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Input Pengumuman NAST</h3>
                  <p className="text-xs text-slate-500 font-bold">{selectedStudent.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5">
              
              {/* Radio Status Options */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Hasil Seleksi:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  
                  {/* Option 1: Abu-Abu (Pending) */}
                  <button
                    type="button"
                    onClick={() => setEditStatus("pending")}
                    className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                      editStatus === "pending"
                        ? "border-slate-600 bg-slate-100 text-slate-900 font-black shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-500"
                    }`}
                  >
                    <Clock className="w-5 h-5 text-slate-500" />
                    <span className="text-xs">Abu-Abu (Pending)</span>
                  </button>

                  {/* Option 2: Lolos */}
                  <button
                    type="button"
                    onClick={() => setEditStatus("lolos")}
                    className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                      editStatus === "lolos"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-black shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">LOLOS Semifinal</span>
                  </button>

                  {/* Option 3: Tidak Lolos */}
                  <button
                    type="button"
                    onClick={() => setEditStatus("tidak_lolos")}
                    className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                      editStatus === "tidak_lolos"
                        ? "border-rose-500 bg-rose-50 text-rose-900 font-black shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-500"
                    }`}
                  >
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span className="text-xs">Tidak Lolos</span>
                  </button>

                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                  *Jika memilih <strong>Abu-Abu</strong>, di layar peserta kartu pengumuman akan menampilkan status dalam proses penilaian (belum ada hasil).
                </p>
              </div>

              {/* Nilai / Skor */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Nilai / Skor CBT (Opsional):
                </label>
                <input
                  type="text"
                  value={editScore}
                  onChange={(e) => setEditScore(e.target.value)}
                  placeholder="Contoh: 87.5 atau 850"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {/* Peringkat / Ranking */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Peringkat / Keterangan Rank (Opsional):
                </label>
                <input
                  type="text"
                  value={editRank}
                  onChange={(e) => setEditRank(e.target.value)}
                  placeholder="Contoh: Peringkat 3 Tingkat Provinsi / Top 5%"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {/* Catatan Juri */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Dewan Juri untuk Peserta:
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Contoh: Selamat! Pertahankan performa untuk babak Semifinal Nasional. Unduh berkas briefing di tautan..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                />
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveResult}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Menyimpan..." : "Simpan & Publikasikan"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
