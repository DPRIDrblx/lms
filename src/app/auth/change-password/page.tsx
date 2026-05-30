"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, KeyRound, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ChangePasswordPage() {
  const { profile, user, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    // Update password in Auth
    const { error: authError } = await supabase.auth.updateUser({
      password: password
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Remove force_password_change flag
    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ force_password_change: false })
        .eq("id", user.id);

      if (profileError) {
        setError("Failed to update profile flag. " + profileError.message);
        setLoading(false);
        return;
      }

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  };

  if (!profile && !user) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]"><Loader2 className="animate-spin text-[var(--accent)]" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-red-500 p-8 flex flex-col items-center justify-center text-white text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
             <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-inner">
                <ShieldAlert className="h-8 w-8 text-white" />
             </div>
             <h1 className="text-2xl font-black mb-1">Security Action Required</h1>
             <p className="text-sm text-red-100">You are using a temporary password.</p>
          </div>

          <div className="p-8">
             {success ? (
               <div className="text-center py-8">
                 <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <CheckCircle2 className="h-8 w-8" />
                 </div>
                 <h2 className="text-xl font-bold text-[var(--text-primary)]">Password Updated!</h2>
                 <p className="text-sm text-[var(--text-secondary)] mt-2">Redirecting you to the portal...</p>
               </div>
             ) : (
               <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase">New Password</label>
                   <div className="relative">
                     <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
                     <input 
                       type="password" 
                       value={password}
                       onChange={e => setPassword(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                       placeholder="Min. 6 characters"
                     />
                   </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase">Confirm New Password</label>
                   <div className="relative">
                     <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
                     <input 
                       type="password" 
                       value={confirmPassword}
                       onChange={e => setConfirmPassword(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                       placeholder="Retype password"
                     />
                   </div>
                 </div>

                 {error && (
                   <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 text-center font-medium">
                     {error}
                   </div>
                 )}

                 <Button type="submit" loading={loading} className="w-full h-12 text-sm font-bold mt-2">
                   Secure My Account
                 </Button>
               </form>
             )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
