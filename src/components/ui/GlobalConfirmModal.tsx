"use client";

import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ConfirmStore {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText: string;
  cancelText: string;
  isAlert: boolean;
  showConfirm: (options: { title?: string; message: string; onConfirm: () => void; onCancel?: () => void; confirmText?: string; cancelText?: string; isAlert?: boolean }) => void;
  close: () => void;
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  isOpen: false,
  title: "Konfirmasi",
  message: "",
  onConfirm: () => {},
  onCancel: undefined,
  confirmText: "YA, LANJUTKAN",
  cancelText: "TIDAK, BATAL",
  isAlert: false,
  showConfirm: (options) => 
    set({ 
      isOpen: true, 
      title: options.title || "Konfirmasi",
      message: options.message,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      confirmText: options.confirmText || "YA, LANJUTKAN",
      cancelText: options.cancelText || "TIDAK, BATAL",
      isAlert: options.isAlert || false
    }),
  close: () => set({ isOpen: false }),
}));

export function GlobalConfirmModal() {
  const { isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, isAlert, close } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white max-w-sm w-full rounded-3xl p-8 shadow-2xl border-2 border-slate-200 text-center relative overflow-hidden"
      >
        <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">
          {title}
        </h2>
        <p className="text-slate-600 mb-8 font-medium leading-relaxed">
          {message}
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              onConfirm();
              close();
            }}
            className="w-full py-4 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 active:translate-y-1 text-white font-bold rounded-2xl border-b-4 border-blue-700 transition-all text-lg"
          >
            {isAlert ? 'SAYA MENGERTI' : confirmText}
          </button>
          
          {!isAlert && (
            <button 
              onClick={() => {
                if (onCancel) onCancel();
                close();
              }}
              className="w-full py-4 bg-white hover:bg-slate-50 active:bg-slate-100 active:translate-y-1 text-slate-500 font-bold rounded-2xl border-2 border-slate-200 border-b-4 transition-all text-lg"
            >
              {cancelText}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
