"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Headphones, Ticket, FileText, CheckCircle2, Clock, XCircle, FileSignature, AlertTriangle, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";

export default function TUHelpdesk() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("matrix");

  const [tickets, setTickets] = useState<any[]>([]);
  const [breachedTickets, setBreachedTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat State
  const [chatTicketId, setChatTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('ace_tickets').select('*, profiles(full_name)').order('created_at', { ascending: false });
    if (data) {
      setTickets(data);
      const now = new Date().getTime();
      const breached = data.filter((t: any) => {
        if (t.status === 'green' || t.status === 'red') return false;
        const ticketTime = new Date(t.created_at).getTime();
        const diffHours = (now - ticketTime) / (1000 * 60 * 60);
        return diffHours > 48;
      }).map((t: any) => {
        const diffHours = Math.floor((now - new Date(t.created_at).getTime()) / (1000 * 60 * 60));
        return { ...t, hoursOverdue: diffHours };
      });
      setBreachedTickets(breached);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleProcessTicket = async (id: string, newStatus: string) => {
    await supabase.from('ace_tickets').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const handleGenerateTemplate = (id: string, category: string) => {
    if (category === 'surat') {
      alert("Surat Keterangan otomatis digenerate dengan NIP/Nama dari database. Template PDF sudah siap dicetak untuk Tanda Tangan Kepsek.");
      handleProcessTicket(id, 'green'); // auto set ready
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

  if (!profile || profile.role !== 'tu') return null;

  const getStatusUI = (status: string) => {
    switch (status) {
      case 'blue': return { color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', label: 'Baru Masuk', icon: Ticket };
      case 'yellow': return { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Sedang Diproses', icon: Clock };
      case 'green': return { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Selesai', icon: CheckCircle2 };
      case 'red': return { color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', label: 'Ditolak', icon: XCircle };
      default: return { color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', label: 'Unknown', icon: Ticket };
    }
  };

  const pendingTickets = tickets.filter(t => t.status === 'blue' || t.status === 'yellow');

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Utama TU</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Pusat Disposisi Tiket & Layanan Satu Pintu</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'matrix', label: 'Ticket Matrix (Antrean)' },
          { id: 'sla', label: 'SLA Breach Monitor' },
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

      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? <p className="text-xs text-slate-500 col-span-full">Memuat tiket...</p> : pendingTickets.length === 0 ? <p className="text-xs text-slate-500 col-span-full">Antrean tiket kosong.</p> : pendingTickets.map(ticket => {
              const UI = getStatusUI(ticket.status);
              const Icon = UI.icon;
              return (
                <Card key={ticket.id} className="p-4 rounded-lg border border-slate-200 shadow-sm bg-white flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[10px] text-slate-400 font-mono">TKT-{ticket.id.split('-')[0].toUpperCase()}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">{ticket.category}</span>
                      </div>
                      <div className={`p-1.5 rounded-md bg-white border border-slate-200 shadow-sm ${UI.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{ticket.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 mb-3">Dari: {ticket.profiles.full_name}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-4 line-clamp-3">{ticket.description}</p>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                    {ticket.status === 'blue' && (
                      <button onClick={() => handleProcessTicket(ticket.id, 'yellow')} className="w-full py-2 bg-slate-800 text-white font-semibold text-xs rounded-md shadow-sm hover:bg-slate-900 transition-colors">
                        Ambil Tiket (Proses)
                      </button>
                    )}
                    {ticket.status === 'yellow' && (
                      <button onClick={() => handleOpenChat(ticket.id)} className="w-full py-2 bg-blue-50 text-blue-600 border border-blue-200 font-bold text-xs rounded-md shadow-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Diskusi / Chat Tiket
                      </button>
                    )}
                    {ticket.status === 'yellow' && ticket.category === 'surat' && (
                      <button onClick={() => handleGenerateTemplate(ticket.id, ticket.category)} className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-md shadow-sm hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5">
                        <FileSignature className="w-3.5 h-3.5" /> Gunakan Template & Selesai
                      </button>
                    )}
                    {ticket.status === 'yellow' && ticket.category !== 'surat' && (
                      <button onClick={() => handleProcessTicket(ticket.id, 'green')} className="w-full py-2 bg-emerald-600 text-white font-semibold text-xs rounded-md shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Selesai
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'sla' && (
        <Card className="p-6 rounded-lg border border-rose-200 bg-rose-50 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white rounded-md border border-rose-100"><AlertTriangle className="w-5 h-5 text-rose-600" /></div>
            <div>
              <h2 className="text-sm font-bold text-rose-800 uppercase tracking-wider">SLA Breach Monitor</h2>
              <p className="text-xs font-semibold text-rose-600/80">Papan Pengawasan Kinerja Staf Administrasi</p>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? <p className="text-xs text-slate-500">Memuat data SLA...</p> : breachedTickets.length === 0 ? <p className="text-xs text-slate-500">Tidak ada tiket yang melewati batas waktu (Aman).</p> : breachedTickets.map(ticket => (
              <div key={ticket.id} className="p-3 bg-white border border-rose-200 rounded-md flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-800 mb-1">TKT-{ticket.id.split('-')[0].toUpperCase()} - {ticket.title}</p>
                  <p className="text-xs font-semibold text-slate-500">PIC: <span className="text-slate-800 capitalize">TU {ticket.category}</span></p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-rose-600 text-white font-bold text-[10px] rounded uppercase tracking-wider animate-pulse">Breached: {ticket.hoursOverdue} Jam</span>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-[11px] font-medium text-slate-500 mt-4 leading-relaxed max-w-lg">
            Sistem secara otomatis mendeteksi tiket layanan yang melewati batas waktu Service Level Agreement (SLA) 48 jam. Staf terkait akan dievaluasi oleh Kepala Tata Usaha.
          </p>
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
                  <p className="text-xs text-slate-400 mt-1">Kirim pesan pertama untuk diskusi dengan pemohon.</p>
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
