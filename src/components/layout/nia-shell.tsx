"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { showLogo } from "@/lib/utils";
import { Sparkles, BookOpen, User, LogOut, Menu, X, LayoutDashboard, Settings, MapPin, CreditCard, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NiaShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Role based navigation
  const navItems = [
    { name: "Dashboard", href: profile?.role === "operator_les" ? "/operator-les" : profile?.role === "pengurus_nia" ? "/pengurus-nia" : profile?.role === "tutor" ? "/tutor" : "/sobat-nia", icon: LayoutDashboard },
    ...(profile?.role === "sobat_nia" ? [
      { name: "Materi Saya", href: "/sobat-nia/courses", icon: BookOpen },
    ] : []),
    ...(profile?.role === "tutor" ? [
      { name: "Jadwal Ajar", href: "/tutor/schedules", icon: BookOpen },
      { name: "Materi Modul", href: "/tutor/modules", icon: BookOpen },
      { name: "Klinik Tutor", href: "/tutor/klinik", icon: BookOpen },
    ] : []),
    ...(profile?.role === "pengurus_nia" ? [
      { name: "Manajemen Materi", href: "/pengurus-nia/courses", icon: BookOpen },
    ] : []),
    ...(profile?.role === "operator_les" ? [
      { name: "Laporan Kelas", href: "/operator-les/reports", icon: BookOpen },
      { name: "Manajemen Paket", href: "/operator-les/packages", icon: BookOpen },
      { name: "Persetujuan Pembayaran", href: "/operator-les/payments", icon: CreditCard },
      { name: "Cabang Center", href: "/operator-les/branches", icon: MapPin },
      { name: "Promo Voucher", href: "/operator-les/promos", icon: Sparkles },
      { name: "Manajemen Tutor", href: "/operator-les/tutors", icon: User },
      { name: "Klinik Tutor", href: "/operator-les/klinik", icon: BookOpen },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 shadow-sm fixed h-full z-40">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-1">
          {showLogo(profile?.class_name) ? (
            <img src="/logo-nia-tutoring.png" alt="NIA Tutoring" className="h-12 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-black text-xl text-slate-900 tracking-tight">NIA Tutoring <span className="text-blue-600">AKSES</span></h1>
              </div>
            </div>
          )}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mt-1">{profile?.role?.replace('_', ' ')}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 m-2.5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-slate-500 capitalize">{profile?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 w-full h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showLogo(profile?.class_name) ? (
            <img src="/logo-nia-tutoring.png" alt="NIA Tutoring" className="h-8 w-auto object-contain" />
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg text-slate-900">NIA Tutoring <span className="text-blue-600">AKSES</span></span>
            </>
          )}
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-slate-600">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-0 z-40 bg-white pt-20 pb-6 px-6 overflow-y-auto flex flex-col"
          >
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-lg transition-all ${
                      isActive ? "bg-orange-50 text-orange-600" : "text-slate-600"
                    }`}>
                      <item.icon className="w-6 h-6" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <button 
                onClick={() => signOut()}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 text-red-600 font-bold bg-red-50 rounded-2xl"
              >
                <LogOut className="w-6 h-6" /> Keluar dari Akun
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
