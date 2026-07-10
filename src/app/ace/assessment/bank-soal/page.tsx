"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Plus, Trash2, Library } from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";

export default function BankSoalPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchBanks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ace_question_banks')
      .select('*, items:ace_question_bank_items(count)')
      .order('created_at', { ascending: false });
      
    if (data) setBanks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBanks();
  }, [profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const title = prompt("Masukkan nama Paket Soal (contoh: Paket UTS Sejarah Kelas 10):", file.name.replace(/\.[^/.]+$/, ""));
    if (!title) {
      setUploading(false);
      e.target.value = '';
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Create the bank
      const { data: bankData, error: bankError } = await supabase
        .from('ace_question_banks')
        .insert({
          title,
          description: `Diimpor dari file ${file.name}`,
          created_by: profile?.id
        })
        .select()
        .single();

      if (bankError || !bankData) throw bankError;

      // Parse questions
      const itemsToInsert = jsonData.map((row) => {
        // Expected columns: Tipe Soal, Pertanyaan, Opsi A, Opsi B, Opsi C, Opsi D, Opsi E, Kunci Jawaban, Poin
        const options = [];
        const answer = String(row['Kunci Jawaban'] || '').toUpperCase().trim();
        
        if (row['Opsi A']) options.push({ text: String(row['Opsi A']), is_correct: answer === 'A' });
        if (row['Opsi B']) options.push({ text: String(row['Opsi B']), is_correct: answer === 'B' });
        if (row['Opsi C']) options.push({ text: String(row['Opsi C']), is_correct: answer === 'C' });
        if (row['Opsi D']) options.push({ text: String(row['Opsi D']), is_correct: answer === 'D' });
        if (row['Opsi E']) options.push({ text: String(row['Opsi E']), is_correct: answer === 'E' });

        return {
          bank_id: bankData.id,
          question_type: String(row['Tipe Soal'] || 'mcq').toLowerCase() === 'essay' ? 'essay' : 'mcq',
          question_text: String(row['Pertanyaan'] || ''),
          options: options,
          points: parseInt(row['Poin']) || 10
        };
      }).filter(item => item.question_text);

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from('ace_question_bank_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
        toast.success(`Berhasil mengimpor ${itemsToInsert.length} soal!`);
        fetchBanks();
      } else {
        toast.error("Tidak ada soal yang valid di file Excel.");
      }
    } catch (err: any) {
      toast.error("Gagal mengimpor: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteBank = async (id: string) => {
    if (!confirm("Yakin ingin menghapus paket soal ini?")) return;
    try {
      await supabase.from('ace_question_banks').delete().eq('id', id);
      setBanks(banks.filter(b => b.id !== id));
      toast.success("Paket soal dihapus.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!profile || !profile.is_assessment_head) return (
    <div className="p-8 text-center text-slate-500 font-medium">Anda tidak memiliki akses ke halaman ini.</div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Library className="w-7 h-7 text-blue-600" />
            Bank Soal Pusat
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Kelola dan unggah paket soal terstandarisasi untuk digunakan oleh guru.</p>
        </div>
        
        <div className="relative">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            disabled={uploading}
          />
          <Button disabled={uploading} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {uploading ? "Mengimpor..." : "Upload Excel"}
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 font-medium">
        Pastikan file Excel Anda memiliki kolom berikut di baris pertama: 
        <span className="font-bold ml-1">Tipe Soal, Pertanyaan, Opsi A, Opsi B, Opsi C, Opsi D, Opsi E, Kunci Jawaban, Poin</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat bank soal...</p>
        ) : banks.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada paket soal yang diunggah.</p>
        ) : (
          banks.map((bank) => (
            <Card key={bank.id} className="p-5 rounded-lg border shadow-sm flex flex-col h-full bg-white hover:border-blue-300 transition-all">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 text-lg line-clamp-2">{bank.title}</h3>
                <button onClick={() => deleteBank(bank.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{bank.description}</p>
              
              <div className="mt-auto bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Soal</p>
                  <p className="font-black text-xl text-blue-600">{bank.items[0]?.count || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Dibuat</p>
                  <p className="text-xs font-bold text-slate-600">{new Date(bank.created_at).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
