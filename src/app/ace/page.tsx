"use client";

import { useAuth } from "@/lib/auth-context";
import { BookOpen, Search, UserCircle2, Briefcase, CalendarCheck, ShieldCheck, FileSignature, Users, AlertCircle, MapPin, CalendarClock, Book, TrendingUp, MonitorCheck } from "lucide-react";
import Link from "next/link";

export default function ACEDashboard() {
  const { profile } = useAuth();
  
  if (!profile) return null;

  // Grid services based on the Rumah Pendidikan UI screenshot
  const services = [
    { href: "/ace/kinerja", label: "Ruang Kinerja", icon: FileSignature, bg: "bg-blue-500", text: "text-white" },
    { href: "/ace/jadwal", label: "Ruang KBM", icon: CalendarClock, bg: "bg-orange-500", text: "text-white" },
    { href: "/ace/kehadiran", label: "Ruang Absensi", icon: MapPin, bg: "bg-teal-500", text: "text-white" },
    { href: "/ace/profil", label: "Ruang Profil", icon: UserCircle2, bg: "bg-amber-700", text: "text-white" },
  ];

  // Additional services based on role
  if (profile.role === 'principal') {
    services.push(
      { href: "/ace/principal/izin", label: "Ruang Kepsek", icon: ShieldCheck, bg: "bg-emerald-600", text: "text-white" }
    );
  } else if (profile.role === 'tu') {
    services.push(
      { href: "/ace/tu/kepegawaian", label: "Ruang TU", icon: Briefcase, bg: "bg-slate-700", text: "text-white" }
    );
  }
  
  if (profile.is_hod) {
    services.push(
      { href: "/ace/hod/kurikulum", label: "Ruang HoD", icon: TrendingUp, bg: "bg-indigo-600", text: "text-white" }
    );
  }

  // Fill up the rest with generic/placeholder services to make it look like the 8-grid in the screenshot
  const defaultFillers = [
    { href: "/ace/diklat", label: "Ruang Diklat", icon: Book, bg: "bg-rose-500", text: "text-white" },
    { href: "/student-feedback", label: "Ruang Siswa", icon: Users, bg: "bg-fuchsia-500", text: "text-white" },
    { href: "/ace/helpdesk", label: "Ruang Bantuan", icon: AlertCircle, bg: "bg-sky-500", text: "text-white" },
    { href: "/ace", label: "Ruang Mitra", icon: MonitorCheck, bg: "bg-indigo-400", text: "text-white" },
  ];

  // Append fillers until we have 8 items
  for (const filler of defaultFillers) {
    if (services.length < 8) {
      services.push(filler);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-full pb-10 shadow-sm rounded-3xl overflow-hidden border border-slate-100">
      
      {/* Header */}
      <div className="bg-slate-50 p-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800">Halo, {profile.full_name?.split(' ')[0]}</h1>
            <p className="text-xs font-medium text-slate-500">Selamat datang di <span className="font-bold text-slate-700">Rumah Pendidikan</span></p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input 
            type="text" 
            placeholder="Cari Layanan.." 
            className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
          />
          <button className="px-4 border-l border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors">
            <Search className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Banner Carousel */}
      <div className="px-6 mb-6">
        <div className="bg-[#0f4b8f] rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
          {/* Decorative background elements */}
          <div className="absolute top-4 right-4 w-12 h-4 bg-emerald-400/80 rounded-sm"></div>
          <div className="absolute bottom-4 right-8 w-16 h-4 bg-emerald-400/80 rounded-sm"></div>
          <div className="absolute top-1/2 right-6 w-8 h-8 border-4 border-emerald-400/80 rounded-sm"></div>
          
          <div className="relative z-10 w-2/3">
            <h2 className="text-xl font-black mb-2 leading-tight">Data Rapor Pendidikan IGNITE Terbaru Telah Dirilis</h2>
            <p className="text-[10px] text-blue-100 mb-4 leading-relaxed">
              Mari akses dan manfaatkan Rapor Pendidikan sebagai upaya gotong royong menuju pendidikan bermutu untuk semua
            </p>
            <button className="bg-white text-[#0f4b8f] text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-blue-50 transition-colors">
              Akses Sekarang
            </button>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          <div className="w-2.5 h-2.5 rounded-full border border-slate-300 bg-transparent"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white pt-6 px-6 pb-8 border-t border-slate-100">
        <h2 className="text-lg font-black text-slate-800 mb-6">Jelajahi Ruang di Rumah Pendidikan</h2>
        
        {/* Grid Icons */}
        <div className="grid grid-cols-4 gap-y-8 gap-x-2">
          {services.map((service, idx) => (
            <Link key={idx} href={service.href} className="flex flex-col items-center text-center group">
              <div className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform`}>
                <service.icon className={`w-7 h-7 ${service.text}`} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-slate-600 leading-tight w-full px-1">
                {service.label.split(' ').map((word, i) => (
                  <span key={i} className="block">{word}</span>
                ))}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-slate-50 px-6 py-8 border-t border-slate-100">
        <h2 className="text-lg font-black text-slate-800 mb-4">Layanan Pilihanmu</h2>
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-fuchsia-100 rounded-xl flex items-center justify-center shrink-0 border border-fuchsia-200 relative">
              <UserCircle2 className="w-6 h-6 text-fuchsia-600" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                <div className="w-2 h-2 border-b-2 border-r-2 border-white transform rotate-45 -mt-0.5"></div>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-700 leading-snug">
              Akses cepat layanan pilihanmu langsung dari Beranda
            </p>
          </div>
          <button className="w-full py-3 bg-[#2a2a2a] text-white text-sm font-bold rounded-xl hover:bg-black transition-colors">
            Pilih Layananmu
          </button>
        </div>
      </div>

    </div>
  );
}
