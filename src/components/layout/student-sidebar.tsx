"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, Swords, User, Compass, Users, MessageCircle, ShoppingBag, Tent, ShoppingCart, Map, Menu, X, Sparkles, Timer, Notebook } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function StudentSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Learn", href: "/dashboard", icon: Home },
    { name: "Quests", href: "/student/quests", icon: Swords },
    { name: "Leaderboard", href: "/student/leaderboard", icon: Shield },
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

  return (
    <>
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-[260px] bg-white border-r-2 border-slate-200 p-6 z-40">
        <div className="mb-8 px-4">
          <h1 className="text-3xl font-black text-emerald-500 tracking-tight">IGNITE</h1>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pb-8 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-lg transition-all border-2",
                    isActive 
                      ? "bg-emerald-100/50 border-emerald-200 text-emerald-600" 
                      : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  )}
                >
                  <item.icon className={cn("w-7 h-7", isActive ? "text-emerald-500" : "text-slate-400")} strokeWidth={isActive ? 2.5 : 2} />
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
            <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-black text-emerald-500 tracking-tight">IGNITE Menu</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                 <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pb-24">
               {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <div 
                        className={cn(
                          "flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-lg transition-all border-2",
                          isActive 
                            ? "bg-emerald-100/50 border-emerald-200 text-emerald-600" 
                            : "border-slate-100 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <item.icon className={cn("w-7 h-7", isActive ? "text-emerald-500" : "text-slate-400")} strokeWidth={isActive ? 2.5 : 2} />
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
