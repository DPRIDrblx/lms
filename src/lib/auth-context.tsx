"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string | null;
  role: "student" | "teacher" | "parent" | "tu" | "principal" | "sobat_nia" | "pengurus_nia" | "operator_les" | "tutor";
  xp: number;
  rank: string;
  avatar_url: string | null;
  class_id?: string | null;
  class_name?: string | null;
  face_descriptor?: any | null;
  has_seen_center_update?: boolean;
  force_password_change?: boolean;
  status?: "pending" | "approved" | "rejected";
  faction?: string;
  active_title?: string;
  is_hod?: boolean;
  is_hod_assistant?: boolean;
  is_assessment_head?: boolean;
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
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isCenterStudent: boolean;
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
    await supabase.auth.signOut();
    localStorage.clear();
    document.cookie = "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setUser(null);
    setProfile(null);
    setSession(null);
    window.location.href = `/login${errorType ? `?error=${errorType}` : ''}`;
  }, [supabase]);

  const fetchProfile = useCallback(async (userId: string) => {
    console.time('profile-hydration');
    const { data, error } = await supabase
      .from("profiles")
      .select("*, classes!profiles_class_id_fkey(name)")
      .eq("id", userId)
      .single();
    
    if (error || !data) {
      console.warn("Profile hydration delayed or missing profile record.");
      // Create a fallback profile so the app doesn't freeze on the dashboard
      setProfile({
        id: userId,
        full_name: "Student Profile (Offline/Syncing)",
        role: "student",
        xp: 0,
        rank: "Novice",
        avatar_url: null,
        class_id: null,
        face_descriptor: null
      });
      console.timeEnd('profile-hydration');
      return;
    }

    if (data.id === userId) {
      // Extract class_name from the joined classes object
      const profileData = {
        ...data,
        class_name: data.classes?.name || null
      };
      delete profileData.classes; // remove the joined object
      setProfile(profileData as Profile);
    }
    console.timeEnd('profile-hydration');
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [user, supabase]);

  useEffect(() => {
    console.time('login-flow');
    
    const initializeAuth = async () => {
      // FAST-PASS: Get session and immediately set user to unlock UI
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        // UNLOCK UI: Don't wait for profile
        setLoading(false);
        console.timeEnd('login-flow');
        
        // ASYNC HYDRATION: Fetch profile in background
        fetchProfile(currentSession.user.id);
      } else {
        setLoading(false);
        console.timeEnd('login-flow');
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, newSession: any) => {
        console.log('Auth State Change:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession) {
          // Explicitly set cookies with proper attributes for Middleware
          const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
          if (newSession.access_token) {
            document.cookie = `sb-access-token=${newSession.access_token}; Path=/; Secure; SameSite=Lax; Expires=${expires}`;
          }
          if (newSession.refresh_token) {
            document.cookie = `sb-refresh-token=${newSession.refresh_token}; Path=/; Secure; SameSite=Lax; Expires=${expires}`;
          }
          
          fetchProfile(newSession.user.id);
          setLoading(false);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

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

  const regularClasses = ["7A", "7B", "7C", "7D", "8A", "8B", "8C", "8D", "9A", "9B", "9C", "9D"];
  const isCenterStudent = Boolean(profile?.role === "student" && profile?.class_name && !regularClasses.includes(profile.class_name));

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      loading, 
      signInWithEmail, 
      signUpWithEmail, 
      signInWithGoogle, 
      signOut: clearSessionAndLogout,
      refreshProfile,
      updateProfile,
      isCenterStudent
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
