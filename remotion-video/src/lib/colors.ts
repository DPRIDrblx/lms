// ═══════════════════════════════════════════════════════
// IGNITE LMS — Brand Color System
// ═══════════════════════════════════════════════════════

export const COLORS = {
  // MMIS School — Emerald
  mmisMain: "#059669",
  mmisDark: "#166534",
  mmisDeep: "#14532D",
  mmisLight: "#D1FAE5",
  mmisBg: "#F7FBF8",

  // NIA Tutoring — Amber/Orange
  niaAmber: "#F59E0B",
  niaOrange: "#F97316",
  niaDark: "#9A3412",
  niaLight: "#FEF3C7",
  niaBg: "#FFFBF5",

  // NAST Tournament — Cyan/Gold
  nastCyan: "#06B6D4",
  nastCyanLight: "#67E8F9",
  nastGold: "#EAB308",
  nastNavy: "#070B14",

  // Brand Neutrals
  parchment: "#F5F1E8",
  parchmentLight: "#FAF6EE",
  cream: "#FFF0D4",
  deepNavy: "#070B14",
  darkSlate: "#0F172A",

  // Text
  textPrimary: "#022C22",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  white: "#FFFFFF",
  black: "#000000",
} as const;

// Gradient presets
export const GRADIENTS = {
  igniteHero: "linear-gradient(135deg, #FFF0D4 0%, #FDBA74 40%, #15803D 100%)",
  mmisGreen: "linear-gradient(135deg, #059669 0%, #166534 100%)",
  niaOrange: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
  nastCyber: "linear-gradient(135deg, #070B14 0%, #0C4A6E 50%, #070B14 100%)",
  goldenSun: "linear-gradient(180deg, #FEF08A 0%, #F59E0B 100%)",
  darkOverlay: "linear-gradient(180deg, rgba(7,11,20,0) 0%, rgba(7,11,20,0.95) 100%)",
  cyanGlow: "linear-gradient(135deg, #06B6D4 0%, #10B981 100%)",
} as const;
