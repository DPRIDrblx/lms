"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, Swords, User, Compass, Users, MessageCircle, ShoppingBag, Tent, ShoppingCart, Map, Menu, X, Sparkles, Timer, Notebook, Trophy, PawPrint, Medal, Target } from "lucide-react";
import { cn, showLogo } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { FolderOpen, Calendar, Archive, BookOpen, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useSidebarStore } from "@/lib/sidebar-store";

const SkillUpIcon = ({ className }: any) => (
  <img src="/logo-skill-up.png" alt="Skill Up" className={className} style={{ objectFit: 'contain', transform: 'scale(1.2)' }} />
);

export function StudentSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { profile, isCenterStudent } = useAuth();
  const { uiMode } = useTheme();
  const [branchName, setBranchName] = useState("");
  const { isCollapsed, toggleCollapse } = useSidebarStore();

  useEffect(() => {
    if (isCenterStudent && profile?.id && uiMode === 'clean') {
      const fetchBranch = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from('center_students')
          .select('center_branches(name)')
          .eq('student_id', profile.id)
          .single();
        if (data?.center_branches) {
          setBranchName(data.center_branches.name);
        } else {
          setBranchName("Pilih Cabang (Data Kosong)");
        }
      };
      fetchBranch();
    }
  }, [isCenterStudent, profile?.id, uiMode]);

  let navItems = [
    { name: "Learn", href: "/dashboard", icon: Home },
    { name: "Quests", href: "/student/quests", icon: Swords },
    { name: "Skill Up", href: "/student/skill-up-hub", icon: SkillUpIcon },
    { name: "Faksi & Asrama", href: "/student/faction", icon: Shield },
    { name: "Peliharaan", href: "/student/pet", icon: PawPrint },
    { name: "Gelar & Piala", href: "/student/badges", icon: Medal },
    { name: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
    { name: "Hideout", href: "/student/hideout", icon: Tent },
    { name: "Social", href: "/student/social", icon: Users },
    { name: "Messages", href: "/student/messages", icon: MessageCircle },
    { name: "Explore", href: "/courses", icon: Compass },
    { name: "Latihan", href: "/student/drills", icon: Target },
    { name: "Study Room", href: "/student/study-room", icon: Timer },
    { name: "Smart Notes", href: "/student/notes", icon: Notebook },
    { name: "Market", href: "/student/market", icon: ShoppingCart },
    { name: "Shop", href: "/student/shop", icon: ShoppingBag },
    { name: "Golden Hour", href: "/student/golden-hour", icon: Sparkles },
    ...(isCenterStudent ? [{ name: "Talent Mapping", href: "/student/talent-mapping", icon: Map }] : []),
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
        "hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[260px]",
        uiMode === 'clean' ? "border-r border-slate-200 bg-[#F5F7FB] mt-16" : "bg-white border-r-2 border-slate-200 p-6"
      )}>
        {/* Toggle Button */}
        <button 
          onClick={toggleCollapse}
          className={cn(
            "absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-amber-500 hover:border-amber-200 shadow-sm transition-all z-50",
            uiMode === 'clean' && "top-[10%]"
          )}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {uiMode === 'clean' ? (
          <div className={cn("px-6 py-5 border-b border-slate-200/60 mb-2", isCollapsed && "px-2 py-4 flex flex-col items-center")}>
            <div className={cn("flex items-center gap-3 mb-4", isCollapsed && "mb-0")}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0C1E5B] to-[#1E40AF] text-white flex items-center justify-center shadow-sm shrink-0">
                <GraduationCap className="w-6 h-6 text-orange-400" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col justify-center">
                  {showLogo(profile?.class_name) ? (
                    <img src="/logo-lms.png" alt="LMS Logo" className="h-10 scale-125 origin-left w-auto object-contain mb-1" />
                  ) : (
                    <h1 className="text-[16px] font-black tracking-tight text-[#0C1E5B] leading-none mb-1">
                      IGNITE <br/><span className="text-orange-500">CENTER</span>
                    </h1>
                  )}
                </div>
              )}
            </div>
            {isCenterStudent && !isCollapsed && (
              <div className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm truncate">
                <Map className="w-3.5 h-3.5 text-[#108B96] shrink-0" />
                <span className="truncate">{branchName || "Loading..."}</span>
              </div>
            )}
          </div>
        ) : (
          <div className={cn("mb-8 px-4", isCollapsed && "px-0 text-center flex justify-center")}>
            {showLogo(profile?.class_name) ? (
              isCollapsed ? (
                <img src="/logo-lms.png" alt="IG" className="h-8 scale-110 w-auto object-contain" />
              ) : (
                <img src="/logo-lms.png" alt="LMS Logo" className="h-12 scale-125 w-auto object-contain" />
              )
            ) : (
              <h1 className={cn("text-3xl font-black tracking-tight", isCenterStudent ? "text-red-600" : "text-emerald-500", isCollapsed && "text-xl")}>
                {isCollapsed ? "IG" : <>IGNITE {isCenterStudent && <span className="text-blue-600">Center</span>}</>}
              </h1>
            )}
          </div>
        )}
        
        <nav className={cn(
          "flex flex-col flex-1 overflow-y-auto pb-8 scrollbar-hide",
          uiMode === 'clean' ? "py-4 gap-2 px-4" : "gap-2"
        )}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} title={isCollapsed ? item.name : undefined}>
                <div 
                  className={cn(
                    "flex items-center transition-all",
                    uiMode === 'clean'
                      ? [
                          "gap-3 py-3 rounded-[14px] font-semibold text-[13px] tracking-wide",
                          isCollapsed ? "px-0 justify-center mx-2" : "px-4",
                          isActive 
                            ? "bg-[#108B96] text-white shadow-sm" 
                            : "text-[#4A5568] hover:bg-slate-200/50 hover:text-slate-900"
                        ]
                      : [
                          "gap-4 py-4 rounded-2xl font-bold text-lg border-2",
                          isCollapsed ? "px-0 justify-center mx-1" : "px-4",
                          isActive 
                            ? (isCenterStudent ? "bg-red-100/50 border-red-200 text-red-600" : "bg-emerald-100/50 border-emerald-200 text-emerald-600")
                            : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        ]
                  )}
                >
                  <item.icon 
                    className={cn(
                      uiMode === 'clean' ? "w-5 h-5 shrink-0" : "w-7 h-7 shrink-0", 
                      isActive 
                        ? (uiMode === 'clean' ? "text-white" : (isCenterStudent ? "text-red-500" : "text-emerald-500")) 
                        : (uiMode === 'clean' ? "text-[#718096]" : "text-slate-400")
                    )} 
                    strokeWidth={isActive ? (uiMode === 'clean' ? 2.5 : 2.5) : 2} 
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full h-[80px] bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2 pb-safe">
        {navItems.filter(item => {
          if (isCenterStudent) {
            return ["Learn", "Jadwal Les", "Explore", "Profile"].includes(item.name);
          }
          return ["Learn", "Explore", "Social", "Profile"].includes(item.name);
        }).slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="flex-1 flex justify-center">
              <div 
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-2xl transition-all",
                  isActive 
                    ? (uiMode === 'clean' ? "bg-[#108B96]/10 text-[#108B96]" : "bg-emerald-100/50 text-emerald-600")
                    : "text-slate-400"
                )}
              >
                <item.icon className={cn("w-7 h-7 mb-1", isActive ? (uiMode === 'clean' ? "text-[#108B96]" : "text-emerald-500") : "text-slate-400")} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[10px] font-bold", isActive ? (uiMode === 'clean' ? "text-[#108B96]" : "text-emerald-600") : "text-slate-400")}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
        
        {/* Menu Button */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="flex-1 flex justify-center">
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all text-slate-400 hover:text-slate-600">
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
                <h1 className={cn(
                  "text-2xl font-black tracking-tight", 
                  uiMode === 'clean' ? "text-[#0C1E5B]" : (isCenterStudent ? "text-red-600" : "text-emerald-500")
                )}>
                  IGNITE {isCenterStudent && <span className={cn(uiMode === 'clean' ? "text-orange-500" : "text-blue-600")}>Center</span>}
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
                            ? (uiMode === 'clean' 
                                ? "bg-[#108B96] text-white shadow-sm" 
                                : (isCenterStudent ? "bg-red-100/50 text-red-600" : "bg-emerald-100/50 text-emerald-600")
                              )
                            : "text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        <item.icon 
                          className={cn(
                            "w-6 h-6", 
                            isActive 
                              ? (uiMode === 'clean' ? "text-white" : (isCenterStudent ? "text-red-500" : "text-emerald-500")) 
                              : "text-slate-400"
                          )} 
                          strokeWidth={isActive ? (uiMode === 'clean' ? 2.5 : 2.5) : 2} 
                        />
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
