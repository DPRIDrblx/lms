"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function VerificationsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [pendingAccounts, setPendingAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.role !== "tu") {
      router.push("/dashboard");
      return;
    }

    const fetchPending = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "principal")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (data) setPendingAccounts(data);
      setLoading(false);
    };

    if (profile) fetchPending();
  }, [profile, router, supabase]);

  const handleVerification = async (id: string, newStatus: "approved" | "rejected") => {
    const toastId = toast.loading("Memproses...");
    
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error(`Gagal: ${error.message}`, { id: toastId });
    } else {
      toast.success(newStatus === "approved" ? "Akun disetujui!" : "Akun ditolak!", { id: toastId });
      setPendingAccounts(prev => prev.filter(acc => acc.id !== id));
    }
  };

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Verifikasi Akun Eksekutif</h1>
          <p className="text-[var(--text-secondary)] mt-1">Persetujuan untuk pendaftaran akun Kepala Sekolah baru.</p>
        </div>
      </header>

      {pendingAccounts.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] bg-transparent shadow-none">
          <ShieldAlert className="h-12 w-12 text-[var(--text-tertiary)] mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Tidak ada akun yang menunggu verifikasi</h3>
          <p className="text-[var(--text-secondary)] mt-2">Semua permintaan pendaftaran sudah ditangani.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingAccounts.map(acc => (
            <Card key={acc.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">
                  {acc.full_name?.charAt(0).toUpperCase() || "K"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{acc.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                      Kepala Sekolah
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Mendaftar: {new Date(acc.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  className="flex-1 sm:flex-none border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  onClick={() => handleVerification(acc.id, "rejected")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak
                </Button>
                <Button 
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                  onClick={() => handleVerification(acc.id, "approved")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Setujui
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
