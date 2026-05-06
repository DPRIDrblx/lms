"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = "var(--accent)",
  showLabel = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const sizes: Record<string, string> = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Progress</span>
          <span className="text-xs font-semibold text-[var(--text-primary)]">{percentage}%</span>
        </div>
      )}
      <div className={cn("w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden", sizes[size])}>
        <motion.div
          className={cn("h-full rounded-full", sizes[size])}
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
