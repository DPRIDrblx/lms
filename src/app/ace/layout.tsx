"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, UserCircle2, Briefcase, CalendarCheck, ShieldCheck, FileSignature, BookOpen, GraduationCap, CalendarClock, Receipt, Scale, TrendingUp, Wallet, Activity, LayoutGrid, X, Users, AlertCircle, MonitorCheck, MapPin, Book } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ACELayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hodMode, setHodMode] = useState(false);
  const [assessmentMode, setAssessmentMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    // Close menu on navigation
    setIsMenuOpen(false);
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

  // Build the services grid based on role
  const services = [
    { href: "/ace", label: "Beranda", icon: LayoutGrid, bg: "bg-slate-800" },
    { href: "/ace/kinerja", label: "Ruang Kinerja", icon: FileSignature, bg: "bg-blue-500" },
    { href: "/ace/jadwal", label: "Ruang KBM", icon: CalendarClock, bg: "bg-orange-500" },
    { href: "/ace/kehadiran", label: "Ruang Absensi", icon: MapPin, bg: "bg-teal-500" },
    { href: "/ace/profil", label: "Ruang Profil", icon: UserCircle2, bg: "bg-amber-700" },
  ];

  if (isPrincipal) {
    services.push({ href: "/ace/principal/izin", label: "Ruang Kepsek", icon: ShieldCheck, bg: "bg-emerald-600" });
  } else if (isTU) {
    services.push({ href: "/ace/tu/kepegawaian", label: "Ruang TU", icon: Briefcase, bg: "bg-slate-700" });
  }
  
  if (profile.is_hod) {
    services.push({ href: "/ace/hod/kurikulum", label: "Ruang HoD", icon: TrendingUp, bg: "bg-indigo-600" });
  }

  services.push(
    { href: "/ace/diklat", label: "Ruang Diklat", icon: Book, bg: "bg-rose-500" },
    { href: "/student-feedback", label: "Ruang Siswa", icon: Users, bg: "bg-fuchsia-500" },
    { href: "/ace/helpdesk", label: "Ruang Bantuan", icon: AlertCircle, bg: "bg-sky-500" },
    { href: "/dashboard", label: "IGNITE", icon: MonitorCheck, bg: "bg-indigo-400" }
  );

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] relative font-sans overflow-x-hidden">
      {/* Main Content Area */}
      <div className={cn("w-full min-h-screen", pathname === "/ace/auth" ? "bg-slate-900" : "")}>
        <main className={cn("mx-auto h-full", pathname === "/ace/auth" ? "p-0" : "p-0 pb-24")}>
          {children}
        </main>
      </div>

      {/* Floating Action Button */}
      {pathname !== "/ace/auth" && (
        <div className="fixed bottom-6 right-6 z-40">
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="w-14 h-14 bg-[#0f4b8f] rounded-full shadow-2xl shadow-blue-900/30 flex items-center justify-center text-white hover:bg-blue-800 hover:scale-105 transition-all focus:outline-none"
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Floating Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="bg-white w-full sm:w-auto sm:min-w-[600px] sm:max-w-3xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 sm:zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-800">Layanan Ruang ACE</h2>
                <p className="text-sm font-medium text-slate-500">Pilih ruang yang ingin Anda kunjungi</p>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)} 
                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-y-6 gap-x-2">
              {services.map((service, idx) => (
                <Link key={idx} href={service.href} className="flex flex-col items-center text-center group">
                  <div className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform`}>
                    <service.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 leading-tight w-full px-1">
                    {service.label.split(' ').map((word, i) => (
                      <span key={i} className="block">{word}</span>
                    ))}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <UserCircle2 className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{profile.full_name}</p>
                  <p className="text-xs text-slate-500 font-medium capitalize">{profile.role}</p>
                </div>
              </div>
              <button 
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-500 font-bold text-sm hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
