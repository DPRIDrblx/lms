"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Sidebar />
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
