"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export function Card({ children, hover = false, padding = "md", className, onClick }: CardProps) {
  const paddings: Record<string, string> = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "bg-white border border-[var(--border)] rounded-2xl transition-all duration-200",
        hover && "hover-lift cursor-pointer hover:border-[var(--border-hover)]",
        !hover && "shadow-[var(--shadow-sm)]",
        paddings[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
