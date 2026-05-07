"use client";

import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Trash2,
  Package,
  Link2,
  Unlink,
  X,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";

export default function TUCardInventory() {
  const supabase = createClient();
  const [cards, setCards] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [linkModal, setLinkModal] = useState<any>(null); // holds the card object to link
  
  const [newSerial, setNewSerial] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const [linking, setLinking] = useState(false);

  const fetchData = useCallback(async () => {
    const [inv, stds, prnts] = await Promise.all([
      supabase.from("card_inventory").select(`*, student:profiles!card_inventory_student_id_fkey(full_name), parent:profiles!card_inventory_parent_id_fkey(full_name)`).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").eq("role", "student").order("full_name"),
      supabase.from("profiles").select("id, full_name").eq("role", "parent").order("full_name")
    ]);
    
    setCards(inv.data || []);
    setStudents(stds.data || []);
    setParents(prnts.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('card-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'card_inventory' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase]);

  const handleAddCard = async () => {
    if (!newSerial) return;
    const { error } = await supabase.from("card_inventory").insert({ serial_number: newSerial, status: "available" });
    if (error) toast.error(error.message);
    else {
      toast.success("Card added to inventory");
      setNewSerial("");
      setIsAddOpen(false);
    }
  };

  const handleLinkCard = async () => {
    if (!selectedStudent || !linkModal) return;
    setLinking(true);

    const { error } = await supabase
      .from("card_inventory")
      .update({ 
        student_id: selectedStudent, 
        parent_id: selectedParent || null,
        status: "active" 
      })
      .eq("id", linkModal.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Smart Linking Successful!");
      setLinkModal(null);
      setSelectedStudent("");
      setSelectedParent("");
    }
    setLinking(false);
  };

  const handleUnlinkCard = async (id: string) => {
    if (!confirm("Are you sure? This will remove the link for both Student and Parent.")) return;
    
    const { error } = await supabase
      .from("card_inventory")
      .update({ student_id: null, parent_id: null, status: "available" })
      .eq("id", id);
    
    if (error) toast.error(error.message);
    else toast.success("Card unlinked and marked as Available.");
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("Delete permanently?")) return;
    const { error } = await supabase.from("card_inventory").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  const filteredCards = cards.filter((c: any) => 
    c.serial_number.toLowerCase().includes(search.toLowerCase()) ||
    c.student?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Smart-Card Provisioning</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage physical hardware lifecycle and multi-account binding.</p>
        </div>
        <Button size="lg" className="rounded-2xl h-12 shadow-xl shadow-[var(--accent)]/10" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-5 w-5 mr-2" /> Add Inventory
        </Button>
      </header>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <Card className="p-6 bg-[var(--bg-secondary)] border-none">
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Inventory Stock</p>
            <div className="flex items-end justify-between">
               <h4 className="text-4xl font-black text-[var(--text-primary)]">{cards.length}</h4>
               <Package className="h-10 w-10 text-[var(--accent)] opacity-10" />
            </div>
         </Card>
         <Card className="p-6 bg-[var(--bg-secondary)] border-none">
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Active Bindings</p>
            <div className="flex items-end justify-between">
               <h4 className="text-4xl font-black text-[var(--success)]">{cards.filter(c => c.status === 'active').length}</h4>
               <CheckCircle2 className="h-10 w-10 text-[var(--success)] opacity-10" />
            </div>
         </Card>
         <Card className="p-6 bg-[var(--bg-secondary)] border-none">
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Unlinked Assets</p>
            <div className="flex items-end justify-between">
               <h4 className="text-4xl font-black text-[var(--accent)]">{cards.filter(c => c.status === 'available').length}</h4>
               <AlertCircle className="h-10 w-10 text-[var(--accent)] opacity-10" />
            </div>
         </Card>
      </div>

      <Card className="p-0 overflow-hidden shadow-2xl border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3 h-4 w-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search serial or student name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/30">
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Serial / HWID</th>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Binding Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Primary (Student)</th>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Secondary (Parent)</th>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                  <td className="px-6 py-5 font-mono text-sm font-black text-[var(--text-primary)]">
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-xl bg-[var(--bg-tertiary)]"><CreditCard className="h-4 w-4" /></div>
                       {card.serial_number}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={card.status === 'active' ? "success" : "default"}>
                      {card.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    {card.student ? (
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">{card.student.full_name[0]}</div>
                          <span className="text-sm font-bold text-[var(--text-primary)]">{card.student.full_name}</span>
                       </div>
                    ) : <span className="text-xs text-[var(--text-tertiary)] italic">Available</span>}
                  </td>
                  <td className="px-6 py-5">
                    {card.parent ? (
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--success-light)] flex items-center justify-center text-[10px] font-bold text-[var(--success)]">{card.parent.full_name[0]}</div>
                          <span className="text-sm font-bold text-[var(--text-primary)]">{card.parent.full_name}</span>
                       </div>
                    ) : <span className="text-xs text-[var(--text-tertiary)]">—</span>}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {card.status === 'available' ? (
                        <Button size="sm" variant="secondary" onClick={() => setLinkModal(card)} icon={<Link2 className="h-3.5 w-3.5" />}>Link</Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-[var(--warning)]" onClick={() => handleUnlinkCard(card.id)} icon={<Unlink className="h-3.5 w-3.5" />}>Unlink</Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-[var(--error)]" onClick={() => handleDeleteCard(card.id)} icon={<Trash2 className="h-3.5 w-3.5" />} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <AnimatePresence>
         {isAddOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-md bg-[var(--bg-primary)] p-8 rounded-3xl shadow-2xl border border-[var(--border)]">
                  <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Hardware Inbound</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-8">Register a new physical card serial into the academy inventory.</p>
                  <div className="space-y-6">
                     <input autoFocus type="text" value={newSerial} onChange={e => setNewSerial(e.target.value)} placeholder="e.g. SN-2024-NIA-001" className="w-full h-14 px-5 rounded-2xl bg-[var(--bg-secondary)] border-none font-mono text-sm focus:ring-2 focus:ring-[var(--accent)]" />
                     <div className="flex gap-3">
                        <Button variant="ghost" className="flex-1 h-12 rounded-xl" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button className="flex-1 h-12 rounded-xl font-bold" onClick={handleAddCard}>Add Card</Button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}

         {linkModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[var(--bg-primary)] p-8 rounded-3xl shadow-2xl border border-[var(--border)]">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Link2 /></div>
                     <div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)]">Smart Linking</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Binding HWID: <span className="font-mono text-[var(--accent)]">{linkModal.serial_number}</span></p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest px-1">Primary Student (Required)</label>
                        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full h-14 px-5 rounded-2xl bg-[var(--bg-secondary)] border-none text-sm focus:ring-2 focus:ring-[var(--accent)] appearance-none">
                           <option value="">Select Student Profile...</option>
                           {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest px-1">Secondary Parent (Optional)</label>
                        <select value={selectedParent} onChange={e => setSelectedParent(e.target.value)} className="w-full h-14 px-5 rounded-2xl bg-[var(--bg-secondary)] border-none text-sm focus:ring-2 focus:ring-[var(--accent)] appearance-none">
                           <option value="">Select Parent Profile...</option>
                           {parents.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                        </select>
                     </div>

                     <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border-l-4 border-[var(--accent)] flex gap-4">
                        <ShieldCheck className="h-6 w-6 text-[var(--accent)] shrink-0" />
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                           Linking a parent enables real-time "Tap Notifications" and synchronized wallet balance oversight for both accounts.
                        </p>
                     </div>

                     <div className="flex gap-3 pt-4">
                        <Button variant="ghost" className="flex-1 h-14 rounded-2xl" onClick={() => setLinkModal(null)}>Cancel</Button>
                        <Button className="flex-1 h-14 rounded-2xl font-black shadow-xl shadow-[var(--accent)]/20" loading={linking} onClick={handleLinkCard}>Bind Accounts</Button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
