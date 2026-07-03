import { BookOpen, Search, UserCircle2, Briefcase, CalendarCheck, ShieldCheck, FileSignature, Users, AlertCircle, MapPin, CalendarClock, Book, TrendingUp, MonitorCheck, LayoutGrid, CheckSquare, BarChart3, Wallet, Mail, FileText, ClipboardList } from "lucide-react";

export function getACEServices(profile: any) {
  if (!profile) return [];

  const role = profile.role;
  const isHod = profile.is_hod;
  
  let services: any[] = [];

  if (role === 'teacher') {
    services = [
      { href: "/ace/kinerja", label: "Ruang Kinerja", icon: FileSignature, bg: "bg-blue-500", text: "text-white" },
      { href: "/ace/jadwal", label: "Ruang KBM", icon: CalendarClock, bg: "bg-orange-500", text: "text-white" },
      { href: "/ace/kehadiran", label: "Ruang Absensi", icon: MapPin, bg: "bg-teal-500", text: "text-white" },
      { href: "/student-feedback", label: "Ruang Siswa", icon: Users, bg: "bg-fuchsia-500", text: "text-white" },
      { href: "/ace/diklat", label: "Ruang Diklat", icon: Book, bg: "bg-rose-500", text: "text-white" },
    ];
  } else if (role === 'principal') {
    services = [
      { href: "/ace/principal/akuntabilitas", label: "Akuntabilitas", icon: LayoutGrid, bg: "bg-emerald-600", text: "text-white" },
      { href: "/ace/principal/izin", label: "Persetujuan Cuti", icon: CheckSquare, bg: "bg-teal-500", text: "text-white" },
      { href: "/ace/principal/mutu", label: "Mutu Pendidikan", icon: BarChart3, bg: "bg-blue-600", text: "text-white" },
      { href: "/ace/principal/keuangan", label: "Laporan Keuangan", icon: Wallet, bg: "bg-amber-600", text: "text-white" },
    ];
  } else if (role === 'tu') {
    services = [
      { href: "/ace/tu/kepegawaian", label: "Kepegawaian", icon: Briefcase, bg: "bg-blue-700", text: "text-white" },
      { href: "/ace/tu/keuangan", label: "Keuangan", icon: Wallet, bg: "bg-emerald-500", text: "text-white" },
      { href: "/ace/tu/kehadiran", label: "Kehadiran", icon: MapPin, bg: "bg-orange-500", text: "text-white" },
      { href: "/ace/tu/kinerja", label: "Kinerja", icon: FileSignature, bg: "bg-purple-600", text: "text-white" },
    ];
  }

  // If the user is also a HoD (usually teachers)
  if (isHod) {
    services.push(
      { href: "/ace/hod/akademik", label: "Akademik HoD", icon: LayoutGrid, bg: "bg-indigo-600", text: "text-white" },
      { href: "/ace/hod/kurikulum", label: "Manajemen Kurikulum", icon: TrendingUp, bg: "bg-indigo-500", text: "text-white" },
      { href: "/ace/hod/supervisi", label: "Supervisi Akademik", icon: FileText, bg: "bg-blue-600", text: "text-white" }
    );
  }
  
  // Base services for everyone
  const sharedServices = [
    { href: "/ace/profil", label: "Ruang Profil", icon: UserCircle2, bg: "bg-slate-700", text: "text-white" },
    { href: "/ace/helpdesk", label: "Ruang Bantuan", icon: AlertCircle, bg: "bg-sky-500", text: "text-white" },
  ];

  return [...services, ...sharedServices];
}
