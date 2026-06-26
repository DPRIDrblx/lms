"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, Swords, User, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Learn", href: "/dashboard", icon: Home },
    { name: "Quests", href: "/student/quests", icon: Swords },
    { name: "Leaderboard", href: "/student/leaderboard", icon: Shield },
    { name: "Explore", href: "/courses", icon: Compass },
    { name: "Profile", href: "/student/profile", icon: User },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-[260px] bg-white border-r-2 border-slate-200 p-6 z-40">
        <div className="mb-8 px-4">
          <h1 className="text-3xl font-black text-emerald-500 tracking-tight">Academia</h1>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
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
        {navItems.map((item) => {
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
      </div>
    </>
  );
}
