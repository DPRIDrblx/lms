"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string;
  role: "student" | "teacher" | "parent" | "tu";
  xp: number;
  rank: string;
  avatar_url: string | null;
  class_id: string | null;
  face_descriptor: number[] | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, role: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const clearSessionAndLogout = useCallback(async (errorType?: string) => {
    console.error(`Forcing logout due to ${errorType || 'manual trigger'}`);
    
    // 1. Supabase SignOut
    await supabase.auth.signOut();
    
    // 2. Clear all local storage
    localStorage.clear();
    
    // 3. Clear auth cookies
    document.cookie = "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    
    // 4. Reset local states
    setUser(null);
    setProfile(null);
    setSession(null);
    
    // 5. Redirect
    window.location.href = `/login${errorType ? `?error=${errorType}` : ''}`;
  }, [supabase]);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error || !data) {
      console.error("Profile fetch failed or profile missing");
      await clearSessionAndLogout('sync_failed');
      return;
    }

    // Strict ID Binding Check
    if (data.id !== userId) {
      console.error("Critical Security Error: ID Mismatch detected!");
      await clearSessionAndLogout('security_mismatch');
      return;
    }

    setProfile(data as Profile);
  }, [supabase, clearSessionAndLogout]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        }
      } finally {
        // Wait a small bit to ensure profile state is updated if user exists
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, newSession: any) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
          setLoading(false);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  // Loading Timeout Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (loading) {
      timeout = setTimeout(() => {
        // If still loading after 5s, something is wrong
        if (loading && !user) {
          console.error("Auth timeout: Redirecting to login");
          window.location.href = "/login?error=timeout";
        } else if (loading && user && !profile) {
          // User exists but profile sync is stuck or mismatched
          console.error("Profile sync timeout: Force clearing session");
          clearSessionAndLogout('sync_failed');
        }
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [loading, user, profile, clearSessionAndLogout]);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, role: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await clearSessionAndLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
