"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LogOut, UserCircle2, Briefcase, CalendarCheck, ShieldCheck, FileSignature, BookOpen } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ACELayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/login");
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!profile) return null;

  // Protect route
  if (profile.role !== "teacher" && profile.role !== "principal" && profile.role !== "tu") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Akses Ditolak</h1>
          <p className="text-slate-600 mb-6">Ruang ACE khusus untuk Guru, Kepala Sekolah, dan TU.</p>
          <Link href="/dashboard" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">
            Kembali ke IGNITE
          </Link>
        </div>
      </div>
    );
  }

  const isPrincipal = profile.role === "principal";
  const isTU = profile.role === "tu";

  const navItems = [
    { href: "/ace", label: "Dashboard ACE", icon: Briefcase },
    { href: "/ace/kinerja", label: "E-Kinerja", icon: FileSignature },
    { href: "/ace/kehadiran", label: "Presensi & Cuti", icon: CalendarCheck },
  ];

  if (isPrincipal) {
    navItems.push({ href: "/ace/persetujuan", label: "Persetujuan", icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* ACE Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white font-black shadow-lg">
              A
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Ruang ACE</h1>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Educator Center</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/ace" && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400")} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <UserCircle2 className="w-10 h-10 text-slate-400" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-slate-500 uppercase font-black">{profile.role}</p>
            </div>
          </div>
          <Link 
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-2.5 mb-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Kembali ke IGNITE
          </Link>
          <button 
            onClick={() => signOut()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-sm hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
