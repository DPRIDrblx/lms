"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";
import { ClassGuard } from "./class-guard";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExam = pathname?.includes("/exam");

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
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Sidebar />
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <ClassGuard>
            {children}
          </ClassGuard>
        </main>
      </div>
    </div>
  );
}
