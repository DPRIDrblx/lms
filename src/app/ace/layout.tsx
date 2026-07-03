"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, UserCircle2, Briefcase, CalendarCheck, ShieldCheck, FileSignature, BookOpen, GraduationCap, CalendarClock, Receipt, Scale, TrendingUp, Wallet, Activity, LayoutGrid, X, Users, AlertCircle, MonitorCheck, MapPin, Book, Search, Bell, CheckCheck } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { getACEServices } from "@/lib/ace-services";

export default function ACELayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hodMode, setHodMode] = useState(false);
  const [assessmentMode, setAssessmentMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Notification and Search state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

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
    setIsNotifOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Fetch notifications
  useEffect(() => {
    if (!profile) return;
    const fetchNotifs = async () => {
      const { data } = await supabase.from('ace_notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
      if (data) setNotifications(data);
    };
    fetchNotifs();
  }, [profile, supabase]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('ace_notifications').update({ is_read: true }).eq('user_id', profile.id);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

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

  // Build the services grid based on role using the helper
  const baseServices = getACEServices(profile);
  
  // Prepend Beranda and Append IGNITE
  const services = [
    { href: "/ace", label: "Beranda", icon: LayoutGrid, bg: "bg-slate-800" },
    ...baseServices,
    { href: "/dashboard", label: "IGNITE", icon: MonitorCheck, bg: "bg-indigo-400" }
  ];

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] relative font-sans overflow-x-hidden">
      {/* Top Header/Navbar */}
      {pathname !== "/ace/auth" && (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black shadow-sm">
                A
              </div>
              <div>
                <h1 className="font-bold text-slate-800 tracking-tight leading-tight">Ruang ACE</h1>
                <p className="text-[10px] text-slate-500 font-medium">Academic & Educator Center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <h3 className="font-bold text-slate-800">Notifikasi ({unreadCount})</h3>
                      <button onClick={markAllRead} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> Tandai Dibaca
                      </button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs font-medium">Tidak ada notifikasi</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={cn("p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors", !n.is_read ? "bg-blue-50/30" : "")}>
                            <h4 className="text-xs font-bold text-slate-800 mb-1">{n.title}</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="h-6 w-px bg-slate-200 mx-1"></div>
              <div className="flex items-center gap-2 pl-1 cursor-pointer">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-700 leading-tight">{profile.full_name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{profile.role}</p>
                </div>
                <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                  <UserCircle2 className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className={cn("w-full min-h-screen", pathname === "/ace/auth" ? "bg-slate-900" : "")}>
        <main className={cn("mx-auto h-full max-w-7xl", pathname === "/ace/auth" ? "p-0" : "p-4 md:p-6 lg:p-8 pb-28")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
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
                    {service.label.split(' ').map((word: string, i: number) => (
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

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-xl bg-white rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="flex items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
                <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Cari ruang atau layanan (contoh: Kinerja, Jadwal)..." 
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={() => setIsSearchOpen(false)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {services.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium">Layanan tidak ditemukan.</div>
                ) : (
                  services.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase())).map((service, idx) => (
                    <Link 
                      key={idx} 
                      href={service.href} 
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors group"
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", service.bg)}>
                        <service.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 font-bold text-slate-700 group-hover:text-blue-600 transition-colors text-sm">
                        {service.label}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
