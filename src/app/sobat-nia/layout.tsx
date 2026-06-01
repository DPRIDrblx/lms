"use client";
import { NiaShell } from "@/components/layout/nia-shell";

export default function SobatNiaLayout({ children }: { children: React.ReactNode }) {
  return <NiaShell>{children}</NiaShell>;
}
