"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { 
  Plus, 
  Calendar, 
  Trash2, 
  Clock, 
  MapPin, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  category: "academic" | "holiday" | "sports" | "ceremony";
}

export default function EventsManagementPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newEvent, setNewEvent] = useState<Partial<SchoolEvent>>({
    category: "academic",
    event_date: new Date().toISOString().split('T')[0]
  });

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("school_events")
      .select("*")
      .order("event_date", { ascending: true });
    if (data) setEvents(data as SchoolEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [supabase]);

  const handleSave = async () => {
    if (!newEvent.title || !newEvent.event_date) return;
    setSaving(true);
    const { error } = await supabase.from("school_events").insert({
      ...newEvent,
      created_by: profile?.id
    });

    if (error) alert(error.message);
    else {
      setShowModal(false);
      setNewEvent({ category: "academic", event_date: new Date().toISOString().split('T')[0] });
      fetchEvents();
    }
    setSaving(false);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("school_events").delete().eq("id", id);
    fetchEvents();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">School Events Manager</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Add and manage school-wide activities and holidays.</p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={<Plus className="h-4 w-4" />}>
          New Event
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {events.map((event) => (
              <motion.div key={event.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="relative overflow-hidden group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-light)] flex flex-col items-center justify-center text-[var(--accent)] shrink-0">
                      <span className="text-[10px] font-bold uppercase">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-black leading-tight">{new Date(event.event_date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="info" className="text-[9px] uppercase tracking-wider">{event.category}</Badge>
                      </div>
                      <h3 className="font-bold text-[var(--text-primary)] truncate">{event.title}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-[var(--text-tertiary)] font-bold uppercase">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.start_time || "All Day"}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="text-center py-20 border-2 border-dashed">
          <Calendar className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4 opacity-20" />
          <p className="text-[var(--text-secondary)]">No upcoming events scheduled.</p>
        </Card>
      )}

      {/* New Event Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Schedule New Event">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Event Title</label>
            <input 
              type="text" 
              value={newEvent.title || ""} 
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
              placeholder="e.g. Independence Day Ceremony"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Date</label>
              <input 
                type="date" 
                value={newEvent.event_date || ""} 
                onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Time (Optional)</label>
              <input 
                type="time" 
                value={newEvent.start_time || ""} 
                onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select 
              value={newEvent.category} 
              onChange={e => setNewEvent({ ...newEvent, category: e.target.value as any })}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none text-sm"
            >
              <option value="academic">Academic</option>
              <option value="holiday">Holiday</option>
              <option value="sports">Sports</option>
              <option value="ceremony">Ceremony</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea 
              rows={3}
              value={newEvent.description || ""} 
              onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none text-sm resize-none"
              placeholder="Provide event details..."
            />
          </div>
          <Button className="w-full h-12" onClick={handleSave} loading={saving}>Schedule Event</Button>
        </div>
      </Modal>
    </div>
  );
}
