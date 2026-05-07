"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Users, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Bell,
  ArrowRight,
  Plus,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TUDashboard() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingBills: 0,
    upcomingEvents: 0,
    collectionRate: "0%"
  });
  const [alerts, setAlerts] = useState<any[]>([
    { id: 1, type: "warning", message: "Initial sync in progress..." }
  ]);

  const fetchStats = async () => {
    const [stds, bills, events] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("finance_bills").select("*").eq("status", "pending"),
      supabase.from("school_events").select("*", { count: "exact", head: true })
    ]);

    // Calculate Collection Rate
    const { data: allBills } = await supabase.from("finance_bills").select("status");
    const total = allBills?.length || 0;
    const paid = allBills?.filter((b: any) => b.status === "paid").length || 0;
    const rate = total > 0 ? Math.round((paid / total) * 100) : 0;

    setStats({
      totalStudents: stds.count || 0,
      pendingBills: bills.data?.length || 0,
      upcomingEvents: events.count || 0,
      collectionRate: `${rate}%`
    });

    // Generate real alerts
    const newAlerts = [];
    if (bills.data && bills.data.length > 0) {
      const uniqueUnpaid = Array.from(new Set(bills.data.map((b: any) => b.student_id))).length;
      newAlerts.push({ id: 1, type: "warning", message: `${uniqueUnpaid} students have pending tuition payments.` });
    }
    newAlerts.push({ id: 2, type: "info", message: "Academy portal is synchronized with global database." });
    setAlerts(newAlerts);
  };

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel('tu-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_bills' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  return (
    <div className="space-y-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome, Staff Administrator 👋
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Nusantara School Operational Overview</p>
      </motion.div>

      {user && !profile && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] w-fit">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Hydrating Profile...</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.totalStudents} icon={Users} color="#4F46E5" />
        <StatCard label="Pending SPP" value={stats.pendingBills} icon={CreditCard} color="#F59E0B" />
        <StatCard label="School Events" value={stats.upcomingEvents} icon={Calendar} color="#10B981" />
        <StatCard label="Collection Rate" value={stats.collectionRate} icon={TrendingUp} color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Links */}
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Operational Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/tu/finance">
              <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
                <CreditCard className="h-5 w-5 text-[var(--accent)] mb-2" />
                <p className="text-sm font-bold text-[var(--text-primary)]">Generate SPP Bills</p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Batch create monthly invoices</p>
              </div>
            </Link>
            <Link href="/tu/events">
              <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
                <Calendar className="h-5 w-5 text-[var(--success)] mb-2" />
                <p className="text-sm font-bold text-[var(--text-primary)]">Manage Calendar</p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Add holidays & activities</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Alerts</h2>
            <Badge variant="info">Live Updates</Badge>
          </div>
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div key={alert.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                alert.type === "warning" 
                  ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30 text-orange-800 dark:text-orange-200"
                  : "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-200"
              }`}>
                <Bell className={`h-4 w-4 ${alert.type === "warning" ? "text-orange-500" : "text-indigo-500"}`} />
                <p className="text-xs">{alert.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
