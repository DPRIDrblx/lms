"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface CenterLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CenterLoader({ className, size = "md" }: CenterLoaderProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  const { isCenterStudent } = useAuth();

  if (!isCenterStudent) {
    return (
      <div className={cn("flex justify-center items-center py-8", className)}>
        <Loader2 className={cn("animate-spin text-[var(--accent)]", sizeClasses[size] ? "w-8 h-8" : "w-10 h-10")} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center space-y-4 bg-white/40 backdrop-blur-md dark:bg-slate-900/40">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className={cn("font-black tracking-tighter flex flex-col items-center gap-1 drop-shadow-xl", sizeClasses[size])}
      >
        <div className="flex items-center gap-1">
          <span className="text-red-600">NIA</span>
          <motion.span 
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="text-yellow-400"
          >
            .
          </motion.span>
        </div>
        <span className="text-sm font-bold text-slate-500 tracking-widest uppercase mt-2">Center</span>
      </motion.div>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "80px" }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="h-1.5 bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 rounded-full shadow-lg"
      />
    </div>
  );
}
