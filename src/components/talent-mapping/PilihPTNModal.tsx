"use client";

import { useState, useMemo } from "react";
import { Search, MapPin, X, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ptnDataRaw from "@/data/ptn-data.json";

// The shape of our PTN data
type PTN = {
  name: string;
  majors: string[];
};

const ptnData: PTN[] = ptnDataRaw as PTN[];

// Popular PTNs for the quick chips
const POPULAR_PTN = [
  "UNIVERSITAS INDONESIA",
  "INSTITUT TEKNOLOGI BANDUNG",
  "UNIVERSITAS GADJAH MADA"
];

interface PilihPTNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (ptn: string, major: string) => void;
}

export default function PilihPTNModal({ isOpen, onClose, onSelect }: PilihPTNModalProps) {
  const [search, setSearch] = useState("");
  const [selectedPtn, setSelectedPtn] = useState<string | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);

  // Filter PTN based on search
  const filteredPtn = useMemo(() => {
    if (!search) return [];
    const lowerSearch = search.toLowerCase();
    return ptnData.filter(p => p.name.toLowerCase().includes(lowerSearch));
  }, [search]);

  // Handle Select
  const handleSave = () => {
    if (selectedPtn && selectedMajor) {
      onSelect(selectedPtn, selectedMajor);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />

          {/* Modal Wrapper */}
          <div className="fixed inset-x-0 bottom-0 md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[60] flex flex-col w-full md:w-[600px] h-[85vh] md:h-[80vh] pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: "100%", scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full h-full bg-white rounded-t-[2rem] md:rounded-[2rem] flex flex-col shadow-2xl overflow-hidden origin-bottom pointer-events-auto"
            >
              {/* Handle - hidden on desktop */}
              <div className="flex md:hidden justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Pilih PTN Impian</h2>
                <p className="text-xs text-slate-500">Cari dan simpan universitas tujuanmu</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cari Universitas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                />
              </div>

              {/* View when no search and no selected PTN */}
              {!search && !selectedPtn && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-sm">PTN Populer</h3>
                    <button className="text-xs font-bold text-amber-500">Lihat Semua</button>
                  </div>
                  
                  <div className="space-y-3">
                    {POPULAR_PTN.map((ptnName) => {
                      const ptnInfo = ptnData.find(p => p.name === ptnName);
                      if (!ptnInfo) return null;
                      
                      return (
                        <button 
                          key={ptnName}
                          onClick={() => {
                            setSelectedPtn(ptnName);
                            setSearch("");
                          }}
                          className="w-full bg-white border-2 border-slate-100 hover:border-amber-200 p-4 rounded-2xl flex items-center gap-4 transition-colors text-left group"
                        >
                          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{ptnName}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{ptnInfo.majors.length} Program Studi</p>
                          </div>
                          <div className="ml-auto bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                            Pilih
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Search Results for PTN */}
              {search && !selectedPtn && (
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-500 text-xs mb-2">Hasil Pencarian</h3>
                  {filteredPtn.map(ptn => (
                    <button 
                      key={ptn.name}
                      onClick={() => {
                        setSelectedPtn(ptn.name);
                        setSearch("");
                      }}
                      className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3"
                    >
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-sm text-slate-700">{ptn.name}</span>
                    </button>
                  ))}
                  {filteredPtn.length === 0 && (
                    <div className="text-center text-slate-500 text-sm py-8">
                      Universitas tidak ditemukan.
                    </div>
                  )}
                </div>
              )}

              {/* Selected PTN -> Select Major */}
              {selectedPtn && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <button 
                    onClick={() => setSelectedPtn(null)}
                    className="text-xs font-bold text-amber-500 mb-4 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Kembali ke Daftar PTN
                  </button>
                  
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mb-6 flex items-center gap-3">
                     <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500">
                        <MapPin className="w-5 h-5" />
                     </div>
                     <div>
                       <div className="text-[10px] font-bold text-amber-600 tracking-wider">KAMPUS TERPILIH</div>
                       <h3 className="font-bold text-slate-800 text-sm">{selectedPtn}</h3>
                     </div>
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm mb-3">Pilih Program Studi</h3>
                  
                  {/* Search major */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Cari program studi..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-all"
                    />
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {ptnData.find(p => p.name === selectedPtn)?.majors
                      .filter(m => m.toLowerCase().includes(search.toLowerCase()))
                      .map(major => (
                        <button
                          key={major}
                          onClick={() => setSelectedMajor(major)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                            selectedMajor === major 
                              ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600 text-sm font-medium'
                          }`}
                        >
                          {major}
                          {selectedMajor === major && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                        </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
            
            {/* Sticky Bottom Action */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <button 
                disabled={!selectedPtn || !selectedMajor}
                onClick={handleSave}
                className={`w-full py-4 rounded-2xl font-bold transition-colors ${
                  selectedPtn && selectedMajor
                    ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-[0_4px_14px_rgba(251,191,36,0.4)]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Simpan Pilihan
              </button>
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
}
