"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback message if prompt is not available but button was somehow clicked
      alert("Aplikasi ini sudah terinstal atau browser Anda tidak mendukung fitur ini. Coba buka dari menu titik tiga (Install App).");
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  if (isInstalled || !isInstallable) {
    return null; // Don't show button if already installed or not supported/ready
  }

  return (
    <button
      onClick={handleInstallClick}
      className="mt-4 w-full py-3 px-6 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-bold rounded-2xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
    >
      <Download className="w-4 h-4" />
      Install Aplikasi (PWA)
    </button>
  );
}
