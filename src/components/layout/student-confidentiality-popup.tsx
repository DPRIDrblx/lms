"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function StudentConfidentialityPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;
    const hasAgreed = sessionStorage.getItem(`nia_confidential_agreed_${profile.id}`);
    if (!hasAgreed) {
      setIsOpen(true);
    }
  }, [profile]);

  const handleAgree = () => {
    if (profile) {
      sessionStorage.setItem(`nia_confidential_agreed_${profile.id}`, "true");
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-red-500 p-6 flex flex-col items-center justify-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-center">PERINGATAN KERAHASIAAN</h2>
            </div>
            
            <div className="p-8">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex gap-4 text-red-800">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <p className="font-medium text-sm leading-relaxed">
                  Sesuai dengan <strong>Surat Pernyataan</strong> yang telah ditandatangani, kamu dilarang keras untuk:
                </p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm">1</div>
                  <span className="text-slate-700 font-medium">Menangkap layar (Screenshot) di halaman manapun.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm">2</div>
                  <span className="text-slate-700 font-medium">Membagikan materi, modul, atau video pembelajaran.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm">3</div>
                  <span className="text-slate-700 font-medium">Membocorkan atau menyebarkan soal-soal latihan dan ujian ke pihak luar.</span>
                </li>
              </ul>
              
              <p className="text-sm text-slate-500 mb-8 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                Pelanggaran terhadap aturan ini akan ditindak tegas sesuai peraturan yang berlaku.
              </p>
              
              <Button 
                onClick={handleAgree}
                className="w-full h-14 text-lg font-bold bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-lg shadow-red-500/30 transition-all hover:-translate-y-1"
              >
                SAYA MENGERTI DAN SETUJU
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
