"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Gem, PlusCircle, CheckCircle2, User, Loader2, MessageSquare } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BountyBoardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState<number>(10);
  const [gems, setGems] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      loadBounties();
      loadGems();
    }
  }, [profile?.id]);

  const loadGems = async () => {
    const { data } = await supabase.from("profiles").select("gems").eq("id", profile?.id).single();
    if (data) setGems(data.gems || 0);
  };

  const loadBounties = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bounties")
      .select("*, profiles!bounties_author_id_fkey(full_name, avatar_url), taker:profiles!bounties_taken_by_id_fkey(full_name)")
      .order("created_at", { ascending: false });
    
    setBounties(data || []);
    setLoading(false);
  };

  const handleCreateBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || reward < 5) {
      toast.error("Isi semua field. Reward minimal 5 Gems.");
      return;
    }
    if (gems < reward) {
      toast.error("Gems kamu tidak cukup!");
      return;
    }

    const newGems = gems - reward;

    const { error } = await supabase.from("bounties").insert({
      author_id: profile?.id,
      title,
      description,
      reward_gems: reward,
      status: 'open'
    });

    if (error) {
      toast.error("Gagal membuat bounty.");
      return;
    }

    // Deduct gems
    await supabase.from("profiles").update({ gems: newGems }).eq("id", profile?.id);
    
    setGems(newGems);
    setShowCreate(false);
    setTitle("");
    setDescription("");
    setReward(10);
    toast.success("Bounty berhasil diposting!");
    loadBounties();
  };

  const handleTakeBounty = async (bountyId: string) => {
    const { error } = await supabase.from("bounties").update({
      status: 'taken',
      taken_by_id: profile?.id
    }).eq("id", bountyId);

    if (!error) {
      toast.success("Bounty diambil! Silakan chat pembuatnya.");
      loadBounties();
    }
  };

  const handleResolveBounty = async (bounty: any) => {
    const { error } = await supabase.from("bounties").update({
      status: 'resolved'
    }).eq("id", bounty.id);

    if (!error) {
      // Reward the taker
      const { data: takerData } = await supabase.from("profiles").select("gems").eq("id", bounty.taken_by_id).single();
      if (takerData) {
        await supabase.from("profiles").update({ gems: (takerData.gems || 0) + bounty.reward_gems }).eq("id", bounty.taken_by_id);
      }
      toast.success("Bounty diselesaikan. Gems telah ditransfer!");
      loadBounties();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pb-24">
      <div className="flex justify-between items-center mb-8 bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Bounty Board</h1>
          <p className="text-slate-300 font-medium">Jadilah Mercenary atau minta bantuan teman! Transaksi ilmu dengan Gems.</p>
        </div>
        
        <div className="relative z-10 flex flex-col items-center bg-white/10 p-4 rounded-2xl border border-white/20">
          <span className="text-xs font-bold text-pink-300 uppercase tracking-widest mb-1">Gems Kamu</span>
          <div className="flex items-center gap-2">
            <Gem className="w-6 h-6 text-pink-400 fill-pink-400" />
            <span className="text-2xl font-black">{gems}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-800">Daftar Misi</h2>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-[0_4px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none transition-all"
        >
          <PlusCircle className="w-5 h-5" /> Buat Sayembara
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-[2rem] border-4 border-indigo-100 shadow-xl mb-8 animate-in slide-in-from-top-4 fade-in">
          <h3 className="text-xl font-black text-slate-800 mb-4">Posting Sayembara Baru</h3>
          <form onSubmit={handleCreateBounty} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Judul Masalah</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Tolong jelaskan Enkripsi RSA" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Deskripsi & Instruksi</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Berikan detail tugas atau pertanyaanmu..." className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-indigo-500 min-h-[100px]" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Imbalan (Gems)</label>
              <div className="relative">
                <Gem className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
                <input type="number" min="5" value={reward} onChange={e => setReward(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 pl-12 font-black text-pink-600 outline-none focus:border-pink-500" required />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-black py-4 rounded-xl shadow-[0_4px_0_rgb(190,24,93)] active:translate-y-1 active:shadow-none transition-all">
                Posting Sayembara
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-xl transition-colors">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><CenterLoader size="md" /></div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
            <p className="font-bold text-slate-400">Belum ada sayembara yang aktif.</p>
          </div>
        ) : (
          bounties.map(bounty => (
            <div key={bounty.id} className={`p-6 rounded-[2rem] border-2 transition-all ${
              bounty.status === 'open' ? 'bg-white border-slate-200 hover:border-pink-200 hover:shadow-lg' :
              bounty.status === 'taken' ? 'bg-indigo-50 border-indigo-200' :
              'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    {bounty.profiles?.avatar_url ? <img src={bounty.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-slate-400" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{bounty.title}</h3>
                    <p className="text-xs font-bold text-slate-400">Oleh {bounty.profiles?.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-pink-100 px-3 py-1.5 rounded-lg border border-pink-200">
                  <Gem className="w-4 h-4 text-pink-500 fill-pink-500" />
                  <span className="font-black text-pink-600">{bounty.reward_gems}</span>
                </div>
              </div>
              
              <p className="text-slate-600 text-sm font-medium mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">{bounty.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">
                  {bounty.status === 'open' && <span className="text-emerald-500">🟢 Terbuka</span>}
                  {bounty.status === 'taken' && <span className="text-indigo-500">🟡 Diambil oleh {bounty.taker?.full_name}</span>}
                  {bounty.status === 'resolved' && <span className="text-slate-500">⚪ Selesai</span>}
                </div>
                
                <div className="flex gap-2">
                  {bounty.status === 'open' && profile?.id !== bounty.author_id && (
                    <button onClick={() => handleTakeBounty(bounty.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl text-sm shadow-[0_3px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none transition-all">
                      Ambil Misi
                    </button>
                  )}
                  
                  {bounty.status === 'taken' && profile?.id === bounty.author_id && (
                    <button onClick={() => handleResolveBounty(bounty)} className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2 rounded-xl text-sm flex items-center gap-2 shadow-[0_3px_0_rgb(190,24,93)] active:translate-y-1 active:shadow-none transition-all">
                      <CheckCircle2 className="w-4 h-4" /> Tandai Selesai
                    </button>
                  )}
                  
                  {bounty.status !== 'resolved' && profile?.id !== bounty.author_id && (
                    <Link href={`/student/messages?to=${bounty.author_id}`}>
                      <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all">
                        <MessageSquare className="w-4 h-4" /> Chat
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
