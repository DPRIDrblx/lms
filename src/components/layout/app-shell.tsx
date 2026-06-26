"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";
import { StudentSidebar } from "./student-sidebar";
import { StudentTopBar } from "./student-top-bar";
import { ClassGuard } from "./class-guard";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useAuth();
  const supabase = createClient();
  const isExam = pathname?.includes("/exam");

  useEffect(() => {
    if (!loading && profile?.force_password_change) {
      router.push("/auth/change-password");
    }
  }, [profile, loading, router]);

  if (profile?.status === "pending") {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[var(--border)]">
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Menunggu Verifikasi</h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Akun Kepala Sekolah Anda sedang dalam proses peninjauan oleh Tata Usaha. Anda akan dapat mengakses sistem setelah disetujui.
          </p>
          <Button 
            variant="secondary" 
            className="w-full text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50 border border-red-200"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" /> Keluar
          </Button>
        </div>
      </div>
    );
  }

  if (isExam) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  if (profile?.role === "student") {
    return (
      <div className="min-h-screen bg-slate-50 text-[var(--text-primary)] pb-24 lg:pb-0">
        <StudentSidebar />
        <div className="lg:pl-[260px] flex flex-col min-h-screen">
          <StudentTopBar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
            <ClassGuard>
              {children}
            </ClassGuard>
          </main>
        </div>
      </div>
    );
  }

  // Legacy layout for Teacher/Principal/Admin
  return (
    <div className="min-h-screen saas-bg print:bg-white text-[var(--text-primary)]">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="lg:pl-[260px] flex flex-col min-h-screen print:pl-0 print:block">
        <div className="print:hidden">
          <TopBar />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full print:p-0 print:m-0">
          <ClassGuard>
            {children}
          </ClassGuard>
        </main>
      </div>
    </div>
  );
}
