"use client";

import { useEffect, useState } from "react";
import { Download, MonitorSmartphone } from "lucide-react";

export function NiaPwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Aplikasi ini sudah terinstal atau browser Anda tidak mendukung fitur ini. Coba buka dari menu titik tiga (Install App).");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className="mt-8 border border-slate-200/60 rounded-3xl p-5 bg-gradient-to-br from-white to-slate-50 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl group-hover:bg-yellow-400/20 transition-colors" />
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 text-white mb-1">
          <MonitorSmartphone className="w-7 h-7 text-yellow-400" />
        </div>
        
        <div>
          <h4 className="font-black text-slate-800 text-lg">Aplikasi NIA Center</h4>
          <p className="text-slate-500 text-xs font-bold px-4">Download PWA untuk pengalaman belajar yang lebih cepat dan lancar tanpa browser.</p>
        </div>
        
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-black rounded-2xl border-b-4 border-slate-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20"
        >
          <Download className="w-5 h-5 text-red-500" />
          <span>Install Aplikasi</span>
        </button>
      </div>
    </div>
  );
}
