"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, User, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";

export default function OperatorTutorsPage() {
  const supabase = createClient();
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fetchTutors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "tutor")
      .order("created_at", { ascending: false });
      
    if (data) setTutors(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  const handleAddTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error("Mohon isi semua data yang diperlukan.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Membuat akun tutor...");
    
    try {
      const response = await fetch("/api/admin/create-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          users: [{ full_name: fullName, email, password, role: "tutor" }] 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat akun tutor.");
      }

      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].error);
      }

      toast.success("Akun Tutor berhasil dibuat!", { id: toastId });
      setIsModalOpen(false);
      setFullName("");
      setEmail("");
      setPassword("");
      fetchTutors();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manajemen Tutor</h1>
          <p className="text-slate-500 font-medium">Tambah dan kelola akun tutor pengajar.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-6">
          <UserPlus className="w-5 h-5 mr-2" /> Tambah Tutor
        </Button>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : tutors.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">Belum ada tutor terdaftar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map(tutor => (
            <Card key={tutor.id} className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{tutor.full_name}</h3>
                <p className="text-sm text-slate-500 capitalize">{tutor.role}</p>
                <p className="text-xs text-slate-400 mt-2">Dibuat: {new Date(tutor.created_at).toLocaleDateString('id-ID')}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Tambah Tutor Baru</h2>
            <form onSubmit={handleAddTutor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500" 
                  placeholder="Misal: Budi Santoso"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Email Akun</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500" 
                  placeholder="budi.tutor@ignite.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Password</label>
                <input 
                  type="text" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-mono" 
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setPassword(`TUTOR-${Math.floor(1000 + Math.random() * 9000)}`)} className="text-xs text-orange-500 font-bold mt-1 hover:underline">
                  Generate Password Acak
                </button>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
