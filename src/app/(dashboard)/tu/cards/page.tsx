"use client";

import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Package,
  ArrowRight
} from "lucide-react";
import { useEffect, useState } from "react";

export default function TUCardInventory() {
  const supabase = createClient();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSerial, setNewSerial] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data } = await supabase
      .from("card_inventory")
      .select(`
        *,
        profiles:student_id (full_name)
      `)
      .order("created_at", { ascending: false });
    setCards(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
    // Real-time sync for inventory
    const channel = supabase
      .channel('card-inventory-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'card_inventory' }, () => fetchCards())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const handleAddCard = async () => {
    if (!newSerial) return;
    const { error } = await supabase
      .from("card_inventory")
      .insert({ serial_number: newSerial, status: "available" });
    
    if (error) {
      alert(error.message);
    } else {
      setNewSerial("");
      setIsAddOpen(false);
      fetchCards();
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("Are you sure you want to remove this card from inventory?")) return;
    const { error } = await supabase.from("card_inventory").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchCards();
  };

  const filteredCards = cards.filter(c => 
    c.serial_number.toLowerCase().includes(search.toLowerCase()) ||
    c.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Card Provisioning</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage physical ID card inventory and student linking.</p>
        </div>
        <Button size="lg" className="rounded-2xl h-12 shadow-lg" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-5 w-5 mr-2" /> Add New Card
        </Button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 bg-[var(--bg-secondary)] border-none">
          <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Total Inventory</p>
          <div className="flex items-end justify-between">
            <h4 className="text-3xl font-black text-[var(--text-primary)]">{cards.length}</h4>
            <Package className="h-8 w-8 text-[var(--accent)] opacity-20" />
          </div>
        </Card>
        <Card className="p-6 bg-[var(--bg-secondary)] border-none">
          <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Active Cards</p>
          <div className="flex items-end justify-between">
            <h4 className="text-3xl font-black text-[var(--success)]">{cards.filter(c => c.status === 'active').length}</h4>
            <CheckCircle2 className="h-8 w-8 text-[var(--success)] opacity-20" />
          </div>
        </Card>
        <Card className="p-6 bg-[var(--bg-secondary)] border-none">
          <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Available</p>
          <div className="flex items-end justify-between">
            <h4 className="text-3xl font-black text-[var(--accent)]">{cards.filter(c => c.status === 'available').length}</h4>
            <CreditCard className="h-8 w-8 text-[var(--accent)] opacity-20" />
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden shadow-xl border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search serial number or student..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="rounded-xl h-10">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/30">
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Serial Number</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Linked Student</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Added At</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                        <CreditCard className="h-4 w-4 text-[var(--text-primary)]" />
                      </div>
                      <span className="text-sm font-mono font-bold text-[var(--text-primary)]">{card.serial_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`rounded-full px-3 py-0.5 ${
                      card.status === 'active' ? "bg-[var(--success-light)] text-[var(--success)]" : "bg-[var(--accent-light)] text-[var(--accent)]"
                    }`}>
                      {card.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {card.profiles?.full_name || (
                      <span className="text-[var(--text-tertiary)] italic">Not Linked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--text-tertiary)]">
                    {new Date(card.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[var(--error)] hover:bg-[var(--error-light)]"
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredCards.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-[var(--text-tertiary)]">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">No cards found in inventory.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[var(--bg-primary)] p-8 rounded-3xl shadow-2xl border border-[var(--border)]"
          >
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">New Card Provision</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Enter the serial number of the new physical card.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-1.5 block">Serial Number</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  placeholder="e.g. SN-2024-XXXX"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-none text-sm focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="flex-1 rounded-xl h-12" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button className="flex-1 rounded-xl h-12 font-bold shadow-lg" onClick={handleAddCard}>Add Card</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
