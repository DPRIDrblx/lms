"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Bell, Calendar, ChevronRight } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const { profile, isCenterStudent } = useAuth();
  const { uiMode } = useTheme();
  const supabase = createClient();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!profile?.class_id || !isCenterStudent) {
        setLoading(false);
        return;
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from("center_notifications")
        .select("*")
        .contains("target_class_ids", [profile.class_id])
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (data) {
        setNotifications(data);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [profile, isCenterStudent, supabase]);

  if (!isCenterStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Bell className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 font-bold max-w-md">Halaman ini khusus untuk siswa Center.</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-[calc(100vh-100px)]",
      uiMode === 'clean' ? "bg-[var(--bg-secondary)] p-4 md:p-8 space-y-6" : ""
    )}>
      <div className="max-w-4xl mx-auto space-y-6 font-sans pb-20">
        
        {uiMode === 'clean' ? (
          <div className="mb-6">
            <h1 className="text-[28px] font-black text-slate-800 tracking-tight">Notifikasi</h1>
            <p className="text-slate-500 font-medium mt-1">Pusat informasi dan pengumuman terbaru untukmu.</p>
          </div>
        ) : (
          <div className="bg-indigo-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border-b-4 border-indigo-600 mb-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/30">
                <Bell className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Pengumuman</h1>
                <p className="text-indigo-100 font-bold text-lg">Jangan sampai ketinggalan informasi penting dari pengajar.</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <CenterLoader size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Belum ada notifikasi</h3>
            <p className="text-slate-500">Tidak ada pengumuman baru dalam 7 hari terakhir.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => { setSelectedNotification(notif); setIsModalOpen(true); }}
                className={cn(
                  "w-full rounded-[20px] p-6 flex items-start gap-4 cursor-pointer transition-all hover:scale-[1.01]",
                  uiMode === 'clean' 
                    ? "bg-white border border-slate-200 hover:border-indigo-500/50 shadow-sm" 
                    : "bg-white border-2 border-slate-100 hover:border-indigo-300 shadow-sm"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-1",
                  uiMode === 'clean' ? "bg-indigo-50 text-indigo-500" : "bg-indigo-100 text-indigo-600"
                )}>
                  <Bell className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-800">{notif.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md w-fit">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(notif.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <p className="text-slate-500 line-clamp-2">{notif.content}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 self-center hidden md:block" />
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pengumuman"
      >
        {selectedNotification && (
          <div className="space-y-4">
            {selectedNotification.banner_url && (
              <div className="w-full rounded-2xl overflow-hidden shadow-sm">
                <img src={selectedNotification.banner_url} alt="Banner" className="w-full h-auto object-contain" />
              </div>
            )}
            <div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">{selectedNotification.title}</h3>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{selectedNotification.content}</p>
            </div>
            <div className="text-xs font-bold text-slate-400">
              Dikirim pada: {new Date(selectedNotification.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setIsModalOpen(false)}>Tutup</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
