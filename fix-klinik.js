const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/student/klinik/page.tsx', 'utf8');

const startStr = `filteredClinics.map(clinic => {`;
const endStr = `                  })
                ) : (`;

const newMapStr = `filteredClinics.map(clinic => {
                    const date = new Date(clinic.schedule_date);
                    
                    if (clinic.status === 'completed' || clinic.status === 'rejected') {
                      return (
                        <div key={clinic.id} className="bg-white rounded-[20px] border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all">
                          <div className="h-32 bg-[#70C16C] relative overflow-hidden flex items-end p-5">
                            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px'}}></div>
                            <div className="absolute right-2 bottom-0 opacity-20 pointer-events-none">
                              <Users className="w-32 h-32 text-white -mr-4 -mb-4" />
                            </div>
                            <h2 className="text-white font-black text-3xl tracking-tight relative z-10">{clinic.subject}</h2>
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                                {clinic.status === 'completed' ? 'Selesai' : 'Ditolak'}
                              </span>
                              {clinic.status === 'completed' && (
                                <span className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                                </span>
                              )}
                              {clinic.status === 'completed' && !clinic.rating && (
                                <span className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-orange-100 text-[#E87525] uppercase tracking-wider">
                                  Belum isi rating
                                </span>
                              )}
                              {clinic.status === 'completed' && clinic.rating && (
                                <span className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-blue-100 text-blue-600 uppercase tracking-wider">
                                  Sudah isi rating
                                </span>
                              )}
                            </div>
                            
                            <h3 className="text-[17px] font-black text-slate-800 mb-4 leading-tight">
                              Klinik PR - {clinic.subject}
                            </h3>
                            
                            <div className="space-y-2 mb-5">
                              <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                {date.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                {clinic.schedule_time.substring(0, 5)} - {
                                  (() => {
                                    const [h, m] = clinic.schedule_time.substring(0,5).split(':').map(Number);
                                    const d = new Date();
                                    d.setHours(h, m + 45);
                                    return d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
                                  })()
                                } WIB
                              </div>
                              <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                  <User className="w-2.5 h-2.5 text-slate-500" />
                                </div>
                                {clinic.tutor?.full_name || 'Menunggu Konfirmasi Tutor'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-auto">
                              <Button 
                                onClick={() => {
                                  setSelectedClinic(clinic);
                                  setIsDetailModalOpen(true);
                                }}
                                variant="ghost"
                                className={cn("border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 w-full h-11 rounded-[12px] text-[13px] font-bold", clinic.status === 'completed' && !clinic.rating ? "col-span-1" : "col-span-2")}
                              >
                                Lihat Detail
                              </Button>
                              {clinic.status === 'completed' && !clinic.rating && (
                                <Button 
                                  onClick={() => {
                                    setSelectedClinic(clinic);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="w-full h-11 bg-[#F16B25] hover:bg-[#D95F1E] text-white rounded-[12px] text-[13px] font-bold shadow-sm"
                                >
                                  Beri Rating
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={clinic.id} className="bg-white rounded-[20px] border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md hover:border-[#108B96]/30 transition-all">
                        <div className="h-28 bg-[#E6F6F4] relative overflow-hidden flex items-center justify-center">
                           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                           <Beaker className="w-14 h-14 text-[#108B96]/30" />
                           <div className="absolute top-3 left-3">
                             <span className={cn("px-2.5 py-1 rounded-[8px] text-[10px] font-black uppercase tracking-wider", 
                               clinic.status === 'approved' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                             )}>
                               {getStatusLabel(clinic.status)}
                             </span>
                           </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-[17px] font-black text-slate-800 mb-1 leading-tight">{clinic.subject}</h3>
                          <p className="text-slate-500 text-[13px] font-medium line-clamp-2 mb-4 flex-1">{clinic.topic}</p>
                          
                          <div className="space-y-2 mb-5">
                            <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </div>
                            <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                              <Clock className="w-4 h-4 text-slate-400" />
                              {clinic.schedule_time.substring(0, 5)} WIB
                            </div>
                            <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                              <Users className="w-4 h-4 text-slate-400" />
                              {clinic.tutor?.full_name || 'Menunggu Konfirmasi Tutor'}
                            </div>
                          </div>
                          
                          <div className="mt-auto">
                            <Button 
                              onClick={() => {
                                setSelectedClinic(clinic);
                                setIsDetailModalOpen(true);
                              }}
                              variant="ghost"
                              className="w-full border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 h-11 rounded-[12px] text-[13px] font-bold"
                            >
                              Lihat Detail
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
`;

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);
if (startIndex !== -1 && endIndex !== -1) {
  const newCode = code.substring(0, startIndex) + newMapStr + code.substring(endIndex);
  
  // ensure User is imported
  let finalCode = newCode;
  if (!finalCode.includes('User,')) {
    finalCode = finalCode.replace('BookOpen, Calendar, Clock, CheckCircle2, ChevronRight, Star, AlertCircle, Plus, Users, Beaker', 'BookOpen, Calendar, Clock, CheckCircle2, ChevronRight, Star, AlertCircle, Plus, Users, Beaker, User');
  }
  fs.writeFileSync('src/app/(dashboard)/student/klinik/page.tsx', finalCode);
  console.log("Successfully replaced card code.");
} else {
  console.log("Could not find start/end string");
}
