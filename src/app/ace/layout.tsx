"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, UserCircle2, Briefcase, CalendarCheck, ShieldCheck, FileSignature, BookOpen, GraduationCap, CalendarClock, Receipt, Scale, TrendingUp, Wallet, Activity, Menu, X } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ACELayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hodMode, setHodMode] = useState(false);
  const [assessmentMode, setAssessmentMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/login");
    }
  }, [profile, loading, router]);

  useEffect(() => {
    if (pathname.startsWith('/ace/hod')) {
      setHodMode(true);
      setAssessmentMode(false);
    } else if (pathname.startsWith('/ace/assessment')) {
      setAssessmentMode(true);
      setHodMode(false);
    } else {
      setHodMode(false);
      setAssessmentMode(false);
    }
  }, [pathname]);

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

  const teacherNavItems = [
    { href: "/ace", label: "Dashboard ACE", icon: Briefcase },
    { href: "/ace/profil", label: "Profil & Portofolio", icon: UserCircle2 },
    { href: "/ace/kinerja", label: "E-Kinerja & Supervisi", icon: FileSignature },
    { href: "/ace/kehadiran", label: "Presensi & Dinas Luar", icon: CalendarCheck },
    { href: "/ace/diklat", label: "Diklat & Sertifikasi", icon: GraduationCap },
    { href: "/ace/jadwal", label: "Jadwal KBM", icon: CalendarClock },
    { href: "/ace/kesejahteraan", label: "Kesejahteraan", icon: Receipt },
    { href: "/ace/helpdesk", label: "Helpdesk & Tiket", icon: ShieldCheck },
  ];

  const tuNavItems = [
    { href: "/ace/tu/kepegawaian", label: "TU Kepegawaian", icon: UserCircle2 },
    { href: "/ace/tu/kehadiran", label: "TU Kurikulum & Umum", icon: CalendarCheck },
    { href: "/ace/tu/kinerja", label: "TU Kepegawaian & Kepsek", icon: FileSignature },
    { href: "/ace/tu/keuangan", label: "TU Keuangan / Bendahara", icon: Receipt },
    { href: "/ace/tu/helpdesk", label: "Dashboard Utama TU", icon: ShieldCheck },
  ];

  const principalNavItems = [
    { href: "/ace/principal/otorisasi", label: "Otorisasi Hukum & Mutasi", icon: Scale },
    { href: "/ace/principal/izin", label: "Otorisasi Cuti & Dinas", icon: CalendarCheck },
    { href: "/ace/principal/mutu", label: "Rapor Mutu Guru", icon: TrendingUp },
    { href: "/ace/principal/keuangan", label: "Pengawasan Anggaran", icon: Wallet },
    { href: "/ace/principal/akuntabilitas", label: "Akuntabilitas TU", icon: Activity },
  ];

  const hodNavItems = [
    { href: "/ace/hod/kurikulum", label: "Kurikulum & RPP", icon: BookOpen },
    { href: "/ace/hod/izin", label: "Otorisasi Cuti", icon: CalendarCheck },
    { href: "/ace/hod/supervisi", label: "Supervisi Klinis", icon: TrendingUp },
    { href: "/ace/hod/akademik", label: "Kesenjangan Nilai", icon: Activity },
    { href: "/ace/hod/inventaris", label: "Sarana & Prasarana", icon: Wallet },
  ];

  const assessmentNavItems = [
    { href: "/ace/assessment/brankas", label: "Brankas Soal Ujian", icon: ShieldCheck },
    { href: "/ace/assessment/distribusi", label: "Tenggat Nilai", icon: CalendarClock },
    { href: "/ace/assessment/validasi", label: "Validasi Anomali", icon: Activity },
    { href: "/ace/assessment/konsol", label: "Konsol Rapor", icon: FileSignature },
    { href: "/ace/assessment/evaluasi", label: "Arsip Rubrik", icon: BookOpen },
  ];

  const navItems = isPrincipal ? principalNavItems : isTU ? tuNavItems : (profile.is_hod && hodMode ? hodNavItems : (profile.is_assessment_head && assessmentMode ? assessmentNavItems : teacherNavItems));

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Mobile Header */}
      {pathname !== "/ace/auth" && (
        <div className="md:hidden flex items-center justify-between bg-slate-900 text-white p-4 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">
              A
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Ruang ACE</h1>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      )}

      {/* ACE Sidebar */}
      {pathname !== "/ace/auth" && (
        <>
          <div className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-full border-r border-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 md:static",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}>
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">Ruang ACE</h1>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Educator Center</p>
              </div>
            </div>
          </div>

          {(profile?.is_hod || profile?.is_assessment_head) && (
            <div className="px-3 pt-4">
              <div className="p-1 bg-slate-800 rounded-lg flex text-[10px] font-bold uppercase tracking-wider overflow-x-auto hide-scrollbar">
                <button 
                  onClick={() => router.push('/ace')}
                  className={cn("px-3 py-1.5 rounded-md text-center transition-colors flex-shrink-0", !hodMode && !assessmentMode ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200")}
                >
                  Guru
                </button>
                {profile?.is_hod && (
                  <button 
                    onClick={() => router.push('/ace/hod/kurikulum')}
                    className={cn("px-3 py-1.5 rounded-md text-center transition-colors flex-shrink-0", hodMode ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200")}
                  >
                    HoD
                  </button>
                )}
                {profile?.is_assessment_head && (
                  <button 
                    onClick={() => router.push('/ace/assessment/brankas')}
                    className={cn("px-3 py-1.5 rounded-md text-center transition-colors flex-shrink-0", assessmentMode ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200")}
                  >
                    Asesmen
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/ace" && pathname.startsWith(item.href));
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors group",
                    isActive 
                      ? "bg-indigo-600/10 text-indigo-400" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="flex items-center gap-3 mb-4">
              <UserCircle2 className="w-8 h-8 text-slate-500" />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-200 truncate">{profile.full_name}</p>
                <p className="text-xs text-slate-500 font-medium">{profile.role}</p>
              </div>
            </div>
            <Link 
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-2 mb-2 rounded-lg bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Kembali ke IGNITE
            </Link>
            <button 
              onClick={() => signOut()}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 font-medium text-xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
          </div>
        </>
      )}

      {/* Overlay for mobile */}
      {isMobileMenuOpen && pathname !== "/ace/auth" && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={cn("flex-1 h-full overflow-y-auto", pathname === "/ace/auth" ? "bg-slate-900" : "bg-slate-50")}>
        <main className={cn("max-w-7xl mx-auto h-full", pathname === "/ace/auth" ? "p-0" : "p-4 md:p-6 lg:p-8")}>
          {children}
        </main>
      </div>
    </div>
  );
}
