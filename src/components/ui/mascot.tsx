"use client";

import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

interface MascotProps {
  state: "idle" | "correct" | "incorrect";
  className?: string;
}

export function Mascot({ state, className = "" }: MascotProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Random blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 3000 + 2000); // Blink every 2-5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  const variants: Variants = {
    idle: { y: [0, -5, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
    correct: { y: [0, -15, 0], transition: { duration: 0.6, ease: "easeOut" } },
    incorrect: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } }
  };

  const armVariants: Variants = {
    idle: { rotate: 0, y: 0 },
    correct: { rotate: -130, y: -20, transition: { type: "spring", stiffness: 200 } }, // Arms up cheering
    incorrect: { rotate: 45, y: 10, x: -10, transition: { type: "spring", stiffness: 200 } } // Arms crossed
  };

  const armRightVariants: Variants = {
    idle: { rotate: 0, y: 0 },
    correct: { rotate: 130, y: -20, transition: { type: "spring", stiffness: 200 } }, // Arms up cheering
    incorrect: { rotate: -45, y: 10, x: 10, transition: { type: "spring", stiffness: 200 } } // Arms crossed
  };

  return (
    <div className={`relative w-24 h-24 md:w-32 md:h-32 ${className}`}>
      <motion.svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={state}
        variants={variants}
        className="w-full h-full drop-shadow-md"
      >
        {/* Body (Student Uniform) */}
        <path d="M 20 100 C 20 60, 80 60, 80 100" fill="#3B82F6" />
        <path d="M 40 100 L 50 80 L 60 100" fill="#F8FAFC" /> {/* Collar */}
        <circle cx="50" cy="85" r="3" fill="#F59E0B" /> {/* Tie/Badge */}

        {/* Left Arm */}
        <motion.g animate={state} variants={armVariants} style={{ transformOrigin: "30px 70px" }}>
          <rect x="15" y="65" width="15" height="40" rx="7.5" fill="#2563EB" />
          <circle cx="22.5" cy="100" r="7.5" fill="#FCD34D" /> {/* Hand */}
          {state === 'correct' && (
             <path d="M 18 95 L 18 85 C 18 80, 25 80, 25 85 L 25 95" fill="#FCD34D" /> /* Thumbs up */
          )}
        </motion.g>

        {/* Right Arm */}
        <motion.g animate={state} variants={armRightVariants} style={{ transformOrigin: "70px 70px" }}>
          <rect x="70" y="65" width="15" height="40" rx="7.5" fill="#2563EB" />
          <circle cx="77.5" cy="100" r="7.5" fill="#FCD34D" /> {/* Hand */}
          {state === 'correct' && (
             <path d="M 72 95 L 72 85 C 72 80, 79 80, 79 85 L 79 95" fill="#FCD34D" /> /* Thumbs up */
          )}
        </motion.g>

        {/* Head */}
        <circle cx="50" cy="40" r="25" fill="#FCD34D" />

        {/* Hair */}
        <path d="M 25 40 C 25 10, 75 10, 75 40 C 70 20, 30 20, 25 40 Z" fill="#1E293B" />
        <path d="M 25 40 C 20 50, 20 60, 25 65 C 30 65, 30 50, 25 40 Z" fill="#1E293B" />
        <path d="M 75 40 C 80 50, 80 60, 75 65 C 70 65, 70 50, 75 40 Z" fill="#1E293B" />

        {/* Eyes */}
        <motion.g animate={{ scaleY: isBlinking ? 0.1 : 1 }} transition={{ duration: 0.1 }}>
          {state === 'incorrect' ? (
            <>
              {/* X eyes for incorrect */}
              <path d="M 35 32 L 43 40 M 43 32 L 35 40" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
              <path d="M 57 32 L 65 40 M 65 32 L 57 40" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : state === 'correct' ? (
            <>
              {/* Happy eyes ^ ^ */}
              <path d="M 35 38 Q 39 32 43 38" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 57 38 Q 61 32 65 38" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              {/* Normal eyes */}
              <circle cx="39" cy="36" r="4" fill="#1E293B" />
              <circle cx="61" cy="36" r="4" fill="#1E293B" />
            </>
          )}
        </motion.g>

        {/* Mouth */}
        {state === 'idle' && (
          <path d="M 45 50 Q 50 55 55 50" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        )}
        {state === 'correct' && (
          <path d="M 42 48 Q 50 60 58 48 Z" fill="#EF4444" stroke="#1E293B" strokeWidth="2" strokeLinejoin="round" />
        )}
        {state === 'incorrect' && (
          <path d="M 45 52 Q 50 47 55 52" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        )}
        
        {/* Sparkles for correct */}
        {state === 'correct' && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], rotate: [0, 90] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
          >
            <path d="M 10 20 L 15 15 L 20 20 L 15 25 Z" fill="#FBBF24" />
            <path d="M 80 15 L 85 10 L 90 15 L 85 20 Z" fill="#FBBF24" />
          </motion.g>
        )}
      </motion.svg>
    </div>
  );
}
