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
    idle: { y: [0, -4, 0], transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
    correct: { y: [0, -15, 0], transition: { duration: 0.5, ease: "easeOut" } },
    incorrect: { x: [-4, 4, -4, 4, 0], transition: { duration: 0.4 } }
  };

  const leftArmVariants: Variants = {
    idle: { rotate: 0, y: 0 },
    correct: { rotate: -150, y: -15, transition: { type: "spring", stiffness: 300 } }, // Cheer
    incorrect: { rotate: 45, y: 5, x: 5, transition: { type: "spring", stiffness: 300 } } // Cross
  };

  const rightArmVariants: Variants = {
    idle: { rotate: 0, y: 0 },
    correct: { rotate: 150, y: -15, transition: { type: "spring", stiffness: 300 } }, // Cheer
    incorrect: { rotate: -45, y: 5, x: -5, transition: { type: "spring", stiffness: 300 } } // Cross
  };

  return (
    <div className={`relative w-24 h-24 md:w-32 md:h-32 ${className}`}>
      <motion.svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={state}
        variants={variants}
        className="w-full h-full drop-shadow-lg"
      >
        <defs>
          <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffdfc4" />
            <stop offset="100%" stopColor="#f0c6a5" />
          </linearGradient>
          <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A3B32" />
            <stop offset="100%" stopColor="#2D231E" />
          </linearGradient>
          <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="jacketGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
        </defs>

        {/* Back Hair */}
        <circle cx="50" cy="40" r="32" fill="url(#hairGrad)" />

        {/* Body (Jacket) */}
        <path d="M 25 100 C 25 70, 75 70, 75 100" fill="url(#jacketGrad)" />
        {/* Inner Shirt */}
        <path d="M 35 100 L 45 75 L 55 75 L 65 100" fill="url(#shirtGrad)" />
        {/* Red Tie */}
        <path d="M 47 75 L 53 75 L 55 95 L 50 100 L 45 95 Z" fill="#EF4444" />

        {/* Left Arm */}
        <motion.g animate={state} variants={leftArmVariants} style={{ transformOrigin: "35px 75px" }}>
          <rect x="20" y="70" width="12" height="28" rx="6" fill="url(#jacketGrad)" />
          <circle cx="26" cy="98" r="6" fill="url(#skinGrad)" />
        </motion.g>

        {/* Right Arm */}
        <motion.g animate={state} variants={rightArmVariants} style={{ transformOrigin: "65px 75px" }}>
          <rect x="68" y="70" width="12" height="28" rx="6" fill="url(#jacketGrad)" />
          <circle cx="74" cy="98" r="6" fill="url(#skinGrad)" />
        </motion.g>

        {/* Face */}
        <circle cx="50" cy="45" r="28" fill="url(#skinGrad)" />

        {/* Front Hair Bangs */}
        <path d="M 22 40 C 25 15, 75 15, 78 40 C 70 20, 60 25, 50 20 C 40 25, 30 20, 22 40 Z" fill="url(#hairGrad)" />
        <path d="M 78 40 C 75 25, 65 30, 50 25 C 60 30, 70 35, 78 40 Z" fill="url(#hairGrad)" />
        <path d="M 22 40 C 25 25, 35 30, 50 25 C 40 30, 30 35, 22 40 Z" fill="url(#hairGrad)" />

        {/* Glasses */}
        <circle cx="38" cy="48" r="10" fill="none" stroke="#0F172A" strokeWidth="2.5" />
        <circle cx="62" cy="48" r="10" fill="none" stroke="#0F172A" strokeWidth="2.5" />
        <line x1="48" y1="48" x2="52" y2="48" stroke="#0F172A" strokeWidth="2.5" />

        {/* Eyes & Blinking */}
        <motion.g animate={{ scaleY: isBlinking ? 0.1 : 1 }} style={{ transformOrigin: "50px 48px" }}>
          {state === 'incorrect' ? (
            <>
              {/* Sad/Dizzy Eyes inside glasses */}
              <path d="M 34 45 L 42 51 M 42 45 L 34 51" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 58 45 L 66 51 M 66 45 L 58 51" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : state === 'correct' ? (
            <>
              {/* Happy eyes ^ ^ */}
              <path d="M 34 50 Q 38 44 42 50" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 58 50 Q 62 44 66 50" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              {/* Normal eyes */}
              <circle cx="38" cy="48" r="4" fill="#0F172A" />
              <circle cx="62" cy="48" r="4" fill="#0F172A" />
              {/* Eye highlights */}
              <circle cx="39.5" cy="46.5" r="1.5" fill="#FFFFFF" />
              <circle cx="63.5" cy="46.5" r="1.5" fill="#FFFFFF" />
            </>
          )}
        </motion.g>

        {/* Mouth */}
        {state === 'incorrect' ? (
          <path d="M 45 62 Q 50 58 55 62" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : state === 'correct' ? (
          <path d="M 42 58 Q 50 68 58 58 Z" stroke="#0F172A" strokeWidth="2" strokeLinejoin="round" fill="#EF4444" />
        ) : (
          <path d="M 45 60 Q 50 64 55 60" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        )}
      </motion.svg>
    </div>
  );
}
