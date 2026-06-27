"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, BookOpen, CreditCard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function ParentSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/parent/dashboard", icon: Home },
    { name: "Keuangan", href: "/parent/finance", icon: Wallet },
    { name: "Rapor", href: "/parent/reports", icon: BookOpen },
    { name: "Kartu ID", href: "/parent/cards", icon: CreditCard },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-[260px] bg-white border-r-2 border-slate-200 p-6 z-40">
        <div className="mb-8 px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-indigo-500 tracking-tight">Parent</h1>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-lg transition-all border-2",
                    isActive 
                      ? "bg-indigo-100/50 border-indigo-200 text-indigo-600" 
                      : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  )}
                >
                  <item.icon className={cn("w-7 h-7", isActive ? "text-indigo-500" : "text-slate-400")} strokeWidth={isActive ? 2.5 : 2} />
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
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href} className="flex-1 flex justify-center">
              <div 
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-2xl transition-all",
                  isActive ? "bg-indigo-100/50 text-indigo-600" : "text-slate-400"
                )}
              >
                <item.icon className={cn("w-7 h-7 mb-1", isActive ? "text-indigo-500" : "text-slate-400")} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[10px] font-bold", isActive ? "text-indigo-600" : "text-slate-400")}>
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
