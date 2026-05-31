"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";
import { ClassGuard } from "./class-guard";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useAuth();
  const isExam = pathname?.includes("/exam");

  useEffect(() => {
    if (!loading && profile?.force_password_change) {
      router.push("/auth/change-password");
    }
  }, [profile, loading, router]);

  if (isExam) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="lg:pl-[260px] flex flex-col min-h-screen print:pl-0 print:block">
        <div className="print:hidden">
          <TopBar />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0 print:m-0">
          <ClassGuard>
            {children}
          </ClassGuard>
        </main>
      </div>
    </div>
  );
}
