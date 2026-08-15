"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
}

interface TabsSliderProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabsSlider({ tabs, activeTab, onChange, className }: TabsSliderProps) {
  return (
    <div className={cn("relative flex items-center border-b border-slate-200 overflow-x-auto no-scrollbar", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-4 sm:px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors outline-none",
              isActive ? "text-[#108B96]" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <div className="flex items-center gap-2">
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] flex items-center justify-center",
                  isActive ? "bg-[#108B96] text-white" : "bg-slate-200 text-slate-600"
                )}>
                  {tab.badge}
                </span>
              )}
            </div>
            
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#108B96] rounded-t-full"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
