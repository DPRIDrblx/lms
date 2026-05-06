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
  Plus
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TUDashboard() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingBills: 0,
    upcomingEvents: 0,
    collectionRate: "85%"
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: studentCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student");
      const { count: billCount } = await supabase.from("finance_bills").select("*", { count: "exact", head: true }).eq("status", "pending");
      const { count: eventCount } = await supabase.from("school_events").select("*", { count: "exact", head: true });

      setStats(prev => ({
        ...prev,
        totalStudents: studentCount || 0,
        pendingBills: billCount || 0,
        upcomingEvents: eventCount || 0
      }));
    };

    fetchStats();
  }, [supabase]);

  return (
    <div className="space-y-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome, Staff Administrator 👋
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Nusantara School Operational Overview</p>
      </motion.div>

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
            <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30">
              <Bell className="h-4 w-4 text-orange-500" />
              <p className="text-xs text-orange-800 dark:text-orange-200">12 students haven&apos;t paid May tuition fees.</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30">
              <Bell className="h-4 w-4 text-indigo-500" />
              <p className="text-xs text-indigo-800 dark:text-indigo-200">Report cards for Chapter 1 are ready for generation.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
