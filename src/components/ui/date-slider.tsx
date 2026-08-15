"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateItem {
  date: Date;
  label: string; // e.g. "15" or "15 Agt"
  dayName: string; // e.g. "Sabtu"
}

interface DateSliderProps {
  dates: DateItem[];
  activeDate: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DateSlider({ dates, activeDate, onChange, className }: DateSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Function to format Date to standard YYYY-MM-DD for comparison
  const formatDateString = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  const activeDateString = formatDateString(activeDate);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className={cn("relative flex items-center group", className)}>
      <button 
        onClick={scrollLeft}
        className="absolute left-0 z-10 w-10 h-full bg-gradient-to-r from-white to-transparent flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity md:-ml-2"
      >
        <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 hover:scale-105 transition-transform text-[#108B96]">
          <ChevronLeft className="w-5 h-5" />
        </div>
      </button>

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar gap-3 w-full py-2 px-1 scroll-smooth"
      >
        {dates.map((item, index) => {
          const itemDateString = formatDateString(item.date);
          const isActive = itemDateString === activeDateString;
          
          return (
            <button
              key={index}
              onClick={() => onChange(item.date)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[72px] h-20 rounded-[16px] border transition-all shrink-0 cursor-pointer outline-none",
                isActive 
                  ? "border-[#108B96] bg-teal-50 text-[#108B96] shadow-sm" 
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span className={cn("text-[11px] font-bold uppercase tracking-wider mb-1", isActive ? "text-[#108B96]" : "text-slate-400")}>
                {item.dayName}
              </span>
              <span className={cn("text-[22px] leading-none", isActive ? "font-black" : "font-bold text-slate-700")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <button 
        onClick={scrollRight}
        className="absolute right-0 z-10 w-10 h-full bg-gradient-to-l from-white to-transparent flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity md:-mr-2"
      >
        <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 hover:scale-105 transition-transform text-[#108B96]">
          <ChevronRight className="w-5 h-5" />
        </div>
      </button>
    </div>
  );
}
