"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Camera } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function QRScanner({ 
  onScan, 
  onClose 
}: { 
  onScan: (decodedText: string) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;

    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: {width: 250, height: 250}, aspectRatio: 1.0 },
      /* verbose= */ false
    );

    scannerRef.current.render((text) => {
      onScan(text);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    }, (error) => {
      // ignore
    });

  }, [mounted, onScan]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-bold">Scan QR Presensi</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4">
          <div id="reader" className="w-full"></div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Arahkan kamera ke QR Code yang ditampilkan oleh Tutor di depan kelas.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
