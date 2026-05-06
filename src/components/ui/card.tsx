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
        "bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)]",
        hover && "hover:shadow-[var(--shadow-md)] hover:border-[var(--border-hover)] transition-all duration-200 cursor-pointer",
        paddings[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
