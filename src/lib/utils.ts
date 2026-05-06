import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const RANKS = [
  { name: "Beginner", minXp: 0 },
  { name: "Explorer", minXp: 100 },
  { name: "Apprentice", minXp: 300 },
  { name: "Scholar", minXp: 600 },
  { name: "Master", minXp: 1000 },
  { name: "Legend", minXp: 1500 },
];

export function getRank(xp: number): string {
  const rank = [...RANKS].reverse().find((r) => xp >= r.minXp);
  return rank?.name ?? "Beginner";
}

export function getNextRank(xp: number): { name: string; xpNeeded: number; progress: number } {
  const currentIdx = [...RANKS].reverse().findIndex((r) => xp >= r.minXp);
  const actualIdx = RANKS.length - 1 - currentIdx;
  if (actualIdx >= RANKS.length - 1) {
    return { name: "Max Rank", xpNeeded: 0, progress: 100 };
  }
  const next = RANKS[actualIdx + 1];
  const current = RANKS[actualIdx];
  const progress = ((xp - current.minXp) / (next.minXp - current.minXp)) * 100;
  return { name: next.name, xpNeeded: next.minXp - xp, progress: Math.min(progress, 100) };
}

export function generateQRPayload(): string {
  return `NIA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
