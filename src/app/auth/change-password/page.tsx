"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ChangePasswordPage() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If they don't need to change password, kick them to dashboard
  if (profile && !profile.force_password_change) {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    
    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ force_password_change: false })
      .eq("id", profile?.id);

    if (profileError) {
      toast.error("Failed to update profile flag: " + profileError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    await refreshProfile();
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 shadow-2xl border-none">
        {success ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-[var(--success)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Password Secured!</h2>
            <p className="text-sm text-[var(--text-secondary)]">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Security Update Required</h1>
                <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-widest">Temporary Credentials Detected</p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              Welcome, <strong className="text-[var(--text-primary)]">{profile?.full_name}</strong>. You are currently logging in using a temporary password assigned by the Academy Staff. You must set a new, secure password before accessing the LMS portal.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none text-sm"
                    placeholder="Enter at least 6 characters"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <input 
                    type="password" 
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none text-sm"
                    placeholder="Type your new password again"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12" loading={loading}>
                Secure My Account
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
