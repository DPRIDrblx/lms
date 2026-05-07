"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, GraduationCap, Clock, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export function ClassGuard({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  // TU and Parents are never blocked
  if (profile?.role === "tu" || profile?.role === "parent") {
    return <>{children}</>;
  }

  // Check if assigned to a class
  if (profile && !profile.class_id) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="p-10 text-center border-none shadow-2xl bg-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-light)] rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-50 rounded-full -ml-12 -mb-12 blur-xl" />

            <div className="relative z-10 space-y-6">
              <div className="h-20 w-20 bg-[var(--accent-light)] rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <Lock className="h-10 w-10 text-[var(--accent)]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[var(--text-primary)]">Hold On, {profile.full_name?.split(' ')[0]}!</h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Your academic profile is ready, but you haven&apos;t been assigned to a class yet.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg bg-white flex items-center justify-center border border-[var(--border)] shadow-sm">
                    <GraduationCap className="h-3 w-3 text-[var(--accent)]" />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Restricted: Courses & Exams</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg bg-white flex items-center justify-center border border-[var(--border)] shadow-sm">
                    <Clock className="h-3 w-3 text-amber-500" />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Pending TU Verification</span>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Next Steps</p>
                <div className="flex flex-col gap-2">
                  <Button variant="primary" className="w-full rounded-xl h-12 shadow-lg shadow-[var(--accent)]/20">
                    <MessageCircle className="h-4 w-4 mr-2" /> Contact Admin (TU)
                  </Button>
                  <Button variant="ghost" className="w-full text-xs" onClick={() => window.location.reload()}>
                    Check Status Again
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          
          <p className="text-center mt-8 text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-[0.2em]">
            Nusantara International Academy • Security Module
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
