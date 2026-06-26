"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveArenaEntryPage() {
  const [pin, setPin] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      router.push(`/live-arena/${pin}`);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="p-8 md:p-12 border-none shadow-2xl text-center bg-white">
          <div className="w-20 h-20 bg-indigo-100 rounded-3xl mx-auto flex items-center justify-center mb-8 rotate-12 hover:rotate-0 transition-transform">
             <Gamepad2 className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Live Arena</h1>
          <p className="text-slate-500 font-medium mb-8">Enter the 6-digit Game PIN from your teacher.</p>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <input 
              type="text" 
              placeholder="PIN CODE"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full h-20 text-center text-4xl font-black tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-3xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
            />
            <Button 
              type="submit"
              disabled={pin.length !== 6}
              size="lg" 
              className="w-full h-16 text-lg rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-600/30"
            >
              ENTER ARENA <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
