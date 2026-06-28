"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Wallet, PieChart, Lock, TrendingDown, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function PrincipalKeuangan() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [totalPayroll, setTotalPayroll] = useState(0);
  const [totalBenefits, setTotalBenefits] = useState(0);
  const [claimedBenefits, setClaimedBenefits] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Calculate Payroll Projection
    const { data: teachersData } = await supabase.from('profiles').select('*').eq('role', 'teacher');
    const { data: attData } = await supabase.from('ace_attendances').select('*');
    
    let computedPayroll = 0;
    if (teachersData) {
      teachersData.forEach((t: any) => {
        const teacherAtts = (attData || []).filter((a: any) => a.teacher_id === t.id);
        let lateCount = 0;
        let overtimeCount = 0;
        
        teacherAtts.forEach((a: any) => {
          const date = new Date(a.created_at);
          const day = date.getDay();
          if (day === 0 || day === 6) {
            overtimeCount++;
          } else {
            if (date.getHours() >= 7 && (date.getHours() > 7 || date.getMinutes() > 0)) {
              lateCount++;
            }
            if (a.check_out_time) {
              const outDate = new Date(a.check_out_time);
              if (outDate.getHours() >= 17 && (outDate.getHours() > 17 || outDate.getMinutes() > 0)) {
                overtimeCount++;
              }
            }
          }
        });
        
        const base = t.base_salary || 4500000;
        const net = base - (lateCount * 50000) + (overtimeCount * 50000);
        computedPayroll += net;
      });
    }
    setTotalPayroll(computedPayroll);

    // 2. Calculate Benefits
    const { data: benefitsData } = await supabase.from('ace_benefits').select('*').eq('year', new Date().getFullYear());
    if (benefitsData) {
      const sumLimit = benefitsData.reduce((acc: any, curr: any) => acc + curr.limit_amount, 0);
      const sumClaim = benefitsData.reduce((acc: any, curr: any) => acc + curr.claimed_amount, 0);
      setTotalBenefits(sumLimit);
      setClaimedBenefits(sumClaim);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  if (!profile || profile.role !== 'principal') return null;

  const budgetUsagePercent = totalBenefits > 0 ? (claimedBenefits / totalBenefits) * 100 : 0;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pengawasan Anggaran</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Executive Financial Oversight & Disbursement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-indigo-900 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <Wallet className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">Total Payroll Bulan Ini</h2>
            <p className="text-4xl font-black mb-1">
              {loading ? "..." : `Rp ${totalPayroll.toLocaleString('id-ID')}`}
            </p>
            <p className="text-xs text-indigo-300 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-emerald-400" /> Lebih rendah 2.4% dari bulan lalu
            </p>
            
            <button className="mt-8 w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Authorize Disbursement (Kirim ke Bank)
            </button>
          </div>
        </Card>

        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Pagu Anggaran Benefit {new Date().getFullYear()}</h2>
              <p className="text-xs text-slate-500 font-medium">Klaim Tunjangan Kesehatan & Kafetaria</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-600">Terpakai</span>
                <span className="font-bold text-slate-800">Rp {claimedBenefits.toLocaleString('id-ID')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${budgetUsagePercent > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-slate-400">Total Pagu: Rp {totalBenefits.toLocaleString('id-ID')}</span>
                <span className="font-bold text-slate-500">{budgetUsagePercent.toFixed(1)}%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                <div className="text-left">
                  <p className="font-bold text-slate-800 text-sm">Financial Projection Matrix</p>
                  <p className="text-xs text-slate-500">Lihat proyeksi pembengkakan anggaran Q3</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
