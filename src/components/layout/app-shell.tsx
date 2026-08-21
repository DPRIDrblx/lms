"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";
import { cn } from "@/lib/utils";
import { StudentSidebar } from "./student-sidebar";
import { StudentTopBar } from "./student-top-bar";
import { ParentSidebar } from "./parent-sidebar";
import { ParentTopBar } from "./parent-top-bar";
import { ClassGuard } from "./class-guard";
import { StudentConfidentialityPopup } from "./student-confidentiality-popup";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { ShieldAlert, LogOut, CheckCircle2, Zap, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import { useSidebarStore } from "@/lib/sidebar-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, isCenterStudent, updateProfile } = useAuth();
  const { uiMode } = useTheme();
  const supabase = createClient();
  const isExam = pathname?.includes("/exam");
  const [isUpdatingCenter, setIsUpdatingCenter] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const { isCollapsed } = useSidebarStore();

  useEffect(() => {
    if (isCenterStudent && profile && profile.has_seen_center_update === false) {
      setIsUpdatingCenter(true);
      // Simulate a slightly longer, cinematic download progress
      const interval = setInterval(() => {
        setUpdateProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              updateProfile({ has_seen_center_update: true });
              setIsUpdatingCenter(false);
            }, 2500); // Wait 2.5s at 100% for the cinematic reveal
            return 100;
          }
          return prev + Math.floor(Math.random() * 8) + 2; // Slower progress for effect
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isCenterStudent, profile, updateProfile]);

  useEffect(() => {
    if (!loading && profile?.force_password_change) {
      router.push("/auth/change-password");
    }
  }, [profile, loading, router]);

  if (profile?.status === "pending") {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[var(--border)]">
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Menunggu Verifikasi</h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Akun Kepala Sekolah Anda sedang dalam proses peninjauan oleh Tata Usaha. Anda akan dapat mengakses sistem setelah disetujui.
          </p>
          <Button 
            variant="secondary" 
            className="w-full text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50 border border-red-200"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" /> Keluar
          </Button>
        </div>
      </div>
    );
  }

  if (isExam) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  if (profile?.role === "student") {
    return (
      <>
        <AnimatePresence>
          {isUpdatingCenter && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)", transition: { duration: 0.8 } }}
              className="fixed inset-0 z-[100] bg-[#0a0a1a] text-white flex flex-col items-center justify-center p-6 overflow-hidden"
            >
              {/* Cinematic Background Elements */}
              <div className="absolute inset-0 z-0 opacity-40">
                <motion.div 
                  className="absolute top-1/4 -left-1/4 w-[100vw] h-[100vw] rounded-full bg-red-600/30 mix-blend-screen blur-[120px]"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute bottom-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full bg-blue-600/30 mix-blend-screen blur-[120px]"
                  animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                
                {/* Main Icon Animation */}
                <div className="relative mb-12">
                  <motion.div 
                    className="absolute inset-0 bg-red-500 rounded-full blur-2xl"
                    animate={{ scale: updateProgress >= 100 ? [1, 3] : [1, 1.5, 1], opacity: updateProgress >= 100 ? [0.5, 0] : [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: updateProgress >= 100 ? 0 : Infinity }}
                  />
                  <div className="w-32 h-32 relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.3)] z-10 overflow-hidden">
                    {updateProgress >= 100 ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                      >
                        <CheckCircle2 className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Rocket className="w-16 h-16 text-red-500" />
                      </motion.div>
                    )}
                    
                    {/* Scanning Line */}
                    {updateProgress < 100 && (
                      <motion.div 
                        className="absolute top-0 left-0 w-full h-1 bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,1)]"
                        animate={{ y: [0, 128, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </div>
                </div>

                {/* Text Glitch Effect */}
                <div className="h-24">
                  {updateProgress >= 100 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 bg-clip-text text-transparent mb-2">
                        Pembaruan Selesai!
                      </h2>
                      <p className="text-xl text-slate-300 font-medium">Selamat datang di IGNITE Center.</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-2">
                      <h2 className="text-3xl md:text-4xl font-black tracking-widest text-white drop-shadow-lg">
                        SYSTEM UPGRADE
                      </h2>
                      <motion.p 
                        className="text-red-400 font-mono tracking-widest uppercase text-sm"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        {updateProgress < 30 ? "Initializing Center Protocol..." : 
                         updateProgress < 70 ? "Downloading Assets..." : 
                         "Applying Visual Modifications..."}
                      </motion.p>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-md mt-12 space-y-4">
                  <div className="flex justify-between font-mono text-xs text-slate-400 font-bold tracking-widest">
                    <span>PROGRESS</span>
                    <span className="text-white">{updateProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative backdrop-blur-sm border border-white/5">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 via-yellow-500 to-blue-600 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${updateProgress}%` }}
                      transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {uiMode === 'clean' ? (
          <div className="min-h-screen bg-[#F4F6F8] text-slate-900 flex flex-col pb-[80px] lg:pb-0">
            <StudentTopBar />
            <div className="flex flex-1 transition-all duration-300">
              <div className={cn("shrink-0 transition-all duration-300 hidden lg:block", isCollapsed ? "w-[80px]" : "w-[260px]")}>
                <StudentSidebar />
              </div>
              <main className="flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
                <ClassGuard>
                  {children}
                </ClassGuard>
              </main>
            </div>
            <StudentConfidentialityPopup />
          </div>
        ) : (
          <div 
            className="min-h-screen pb-24 lg:pb-0 bg-slate-50 text-[var(--text-primary)] transition-all duration-300"
            data-theme={isCenterStudent ? "center" : undefined}
          >
            <StudentSidebar />
            <div className={cn("flex flex-col min-h-screen transition-all duration-300", isCollapsed ? "lg:pl-[80px]" : "lg:pl-[260px]")}>
              <StudentTopBar />
              <main className="flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
                <ClassGuard>
                  {children}
                </ClassGuard>
              </main>
              <StudentConfidentialityPopup />
            </div>
          </div>
        )}
      </>
    );
  }

  if (profile?.role === "parent") {
    return (
      <div className="min-h-screen bg-slate-50 text-[var(--text-primary)] pb-24 lg:pb-0">
        <ParentSidebar />
        <div className="lg:pl-[260px] flex flex-col min-h-screen">
          <ParentTopBar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Legacy layout for Teacher/Principal/Admin
  return (
    <div className="min-h-screen saas-bg print:bg-white text-[var(--text-primary)]">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="lg:pl-[260px] flex flex-col min-h-screen print:pl-0 print:block">
        <div className="print:hidden">
          <TopBar />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full print:p-0 print:m-0">
          <ClassGuard>
            {children}
          </ClassGuard>
        </main>
      </div>
    </div>
  );
}
