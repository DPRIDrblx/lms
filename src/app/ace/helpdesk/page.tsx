"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Headphones, Ticket, Plus, FileText, CheckCircle2, Clock, XCircle, AlertTriangle, Loader2, MessageSquare, Send } from "lucide-react";
import { useState, useEffect } from "react";

export default function ACEHelpdesk() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("tiket-saya");
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat State
  const [chatTicketId, setChatTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({ category: 'surat', title: '', description: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchTickets = async () => {
    if (!profile) return;
    const { data } = await supabase.from('ace_tickets').select('*').eq('requestor_id', profile.id).order('created_at', { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitLoading(true);
    try {
      await supabase.from('ace_tickets').insert({
        requestor_id: profile.id,
        ...form
      });
      alert("Tiket permohonan berhasil dikirim ke TU.");
      setForm({ category: 'surat', title: '', description: '' });
      setActiveTab("tiket-saya");
      fetchTickets();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenChat = async (ticketId: string) => {
    setChatTicketId(ticketId);
    setChatLoading(true);
    const { data } = await supabase
      .from('ace_ticket_messages')
      .select('*, profiles(full_name, role)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
    setChatLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatTicketId || !profile || !newMessage.trim()) return;
    const { error } = await supabase.from('ace_ticket_messages').insert({
      ticket_id: chatTicketId,
      sender_id: profile.id,
      message: newMessage
    });
    if (!error) {
      setNewMessage("");
      handleOpenChat(chatTicketId);
    }
  };

  if (!profile) return null;

  const getStatusUI = (status: string) => {
    switch (status) {
      case 'blue': return { color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', label: 'Tiket Dibuat', icon: Ticket };
      case 'yellow': return { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Diproses TU', icon: Clock };
      case 'green': return { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Selesai / Ambil di Loket', icon: CheckCircle2 };
      case 'red': return { color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', label: 'Ditolak', icon: XCircle };
      default: return { color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', label: 'Unknown', icon: Ticket };
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">TU Concierge & Helpdesk</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Pusat Pelayanan Birokrasi Tanpa Tatap Muka</p>
        </div>
        <button onClick={() => setActiveTab("buat-tiket")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Buat Permohonan Baru
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'tiket-saya', label: 'Daftar Tiket Saya' },
          { id: 'buat-tiket', label: 'Formulir Permohonan' },
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'tiket-saya' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {loading ? (
              <p className="text-slate-500 text-sm">Memuat tiket...</p>
            ) : tickets.length === 0 ? (
              <p className="text-slate-500 text-sm p-8 bg-white border border-slate-200 rounded-lg text-center shadow-sm">Belum ada tiket yang dibuat.</p>
            ) : tickets.map(ticket => {
              const UI = getStatusUI(ticket.status);
              const Icon = UI.icon;
              return (
                <Card key={ticket.id} className={`p-4 border rounded-lg transition-colors shadow-sm ${UI.bg}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md bg-white border border-slate-200 shadow-sm ${UI.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[10px] text-slate-400 font-mono">TKT-{ticket.id.split('-')[0].toUpperCase()}</span>
                          <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">{ticket.category}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{ticket.title}</h3>
                        <p className={`text-[11px] font-semibold ${UI.color}`}>{UI.label} &bull; {new Date(ticket.created_at).toLocaleDateString('id-ID')}</p>
                        
                        {ticket.status === 'red' && ticket.rejection_reason && (
                          <div className="mt-2 p-2 bg-white/50 border border-rose-200 rounded-md text-xs text-rose-700 font-medium">
                            <span className="font-bold block mb-0.5">Alasan Penolakan:</span>
                            {ticket.rejection_reason}
                          </div>
                        )}
                        
                        {(ticket.status === 'yellow' || ticket.status === 'blue') && (
                          <button onClick={() => handleOpenChat(ticket.id)} className="mt-3 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 font-bold text-xs rounded-md hover:bg-blue-50 flex items-center gap-1.5 shadow-sm transition-colors">
                            <MessageSquare className="w-3.5 h-3.5" /> Diskusi / Chat Tiket
                          </button>
                        )}
                        
                        {ticket.status === 'green' && ticket.category === 'surat' && (
                          <button className="mt-3 px-3 py-1.5 bg-white text-emerald-700 border border-emerald-200 font-bold text-xs rounded-md hover:bg-emerald-50 flex items-center gap-1.5 shadow-sm transition-colors">
                            <FileText className="w-3.5 h-3.5" /> Unduh Dokumen Digital
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="md:col-span-1">
            <Card className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm sticky top-6">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center mb-3">
                <Headphones className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 mb-2">Disposisi Otomatis</h2>
              <p className="text-xs font-medium text-slate-500 mb-5 leading-relaxed">Sistem cerdas merutekan tiket Anda langsung ke meja Staf TU yang berwenang berdasarkan kategori permohonan.</p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-md border border-slate-200">
                  <span className="font-semibold text-slate-700">Surat-Menyurat</span>
                  <span className="font-bold text-indigo-600">TU Kepegawaian</span>
                </div>
                <div className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-md border border-slate-200">
                  <span className="font-semibold text-slate-700">Sarana Prasarana</span>
                  <span className="font-bold text-indigo-600">TU Perlengkapan</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'buat-tiket' && (
        <Card className="max-w-xl p-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-5">Formulir Permohonan</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Layanan</label>
              <select required value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full p-2.5 rounded-md border border-slate-300 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium">
                <option value="surat">Surat Keterangan Aktif Mengajar</option>
                <option value="sarpras">Laporan Kerusakan Inventaris (Sarpras)</option>
                <option value="surat">Permohonan Legalisir Dokumen</option>
                <option value="it">Kendala IT / Akun</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Permohonan</label>
              <input required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} type="text" className="w-full p-2.5 rounded-md border border-slate-300 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm" placeholder="Contoh: AC Kelas XII MIPA 2 Bocor" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detail Keperluan / Keluhan</label>
              <textarea required value={form.description} onChange={e=>setForm({...form, description: e.target.value})}
                rows={4} 
                className="w-full p-2.5 rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                placeholder="Jelaskan secara spesifik agar staf TU dapat segera memproses..."
              />
            </div>
            
            {form.category === 'surat' && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md flex gap-2 text-indigo-800">
                <FileText className="w-5 h-5 shrink-0 text-indigo-500" />
                <div>
                  <p className="font-bold text-xs mb-0.5">Auto-Generate Template Aktif</p>
                  <p className="text-[10px] leading-relaxed">Sistem akan otomatis merakit PDF Surat Keterangan Aktif dengan nama dan NIP Anda dari sistem setelah TU menekan tombol Setuju.</p>
                </div>
              </div>
            )}

            <button disabled={submitLoading} className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-xs shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {submitLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitLoading ? 'Mengirim...' : 'Kirim Tiket Permohonan'}
            </button>
          </form>
        </Card>
      )}

      {/* Chat Modal */}
      {chatTicketId && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-bold text-slate-800">Diskusi Tiket</h2>
                <p className="text-xs text-slate-500">TKT-{chatTicketId.split('-')[0].toUpperCase()}</p>
              </div>
              <button onClick={() => setChatTicketId(null)} className="text-slate-400 hover:text-slate-600 p-1"><XCircle className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 overflow-y-auto grow bg-slate-50 flex flex-col gap-3 min-h-[300px]">
              {chatLoading ? (
                <p className="text-sm text-slate-500 text-center py-4">Memuat pesan...</p>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">Belum ada obrolan.</p>
                  <p className="text-xs text-slate-400 mt-1">Staf TU mungkin akan membalas pesan di sini.</p>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = msg.sender_id === profile?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                        {!isMe && <p className="text-[10px] font-bold text-indigo-600 mb-1">{msg.profiles?.full_name}</p>}
                        <p>{msg.message}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1">{new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan balasan..." 
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 -ml-0.5" />
                </button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
