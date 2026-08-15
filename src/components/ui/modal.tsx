"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useTheme } from "@/lib/theme-context";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({ isOpen, onClose, title, children, className, size = "md" }: ModalProps) {
  const { uiMode } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sizes: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "relative w-full bg-white shadow-xl max-h-[95vh] overflow-y-auto",
              uiMode === "clean" 
                ? "border border-slate-200 rounded-[20px] p-6" 
                : "border-2 border-slate-200 border-b-[6px] rounded-3xl p-6",
              sizes[size],
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
          >
            {title && (
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/80 backdrop-blur-md z-10 -mx-6 px-6 py-2 -mt-6 pt-6 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
                >
                  <X className="h-5 w-5 font-bold" />
                </button>
              </div>
            )}
            <div className="mt-2">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
