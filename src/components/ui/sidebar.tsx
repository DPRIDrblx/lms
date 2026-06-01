"use client";

import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  ScanFace,
  QrCode,
  Users,
  Menu,
  X,
  GraduationCap,
  Award,
  Wallet,
  Calendar,
  FileText,
  Settings,
  MessageSquare,
  LogOut,
  ShieldAlert,
  Building
} from "lucide-react";
import { useState, useEffect } from "react";

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/chat", label: "Communications", icon: MessageSquare },
  { href: "/finance", label: "Finance & Bills", icon: CreditCard },
  { href: "/attendance/ai", label: "AI Attendance", icon: ScanFace },
  { href: "/attendance/qr/student", label: "QR Check-in", icon: QrCode },
  { href: "/settings", label: "Settings", icon: Settings },
];

const teacherNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/classroom", label: "Classroom", icon: Users },
  { href: "/teacher/homeroom", label: "Homeroom Authority", icon: Award },
  { href: "/chat", label: "Communications", icon: MessageSquare },
  { href: "/teacher/courses", label: "Content Suite", icon: BookOpen },
  { href: "/teacher/journal", label: "Jurnal Mengajar", icon: FileText },
  { href: "/teacher/quizzes", label: "CBT Builder", icon: Award },
  { href: "/teacher/grading/offline", label: "Excel Gradebook", icon: FileText },
  { href: "/attendance/qr/teacher", label: "QR Sessions", icon: QrCode },
  { href: "/settings", label: "Settings", icon: Settings },
];

const parentNav = [
  { href: "/parent/dashboard", label: "My Children", icon: Users },
  { href: "/parent/finance", label: "School Fees", icon: Wallet },
  { href: "/chat", label: "Communications", icon: MessageSquare },
  { href: "/parent/reports", label: "Academic Reports", icon: FileText },
  { href: "/parent/cards", label: "Child Wallet", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

const tuNav = [
  { href: "/tu/dashboard", label: "Staff Portal", icon: LayoutDashboard },
  { href: "/tu/classroom-manager", label: "Classroom Manager", icon: Users },
  { href: "/chat", label: "Communications", icon: MessageSquare },
  { href: "/tu/finance", label: "Financial Hub", icon: CreditCard },
  { href: "/tu/reports", label: "Report Cards", icon: FileText },
  { href: "/tu/account-generator", label: "Account Generator", icon: Users },
  { href: "/tu/cards", label: "Card Inventory", icon: CreditCard },
  { href: "/tu/classes", label: "Classroom", icon: Building },
  { href: "/tu/verifications", label: "Verifikasi Akun", icon: ShieldAlert },
  { href: "/settings", label: "Settings", icon: Settings },
];

const principalNav = [
  { href: "/principal", label: "SIMS Dashboard", icon: LayoutDashboard },
  { href: "/principal/journals", label: "Jurnal Mengajar", icon: BookOpen },
  { href: "/principal/attendances", label: "Rekap Absensi", icon: Users },
  { href: "/chat", label: "Communications", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { profile } = useAuth();
  const pathname = usePathname();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHomeroom, setIsHomeroom] = useState(false);

  useEffect(() => {
    if (profile?.role === 'teacher') {
      supabase.from("classes").select("id").or(`wali_kelas_id.eq.${profile.id},co_homeroom_id.eq.${profile.id},supervisor_id.eq.${profile.id}`).limit(1)
        .then(({ data }: any) => { if (data && data.length > 0) setIsHomeroom(true); });
    }
  }, [profile, supabase]);

  const navItems = 
    profile?.role === "teacher" ? teacherNav.filter(item => item.href !== "/teacher/homeroom" || isHomeroom) : 
    profile?.role === "parent" ? parentNav : 
    profile?.role === "tu" ? tuNav :
    profile?.role === "principal" ? principalNav :
    studentNav;

const SidebarContent = ({ navItems, pathname, profile, setMobileOpen }: any) => {
  const isExecutive = profile?.role === "principal";

  return (
    <div className={cn("flex flex-col h-full", isExecutive ? "bg-slate-900 text-slate-300" : "bg-white")}>
      {/* Logo */}
      <div className={cn("p-5 border-b", isExecutive ? "border-slate-800" : "border-[var(--border)]")}>
        <Link href={isExecutive ? "/principal" : "/dashboard"} className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isExecutive ? "bg-amber-500" : "bg-[var(--accent)]")}>
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className={cn("text-sm font-bold leading-tight", isExecutive ? "text-white" : "text-[var(--text-primary)]")}>Nusantara</h1>
            <p className={cn("text-[10px] font-medium uppercase tracking-wider", isExecutive ? "text-amber-500" : "text-[var(--text-tertiary)]")}>
              {isExecutive ? "Executive Board" : "International Academy"}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className={cn("px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wider", isExecutive ? "text-slate-500" : "text-[var(--text-tertiary)]")}>
          Menu
        </p>
        {navItems.map((item: any) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/principal" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? (isExecutive ? "bg-amber-500/10 text-amber-500" : "bg-[var(--accent-light)] text-[var(--accent)]")
                  : (isExecutive ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]")
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      {/* User Profile */}
      <div className={cn("p-4 border-t", isExecutive ? "border-slate-800" : "border-[var(--border)]")}>
        <div className="flex items-center gap-3 px-2">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className={cn("w-10 h-10 rounded-full object-cover border-2", isExecutive ? "border-amber-500" : "border-[var(--accent)]")} />
          ) : (
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm", isExecutive ? "bg-amber-500 text-white" : "bg-[var(--accent-light)] text-[var(--accent)]")}>
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={cn("text-sm font-bold truncate", isExecutive ? "text-white" : "text-[var(--text-primary)]")}>{profile?.full_name}</h3>
            <p className={cn("text-[10px] font-medium uppercase tracking-wider truncate", isExecutive ? "text-amber-500" : "text-[var(--text-tertiary)]")}>
              {profile?.role}
            </p>
          </div>
          <button onClick={() => supabase.auth.signOut()} className={cn("p-2 rounded-lg transition-colors", isExecutive ? "text-slate-500 hover:text-red-400 hover:bg-slate-800" : "text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50")}>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-[var(--shadow-md)] lg:hidden"
      >
        <Menu className="h-5 w-5 text-[var(--text-primary)]" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[260px] bg-white border-r border-[var(--border)] z-50 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--text-secondary)]" />
              </button>
              <SidebarContent navItems={navItems} pathname={pathname} profile={profile} setMobileOpen={setMobileOpen} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[260px] min-h-screen bg-white border-r border-[var(--border)] fixed inset-y-0 left-0 z-30 print:hidden">
        <SidebarContent navItems={navItems} pathname={pathname} profile={profile} setMobileOpen={setMobileOpen} />
      </aside>
    </>
  );
}
