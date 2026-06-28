"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, Sparkles, Utensils, ShieldAlert, Coins } from "lucide-react";
import toast from "react-hot-toast";

const PET_STAGES = {
  1: { emoji: "🥚", name: "Telur Misterius", desc: "Masih dalam bentuk telur. Beri makan agar cepat menetas!" },
  2: { emoji: "🐣", name: "Anak Naga", desc: "Baru menetas! Sangat lapar dan butuh banyak nutrisi." },
  3: { emoji: "🐉", name: "Naga Dewasa", desc: "Kuat dan gagah! Teman setiamu dalam belajar." },
};

export default function DigitalPetPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [pet, setPet] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feeding, setFeeding] = useState(false);

  useEffect(() => {
    if (profile?.id) loadPetData();
  }, [profile]);

  const loadPetData = async () => {
    setLoading(true);
    try {
      // Get Wallet
      const { data: wData } = await supabase.from('wallets').select('*').eq('student_id', profile?.id).single();
      setWallet(wData);

      // Get Pet
      let { data: pData } = await supabase.from('student_pets').select('*').eq('student_id', profile?.id).maybeSingle();
      
      // If no pet exists, create one
      if (!pData) {
        const { data: newPet } = await supabase.from('student_pets').insert({
          student_id: profile?.id,
          name: 'Telur Misterius',
          stage: 1,
          health: 50
        }).select().single();
        pData = newPet;
      }
      
      setPet(pData);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data peliharaan");
    } finally {
      setLoading(false);
    }
  };

  const feedPet = async () => {
    if (!pet || !wallet || feeding) return;
    const FEED_COST = 50;

    if (wallet.balance < FEED_COST) {
      toast.error(`Koin tidak cukup! Butuh ${FEED_COST} Koin untuk membeli makanan.`);
      return;
    }

    setFeeding(true);
    try {
      // Deduct coins
      await supabase.from('wallets').update({ balance: wallet.balance - FEED_COST }).eq('id', wallet.id);
      
      let newHealth = (pet.health || 0) + 20;
      let newStage = pet.stage;
      let newName = pet.name;
      let evolved = false;

      if (newHealth >= 100 && pet.stage < 3) {
        // Evolve!
        newStage += 1;
        newHealth = 50; // Reset health slightly after evolution
        newName = PET_STAGES[newStage as keyof typeof PET_STAGES].name;
        evolved = true;
      } else if (newHealth > 100) {
        newHealth = 100;
      }

      const { error } = await supabase.from('student_pets').update({
        health: newHealth,
        stage: newStage,
        name: newName,
        last_fed: new Date().toISOString()
      }).eq('id', pet.id);

      if (error) throw error;

      if (evolved) {
        toast.success(`Luar biasa! Peliharaanmu berevolusi menjadi ${newName}! 🌟`, { duration: 4000 });
      } else {
        toast.success("Nyam! Peliharaanmu sangat senang! 🍗");
      }

      loadPetData();
    } catch (err) {
      toast.error("Gagal memberi makan");
    } finally {
      setFeeding(false);
    }
  };

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  if (!pet) return null;

  const stageData = PET_STAGES[pet.stage as keyof typeof PET_STAGES] || PET_STAGES[1];
  
  // Determine animation based on stage
  let animationProps = {};
  if (pet.stage === 1) animationProps = { animate: { rotate: [-5, 5, -5] }, transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } };
  if (pet.stage === 2) animationProps = { animate: { y: [0, -10, 0] }, transition: { repeat: Infinity, duration: 1, ease: "easeInOut" } };
  if (pet.stage === 3) animationProps = { animate: { y: [0, -20, 0], scale: [1, 1.05, 1] }, transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">Tamagotchi Belajar 🐾</h1>
          <p className="text-slate-500 font-medium mt-1">Rawat peliharaan virtualmu dengan Koin hasil belajarmu!</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border-2 border-amber-200">
          <Coins className="w-5 h-5 text-amber-500" />
          <span className="font-black text-amber-600 text-lg">{wallet?.balance?.toLocaleString() || 0}</span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
        {/* Environment Decor */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-emerald-900/50 blur-[50px] rounded-t-[100%]" />
        <div className="absolute top-10 left-10 w-20 h-20 bg-amber-500/20 blur-[30px] rounded-full" />
        
        {/* Health Bar */}
        <div className="absolute top-6 w-full max-w-md px-6 z-10 flex items-center gap-3">
          <Heart className={`w-6 h-6 ${pet.health > 20 ? 'text-rose-500 fill-rose-500' : 'text-slate-500'}`} />
          <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-700">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pet.health}%` }}
              className={`h-full rounded-full ${pet.health > 50 ? 'bg-emerald-500' : pet.health > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
            />
          </div>
          <span className="font-black text-white text-sm w-8">{pet.health}%</span>
        </div>

        {/* The Pet */}
        <div className="relative z-10 mt-10 mb-8">
          <motion.div {...animationProps} className="text-[12rem] leading-none select-none drop-shadow-2xl">
            {stageData.emoji}
          </motion.div>
          {feeding && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0 }}
              animate={{ opacity: 1, y: -50, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl"
            >
              🍗
            </motion.div>
          )}
        </div>

        {/* Info & Actions */}
        <div className="relative z-10 text-center space-y-6">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center justify-center gap-2">
              {pet.name} <Sparkles className="w-6 h-6 text-amber-400" />
            </h2>
            <p className="text-slate-400 font-medium mt-2 max-w-md mx-auto">{stageData.desc}</p>
          </div>

          <button
            onClick={feedPet}
            disabled={feeding}
            className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-black text-lg rounded-2xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-3 mx-auto"
          >
            <Utensils className="w-6 h-6 group-hover:animate-bounce" /> 
            Beri Makan (-50 Koin)
          </button>
        </div>
      </div>
    </div>
  );
}
