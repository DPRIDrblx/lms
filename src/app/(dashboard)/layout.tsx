"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'tutor') {
        router.replace('/tutor');
      } else if (profile.role === 'operator_les') {
        router.replace('/operator-les');
      } else if (profile.role === 'pengurus_nia') {
        router.replace('/pengurus-nia');
      } else if (profile.role === 'sobat_nia') {
        router.replace('/sobat-nia');
      }
    }
  }, [profile, loading, router]);

  return <AppShell>{children}</AppShell>;
}
