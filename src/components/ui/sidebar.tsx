"use client";

import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
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
  MessageSquare
} from "lucide-react";
import { useState } from "react";

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
  { href: "/teacher/quizzes", label: "CBT Builder", icon: Award },
  { href: "/teacher/grading/offline", label: "Excel Gradebook", icon: FileText },
  { href: "/attendance/qr/teacher", label: "QR Sessions", icon: QrCode },
  { href: "/settings", label: "Settings", icon: Settings },
];

const parentNav = [
  { href: "/parent/dashboard", label: "My Children", icon: Users },
  { href: "/parent/finance", label: "School Fees", icon: Wallet },
  { href: "/chat", label: "Communications", icon: MessageSquare },
  { href: "/parent/cards", label: "Child Wallet", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

const tuNav = [
  { href: "/tu/dashboard", label: "Staff Portal", icon: LayoutDashboard },
  { href: "/tu/classroom-manager", label: "Classroom Manager", icon: Users },
  { href: "/chat", label: "Communications", icon: MessageSquare },
  { href: "/tu/finance", label: "Financial Hub", icon: CreditCard },
  { href: "/tu/reports", label: "Report Cards", icon: FileText },
  { href: "/tu/cards", label: "Card Inventory", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { profile } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = 
    profile?.role === "teacher" ? teacherNav : 
    profile?.role === "parent" ? parentNav : 
    profile?.role === "tu" ? tuNav :
    studentNav;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">Nusantara</h1>
            <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">International Academy</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-3 pb-2 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[var(--accent-light)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      {profile && (
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-xs font-semibold text-[var(--accent)]">
                {getInitials(profile.full_name || "U")}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{profile.full_name}</p>
              <p className="text-xs text-[var(--text-tertiary)] capitalize">{profile.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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
              className="fixed inset-y-0 left-0 w-[260px] bg-[var(--bg-primary)] border-r border-[var(--border)] z-50 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--text-secondary)]" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[260px] min-h-screen bg-[var(--bg-primary)] border-r border-[var(--border)] fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
