"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  User, 
  Copy, 
  Shield, 
  Bell, 
  Lock, 
  LogOut, 
  ChevronRight,
  CheckCircle2,
  Mail,
  Smartphone,
  Fingerprint,
  Filter
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage your account and academy credentials.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-[var(--accent)]" />
            <div className="relative mb-6">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-[var(--bg-secondary)] shadow-xl" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[var(--accent-light)] flex items-center justify-center mx-auto border-4 border-[var(--bg-secondary)] shadow-xl">
                  <User className="h-10 w-10 text-[var(--accent)]" />
                </div>
              )}
              <div className="absolute bottom-0 right-1/2 translate-x-12 translate-y-2 p-2 bg-white rounded-full shadow-lg border border-[var(--border)]">
                <Smartphone className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{profile?.full_name}</h2>
            <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest mt-1">{profile?.role}</p>
            
            <div className="mt-8 pt-8 border-t border-[var(--border)] space-y-4">
              <div className="text-left">
                <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Academy Unique ID</p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] group">
                  <p className="text-[10px] font-mono font-medium text-[var(--text-primary)] truncate flex-1">{profile?.id}</p>
                  <button 
                    onClick={copyId}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--accent)] transition-colors"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] mt-2 leading-relaxed">
                  Give this code to your parent to link your profiles.
                </p>
              </div>
            </div>
          </Card>

          <Button 
            variant="danger" 
            className="w-full h-12 rounded-xl shadow-sm"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>

        {/* Options List */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Security & Privacy</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {[
                { icon: Lock, label: "Change Password", sub: "Update your login credentials" },
                { icon: Shield, label: "Two-Factor Auth", sub: "Enable SMS or App verification", badge: "New" },
                { icon: Fingerprint, label: "Biometric Login", sub: "Use FaceID or Fingerprint", toggle: true },
              ].map((item, i) => (
                <button key={i} className="w-full p-5 flex items-center justify-between hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)]">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{item.label}</p>
                        {item.badge && <Badge className="text-[9px] px-1.5 py-0 bg-[var(--accent)]">{item.badge}</Badge>}
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">{item.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Notifications</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {[
                { icon: Bell, label: "Push Notifications", sub: "Daily updates & class alerts", toggle: true, checked: true },
                { icon: Mail, label: "Email Summaries", sub: "Weekly progress reports", toggle: true },
              ].map((item, i) => (
                <div key={i} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)]">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-[var(--text-primary)]">{item.label}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{item.sub}</p>
                    </div>
                  </div>
                  <div className={`h-6 w-11 rounded-full p-1 transition-colors cursor-pointer ${item.checked ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}>
                    <div className={`h-4 w-4 rounded-full bg-white transition-transform ${item.checked ? "translate-x-5" : ""}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
