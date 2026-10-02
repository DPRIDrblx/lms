"use client";

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function AttendanceQRCode({ scheduleId }: { scheduleId: string }) {
  const [showQR, setShowQR] = useState(false);
  const [token, setToken] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showQR) return;
    
    // Function to generate the token based on current time chunk (10 seconds)
    const updateToken = () => {
      const timeChunk = Math.floor(Date.now() / 10000); // changes every 10 seconds
      // Simple hash-like structure for the token
      const rawString = `${scheduleId}-${timeChunk}`;
      setToken(btoa(rawString)); // Base64 encode it for cleaner QR
    };

    updateToken();
    const interval = setInterval(updateToken, 1000); // Check every second to catch chunk boundary

    return () => clearInterval(interval);
  }, [showQR, scheduleId]);

  if (!mounted) return null;

  return (
    <>
      <Button 
        onClick={() => setShowQR(true)} 
        variant="secondary" 
        className="w-full sm:w-auto mt-4 sm:mt-0 gap-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
      >
        <QrCode className="h-4 w-4" />
        Tampilkan QR Presensi
      </Button>

      {showQR && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setShowQR(false)}></div>
          <Card className="relative z-10 w-full max-w-md p-8 flex flex-col items-center justify-center space-y-6 shadow-2xl bg-white rounded-2xl animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-800">Scan QR Presensi</h2>
              <p className="text-sm text-slate-500 font-medium">Minta siswa Anda melakukan scan menggunakan HP mereka. Kode otomatis diperbarui tiap 10 detik.</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.05)] border border-slate-100">
              <QRCodeSVG 
                value={JSON.stringify({ type: 'attendance', scheduleId, token })} 
                size={250}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((Date.now() % 10000) / 10000) * 100}%` }}
              />
            </div>
          </Card>
        </div>,
        document.body
      )}
    </>
  );
}
