"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { CalendarClock, MapPin, Users, Clock, BookOpen, AlertCircle, X, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function ACEJadwal() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [pendingSubs, setPendingSubs] = useState<any[]>([]);
  const [piketTeachers, setPiketTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentDayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(currentDayOfWeek);

  // Modal State
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'jurnal' | 'detail'>('jurnal');

  // Forms
  const [journalForm, setJournalForm] = useState({ date: '', materi: '', siswa_hadir: '', catatan: '' });
  const [substituteTeacherId, setSubstituteTeacherId] = useState('');
  const [substituteDate, setSubstituteDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [journalStudents, setJournalStudents] = useState<any[]>([]);
  const [studentPresences, setStudentPresences] = useState<Record<string, string>>({});
  const [allLogbooks, setAllLogbooks] = useState<any[]>([]);

  useEffect(() => {
    if (!substituteDate) return;
    const fetchPiket = async () => {
      const dateObj = new Date(substituteDate);
      const day = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
      
      const { data } = await supabase
        .from('ace_piket_schedules')
        .select('teacher_id, profiles!inner(full_name)')
        .eq('day_of_week', day);
        
      if (data && data.length > 0) {
        const pTeachers = data.map((d: any) => ({ id: d.teacher_id, full_name: d.profiles?.full_name || 'Tanpa Nama' }));
        setPiketTeachers(pTeachers);
        setSubstituteTeacherId(pTeachers[0].id);
      } else {
        setPiketTeachers([]);
        setSubstituteTeacherId('');
      }
    };
    fetchPiket();
  }, [substituteDate, supabase]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;
      // Fetch normal schedules
      const { data: normalSch } = await supabase.from('ace_schedules').select('*').eq('teacher_id', profile.id).order('day_of_week').order('start_time');
      
      // Fetch temporary schedules as substitute
      const { data: mySubs } = await supabase.from('ace_substitutions')
        .select('*, schedule:schedule_id(*)')
        .eq('substitute_id', profile.id)
        .eq('status', 'accepted');
        
      let allSch = normalSch || [];
      if (mySubs) {
        const tempSch = mySubs.map((sub: any) => ({
          ...sub.schedule,
          id: sub.schedule.id + '_sub', // prevent react key duplication if any
          real_schedule_id: sub.schedule.id,
          is_substitute: true,
          substitution_date: sub.substitution_date
        }));
        allSch = [...allSch, ...tempSch];
      }
      setSchedules(allSch);

      // Fetch pending substitution requests assigned to me
      const { data: pSubs } = await supabase.from('ace_substitutions')
        .select('*, requestor:requestor_id(full_name), schedule:schedule_id(*)')
        .eq('substitute_id', profile.id)
        .eq('status', 'pending_sub');
      if (pSubs) setPendingSubs(pSubs);

      // Fetch existing logbooks to prevent duplicates
      const { data: logs } = await supabase.from('ace_logbooks').select('schedule_id, date').eq('teacher_id', profile.id);
      if (logs) setAllLogbooks(logs);

      setLoading(false);
    };
    fetchData();
  }, [profile, supabase]);

  const calculateNextDate = (dayOfWeek: number) => {
    const today = new Date();
    const currentDay = today.getDay() === 0 ? 7 : today.getDay();
    let diff = dayOfWeek - currentDay;
    if (diff < 0) diff += 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + diff);
    return nextDate.toISOString().split('T')[0];
  };

  const openModal = async (sch: any) => {
    setSelectedSchedule(sch);
    setModalTab('jurnal');
    const nextDate = calculateNextDate(sch.day_of_week);
    setJournalForm({ date: nextDate, materi: '', siswa_hadir: '', catatan: '' });
    setSubstituteDate(nextDate);

    setJournalStudents([]);
    setStudentPresences({});
    
    // Fetch students based on class_name
    try {
      const classNameClean = sch.class_name.replace(/kelas/i, '').trim();
      const { data: classMatch } = await supabase
        .from('classes')
        .select('id, name')
        .ilike('name', `%${classNameClean}%`)
        .limit(1)
        .single();
        
      if (classMatch) {
        const { data: students } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'student')
          .eq('class_id', classMatch.id)
          .order('full_name');
          
        if (students && students.length > 0) {
          setJournalStudents(students);
          const presences: Record<string, string> = {};
          students.forEach((s: any) => presences[s.id] = 'hadir');
          setStudentPresences(presences);
        }
      }
    } catch (e) {
      // ignore silently if class doesn't match
    }
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !profile) return;
    setIsSubmitting(true);
    try {
      const presencesArray = journalStudents.map(s => ({
        student_id: s.id,
        name: s.full_name,
        status: studentPresences[s.id]
      }));

      let siswaHadirVal = parseInt(journalForm.siswa_hadir) || 0;
      if (journalStudents.length > 0) {
        const hadirCount = Object.values(studentPresences).filter(v => v === 'hadir').length;
        siswaHadirVal = hadirCount;
      }

      const { error } = await supabase.from('ace_logbooks').insert({
        teacher_id: profile.id,
        schedule_id: selectedSchedule.real_schedule_id || selectedSchedule.id,
        date: journalForm.date,
        materi: `(${selectedSchedule.subject_name} - ${selectedSchedule.class_name}) ${journalForm.materi}`,
        siswa_hadir: siswaHadirVal,
        catatan: journalForm.catatan,
        student_presences: presencesArray.length > 0 ? presencesArray : []
      });
      if (error) throw error;
      
      // Update local state
      setAllLogbooks(prev => [...prev, { schedule_id: selectedSchedule.real_schedule_id || selectedSchedule.id, date: journalForm.date }]);
      
      alert('Jurnal berhasil disimpan!');
      setSelectedSchedule(null);
    } catch (err: any) {
      alert('Error menyimpan jurnal: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubstituteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !substituteTeacherId || !profile) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ace_substitutions').insert({
        schedule_id: selectedSchedule.real_schedule_id || selectedSchedule.id,
        requestor_id: profile.id,
        substitute_id: substituteTeacherId,
        substitution_date: substituteDate,
        status: 'pending_tu'
      });
      if (error) throw error;
      alert('Permintaan guru piket berhasil dikirim ke TU!');
      setSelectedSchedule(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubResponse = async (id: string, accept: boolean) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ace_substitutions').update({
        status: accept ? 'accepted' : 'rejected_sub'
      }).eq('id', id);
      if (error) throw error;
      alert(accept ? "Tawaran mengajar diterima!" : "Tawaran ditolak!");
      window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return null;

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const filteredSchedules = schedules.filter(sch => Number(sch.day_of_week) === selectedDay);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal KBM</h1>
        <p className="text-slate-500 font-medium mt-1">Roster Mengajar Resmi Sekolah</p>
      </div>

      {pendingSubs.length > 0 && (
        <div className="space-y-3">
          {pendingSubs.map(sub => (
            <Card key={sub.id} className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900">Tawaran Guru Piket / Pengganti</h3>
                  <p className="text-sm font-medium text-amber-700 mt-1">
                    <span className="font-bold">{sub.requestor?.full_name}</span> meminta Anda menggantikan kelas 
                    <span className="font-bold"> {sub.schedule?.subject_name} ({sub.schedule?.class_name})</span> pada 
                    <span className="font-bold"> {sub.substitution_date}</span> jam <span className="font-bold">{sub.schedule?.start_time.substring(0,5)}</span>.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button disabled={isSubmitting} onClick={() => handleSubResponse(sub.id, false)} className="px-4 py-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 font-bold text-xs rounded-lg shadow-sm transition-colors">
                  Tolak
                </button>
                <button disabled={isSubmitting} onClick={() => handleSubResponse(sub.id, true)} className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 font-bold text-xs rounded-lg shadow-sm transition-colors">
                  Terima Jadwal
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {days.map((day, idx) => {
          const isSelected = selectedDay === (idx + 1);
          return (
            <div 
              key={day} 
              onClick={() => setSelectedDay(idx + 1)}
              className={`px-6 py-3 rounded-2xl shrink-0 font-bold text-sm border-2 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {loading ? <p>Memuat jadwal...</p> : filteredSchedules.length === 0 ? (
          <div className="text-center p-12 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
            <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Belum ada jadwal KBM untuk hari ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchedules.map(sch => (
              <Card 
                key={sch.id} 
                onClick={() => openModal(sch)}
                className={`p-6 border-2 rounded-2xl flex items-center justify-between group transition-all cursor-pointer hover:-translate-y-1 ${sch.is_substitute ? 'border-amber-200 bg-amber-50 hover:border-amber-400 hover:shadow-amber-100' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-indigo-100'} hover:shadow-lg`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 border rounded-2xl flex flex-col items-center justify-center transition-colors ${sch.is_substitute ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-indigo-600 group-hover:bg-indigo-50'}`}>
                    <span className="font-black text-lg leading-none mb-1">{sch.start_time.substring(0,5)}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mulai</span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      {sch.subject_name}
                      {sch.is_substitute && <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full uppercase">Piket</span>}
                    </h3>
                    <div className="flex items-center gap-3 text-slate-500 mt-1">
                      <span className="flex items-center gap-1 text-sm font-bold"><Users className="w-4 h-4" /> {sch.class_name}</span>
                      <span className="flex items-center gap-1 text-sm font-bold"><MapPin className="w-4 h-4" /> {sch.room || "Ruang Kelas"}</span>
                      {sch.is_substitute && <span className="flex items-center gap-1 text-xs font-bold text-amber-600">({sch.substitution_date})</span>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Jurnal & Detail */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-black text-slate-800 text-lg">{selectedSchedule.subject_name} - {selectedSchedule.class_name}</h2>
              <button onClick={() => setSelectedSchedule(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button 
                onClick={() => setModalTab('jurnal')} 
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'jurnal' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
              >
                Isi Jurnal KBM
              </button>
              <button 
                onClick={() => setModalTab('detail')} 
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'detail' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
              >
                Detail & Kehadiran
              </button>
            </div>

            <div className="p-6">
              {modalTab === 'jurnal' && (() => {
                const isAlreadySubmitted = selectedSchedule && allLogbooks.some(l => 
                  l.schedule_id === (selectedSchedule.real_schedule_id || selectedSchedule.id) && 
                  l.date === journalForm.date
                );
                
                return (
                  <form onSubmit={handleJournalSubmit} className="space-y-4">
                    {isAlreadySubmitted && (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-amber-500" />
                        Jurnal untuk jadwal dan tanggal ini sudah diisi.
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                        <input type="date" required value={journalForm.date} onChange={e => setJournalForm({...journalForm, date: e.target.value})} disabled={isAlreadySubmitted} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 disabled:opacity-50" />
                      </div>
                    {journalStudents.length === 0 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Presensi Siswa</label>
                        <input type="text" placeholder="Cth: Hadir semua / 2 Sakit" required value={journalForm.siswa_hadir} onChange={e => setJournalForm({...journalForm, siswa_hadir: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                      </div>
                    )}
                  </div>
                  {journalStudents.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 p-2 px-3 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
                        <span>Daftar Siswa Kelas {selectedSchedule?.class_name}</span>
                        <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200">{journalStudents.length} Siswa</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {journalStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between p-2 px-3 hover:bg-slate-50 transition-colors">
                            <span className="text-sm font-medium text-slate-700 truncate mr-2">{student.full_name}</span>
                            <div className="flex gap-1 shrink-0">
                              {['hadir', 'sakit', 'izin', 'alpha'].map(status => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => setStudentPresences(prev => ({ ...prev, [student.id]: status }))}
                                  className={`px-2 py-1 text-[10px] font-bold rounded capitalize transition-colors ${studentPresences[student.id] === status ? (status === 'hadir' ? 'bg-emerald-500 text-white' : status === 'alpha' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white') : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                  {status.substring(0,1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Materi / Kegiatan</label>
                      <textarea required disabled={isAlreadySubmitted} placeholder="Deskripsikan materi yang diajarkan..." rows={3} value={journalForm.materi} onChange={e => setJournalForm({...journalForm, materi: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm resize-none disabled:opacity-50"></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kendala (Opsional)</label>
                      <input type="text" disabled={isAlreadySubmitted} placeholder="Ada kendala selama KBM?" value={journalForm.catatan} onChange={e => setJournalForm({...journalForm, catatan: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm disabled:opacity-50" />
                    </div>
                    <button disabled={isSubmitting || isAlreadySubmitted} type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-slate-400">
                      {isSubmitting ? 'Menyimpan...' : (isAlreadySubmitted ? 'Telah Disimpan' : 'Simpan Jurnal')}
                    </button>
                  </form>
                );
              })()}

              {modalTab === 'detail' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-around text-center">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Jam Mulai</p>
                      <p className="text-xl font-black text-slate-800">{selectedSchedule.start_time.substring(0,5)}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200"></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Jam Selesai</p>
                      <p className="text-xl font-black text-slate-800">{selectedSchedule.end_time.substring(0,5)}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                      Tidak Hadir (Ajukan Guru Piket)
                    </h3>
                    <form onSubmit={handleSubstituteSubmit} className="space-y-4 bg-rose-50 p-4 rounded-xl border border-rose-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Absen</label>
                          <input type="date" required value={substituteDate} onChange={e => setSubstituteDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Guru Piket</label>
                          <select required value={substituteTeacherId} onChange={e => setSubstituteTeacherId(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white">
                            {piketTeachers.length > 0 ? (
                              piketTeachers.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                              ))
                            ) : (
                              <option value="">-- Tidak Ada Guru Piket Terjadwal --</option>
                            )}
                          </select>
                        </div>
                      </div>
                      <button disabled={isSubmitting} type="submit" className="w-full py-2.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50">
                        {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan ke TU'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
