"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, icon, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<string, string> = {
      primary:
        "bg-gradient-to-b from-[var(--accent)] to-[var(--accent-hover)] text-white hover:brightness-110 focus-visible:ring-[var(--accent)] shadow-[0_4px_12px_rgba(79,70,229,0.3)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] active:scale-[0.97]",
      secondary:
        "bg-white/80 backdrop-blur-sm text-[var(--text-primary)] border border-[var(--border)] hover:bg-white hover:border-[var(--border-hover)] hover:shadow-sm active:scale-[0.97]",
      ghost:
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
      danger:
        "bg-[var(--error)] text-white hover:bg-red-700 focus-visible:ring-[var(--error)] active:scale-[0.98]",
    };

    const sizes: Record<string, string> = {
      sm: "h-8 px-3 text-sm rounded-lg",
      md: "h-10 px-4 text-sm rounded-xl",
      lg: "h-12 px-6 text-base rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
