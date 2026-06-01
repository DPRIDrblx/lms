"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
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
  Pencil,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const supabase = createClient();
  const [copied, setCopied] = useState(false);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Form states
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Preferences states
  const [prefs, setPrefs] = useState({
    pushNotifications: true,
    emailSummaries: false,
    biometricLogin: false,
    twoFactorAuth: false,
  });

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || "");
      setEditAvatar(profile.avatar_url || "");
    }
    const savedPrefs = localStorage.getItem("nia-user-prefs");
    if (savedPrefs) {
      try {
        setPrefs(JSON.parse(savedPrefs));
      } catch (e) {}
    }
  }, [profile]);

  const savePrefs = (newPrefs: typeof prefs) => {
    setPrefs(newPrefs);
    localStorage.setItem("nia-user-prefs", JSON.stringify(newPrefs));
  };

  const copyId = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editName, avatar_url: editAvatar })
      .eq("id", profile.id);
    setLoading(false);
    if (!error) {
      setIsEditProfileOpen(false);
      window.location.reload();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (!error) {
      setIsChangePasswordOpen(false);
      setNewPassword("");
      alert("Password updated successfully!");
    } else {
      alert("Failed to update password: " + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 font-sans">
      <header>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Settings</h1>
        <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">Manage your account and academy credentials.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[var(--bg-secondary)] backdrop-blur-lg p-8 text-center relative overflow-hidden group rounded-3xl border border-[var(--border)] shadow-sm">
            <div className="absolute top-0 inset-x-0 h-2 bg-indigo-500" />
            
            <button 
              onClick={() => setIsEditProfileOpen(true)}
              className="absolute top-4 right-4 p-2 bg-[var(--bg-primary)] backdrop-blur-sm rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              title="Edit Profile"
            >
              <Pencil className="h-4 w-4" />
            </button>

            <div className="relative mb-6">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white dark:border-slate-800 shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto border-4 border-white dark:border-slate-800 shadow-sm">
                  <User className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
                </div>
              )}
              <div className="absolute bottom-0 right-1/2 translate-x-12 translate-y-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-[var(--border)]">
                <Smartphone className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{profile?.full_name}</h2>
            <p className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">{profile?.role}</p>
            
            <div className="mt-8 pt-6 border-t border-[var(--border)]/50 space-y-4">
              <div className="text-left">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Academy Unique ID</p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)]/50">
                  <p className="text-[11px] font-mono font-medium text-[var(--text-secondary)] truncate flex-1">{profile?.id}</p>
                  <button 
                    onClick={copyId}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-2 leading-relaxed">
                  Give this code to your parent to link your profiles.
                </p>
              </div>
            </div>
          </div>

          <Button 
            variant="danger" 
            className="w-full h-12 rounded-2xl shadow-sm"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>

        {/* Options List */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--bg-secondary)] backdrop-blur-lg rounded-3xl overflow-hidden border border-[var(--border)] shadow-sm">
            <div className="p-6 border-b border-[var(--border)]/50 bg-[var(--bg-tertiary)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Security & Privacy</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              <button 
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[15px] font-bold text-[var(--text-primary)]">Change Password</p>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">Update your login credentials</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>

              <button 
                onClick={() => savePrefs({ ...prefs, twoFactorAuth: !prefs.twoFactorAuth })}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-bold text-[var(--text-primary)]">Two-Factor Auth</p>
                      {prefs.twoFactorAuth && <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold uppercase">Enabled</span>}
                    </div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">Enable SMS or App verification</p>
                  </div>
                </div>
                <div className={`h-6 w-11 rounded-full p-1 transition-colors cursor-pointer ${prefs.twoFactorAuth ? "bg-indigo-500" : "bg-[var(--bg-tertiary)]"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${prefs.twoFactorAuth ? "translate-x-5" : ""}`} />
                </div>
              </button>

              <button 
                onClick={() => savePrefs({ ...prefs, biometricLogin: !prefs.biometricLogin })}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[15px] font-bold text-[var(--text-primary)]">Biometric Login</p>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">Use FaceID or Fingerprint</p>
                  </div>
                </div>
                <div className={`h-6 w-11 rounded-full p-1 transition-colors cursor-pointer ${prefs.biometricLogin ? "bg-indigo-500" : "bg-[var(--bg-tertiary)]"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${prefs.biometricLogin ? "translate-x-5" : ""}`} />
                </div>
              </button>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] backdrop-blur-lg rounded-3xl overflow-hidden border border-[var(--border)] shadow-sm">
            <div className="p-6 border-b border-[var(--border)]/50 bg-[var(--bg-tertiary)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Notifications</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              <button 
                onClick={() => savePrefs({ ...prefs, pushNotifications: !prefs.pushNotifications })}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[15px] font-bold text-[var(--text-primary)]">Push Notifications</p>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">Daily updates & class alerts</p>
                  </div>
                </div>
                <div className={`h-6 w-11 rounded-full p-1 transition-colors cursor-pointer ${prefs.pushNotifications ? "bg-indigo-500" : "bg-[var(--bg-tertiary)]"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${prefs.pushNotifications ? "translate-x-5" : ""}`} />
                </div>
              </button>

              <button 
                onClick={() => savePrefs({ ...prefs, emailSummaries: !prefs.emailSummaries })}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[15px] font-bold text-[var(--text-primary)]">Email Summaries</p>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">Weekly progress reports</p>
                  </div>
                </div>
                <div className={`h-6 w-11 rounded-full p-1 transition-colors cursor-pointer ${prefs.emailSummaries ? "bg-indigo-500" : "bg-[var(--bg-tertiary)]"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${prefs.emailSummaries ? "translate-x-5" : ""}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsEditProfileOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[var(--bg-primary)] rounded-3xl shadow-xl overflow-hidden border border-[var(--border)]"
            >
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-tertiary)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Edit Profile</h2>
                <button onClick={() => setIsEditProfileOpen(false)} className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] hover:shadow-sm text-[var(--text-secondary)] transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-[var(--text-primary)]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Avatar URL</label>
                  <input 
                    type="url" 
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-[var(--text-primary)]"
                    placeholder="https://..."
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
                  <Button type="submit" loading={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Save Changes</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Change Password Modal */}
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsChangePasswordOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[var(--bg-primary)] rounded-3xl shadow-xl overflow-hidden border border-[var(--border)]"
            >
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-tertiary)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Change Password</h2>
                <button onClick={() => setIsChangePasswordOpen(false)} className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] hover:shadow-sm text-[var(--text-secondary)] transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-[var(--text-primary)]"
                    required
                    minLength={6}
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                  <Button type="submit" loading={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Update Password</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
