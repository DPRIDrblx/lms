"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, Swords, User, Compass, Users, MessageCircle, ShoppingBag, Tent, ShoppingCart, Map, Menu, X, Sparkles, Timer, Notebook, Trophy, PawPrint, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { FolderOpen, Calendar, Archive, BookOpen, GraduationCap } from "lucide-react";

export function StudentSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isCenterStudent } = useAuth();
  const { uiMode } = useTheme();

  let navItems = [
    { name: "Learn", href: "/dashboard", icon: Home },
    { name: "Quests", href: "/student/quests", icon: Swords },
    { name: "Faksi & Asrama", href: "/student/faction", icon: Shield },
    { name: "Peliharaan", href: "/student/pet", icon: PawPrint },
    { name: "Gelar & Piala", href: "/student/badges", icon: Medal },
    { name: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
    { name: "Hideout", href: "/student/hideout", icon: Tent },
    { name: "Social", href: "/student/social", icon: Users },
    { name: "Messages", href: "/student/messages", icon: MessageCircle },
    { name: "Explore", href: "/courses", icon: Compass },
    { name: "Study Room", href: "/student/study-room", icon: Timer },
    { name: "Smart Notes", href: "/student/notes", icon: Notebook },
    { name: "Market", href: "/student/market", icon: ShoppingCart },
    { name: "Shop", href: "/student/shop", icon: ShoppingBag },
    { name: "Golden Hour", href: "/student/golden-hour", icon: Sparkles },
    { name: "Profile", href: "/student/profile", icon: User },
  ];

  if (isCenterStudent) {
    navItems = navItems.filter(item => item.name !== "Hideout");
    // Insert Jadwal Les and E-Modul after Explore
    const exploreIndex = navItems.findIndex(i => i.name === "Explore");
    if (exploreIndex !== -1) {
      navItems.splice(exploreIndex + 1, 0, 
        { name: "E-Modul", href: "/student/e-modul", icon: FolderOpen },
        { name: "Jadwal Les", href: "/student/jadwal-les", icon: Calendar },
        { name: "Arsip Les", href: "/student/arsip-les", icon: Archive },
        { name: "Klinik Tutor", href: "/student/klinik", icon: BookOpen }
      );
    } else {
      navItems.push(
        { name: "E-Modul", href: "/student/e-modul", icon: FolderOpen },
        { name: "Jadwal Les", href: "/student/jadwal-les", icon: Calendar },
        { name: "Arsip Les", href: "/student/arsip-les", icon: Archive },
        { name: "Klinik Tutor", href: "/student/klinik", icon: BookOpen }
      );
    }
  }

  return (
    <>
      {/* Desktop Left Sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col fixed top-0 left-0 h-screen w-[260px] bg-white z-40",
        uiMode === 'clean' ? "border-r border-slate-200" : "border-r-2 border-slate-200 p-6"
      )}>
        {uiMode === 'clean' ? (
          <div className="p-6 pb-2 border-b border-transparent">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">
                  IGNITE <br/><span className="text-emerald-500 font-black">CENTER</span>
                </h1>
              </div>
            </div>
            {isCenterStudent && (
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-block">
                Bojonegoro - Dr. Cipto
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 px-4">
            <h1 className={cn("text-3xl font-black tracking-tight", isCenterStudent ? "text-red-600" : "text-emerald-500")}>
              IGNITE {isCenterStudent && <span className="text-blue-600">Center</span>}
            </h1>
          </div>
        )}
        
        <nav className={cn(
          "flex flex-col flex-1 overflow-y-auto pb-8 scrollbar-hide",
          uiMode === 'clean' ? "py-4 gap-1 px-4" : "gap-2"
        )}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center transition-all",
                    uiMode === 'clean'
                      ? [
                          "gap-4 px-4 py-3 rounded-xl font-semibold text-base",
                          isActive 
                            ? "bg-teal-50 text-teal-700" 
                            : "text-slate-600 hover:bg-slate-50"
                        ]
                      : [
                          "gap-4 px-4 py-4 rounded-2xl font-bold text-lg border-2",
                          isActive 
                            ? (isCenterStudent ? "bg-red-100/50 border-red-200 text-red-600" : "bg-emerald-100/50 border-emerald-200 text-emerald-600")
                            : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        ]
                  )}
                >
                  <item.icon 
                    className={cn(
                      uiMode === 'clean' ? "w-5 h-5" : "w-7 h-7", 
                      isActive 
                        ? (uiMode === 'clean' ? "text-teal-600" : (isCenterStudent ? "text-red-500" : "text-emerald-500")) 
                        : (uiMode === 'clean' ? "text-teal-500/70" : "text-slate-400")
                    )} 
                    strokeWidth={isActive ? (uiMode === 'clean' ? 2 : 2.5) : 2} 
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full h-[80px] bg-white border-t-2 border-slate-200 z-50 flex items-center justify-around px-2 pb-safe">
        {navItems.filter(item => ["Learn", "Cyber Map", "Social", "Shop"].includes(item.name)).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="flex-1 flex justify-center">
              <div 
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-2xl transition-all",
                  isActive ? "bg-emerald-100/50 text-emerald-600" : "text-slate-400"
                )}
              >
                <item.icon className={cn("w-7 h-7 mb-1", isActive ? "text-emerald-500" : "text-slate-400")} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[10px] font-bold", isActive ? "text-emerald-600" : "text-slate-400")}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
        
        {/* Menu Button */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="flex-1 flex justify-center">
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all text-slate-400 hover:text-emerald-500">
             <Menu className="w-7 h-7 mb-1" strokeWidth={2} />
             <span className="text-[10px] font-bold">More</span>
          </div>
        </button>
      </div>

      {/* Mobile Full Screen Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-[60] bg-white flex flex-col lg:hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h1 className={cn("text-2xl font-black tracking-tight", isCenterStudent ? "text-red-600" : "text-emerald-500")}>
                  IGNITE {isCenterStudent && <span className="text-blue-600">Center</span>}
                </h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pb-24">
               {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <div 
                        className={cn(
                          "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-base transition-all",
                          isActive 
                            ? (isCenterStudent ? "bg-red-100/50 text-red-600" : "bg-emerald-100/50 text-emerald-600")
                            : "text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        <item.icon className={cn("w-6 h-6", isActive ? (isCenterStudent ? "text-red-500" : "text-emerald-500") : "text-slate-400")} strokeWidth={isActive ? 2.5 : 2} />
                        {item.name}
                      </div>
                    </Link>
                  );
               })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
