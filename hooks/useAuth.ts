'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "project_team" | "project_manager" | "pmo" | "administrator" | null;

export type AuthProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  project_id: string | null;
};

export type UseAuthResult = {
  user: User | null;
  role: UserRole;
  profile: AuthProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setUser(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, project_id")
          .eq("id", sessionUser.id)
          .maybeSingle();

        if (!profileError && profileData) {
          setRole(profileData.role as UserRole);
          setProfile(profileData as AuthProfile);
        } else {
          setRole(null);
          setProfile(null);
        }
      } else {
        setRole(null);
        setProfile(null);
      }

      setLoading(false);
    };

    void loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (!sessionUser) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, project_id")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (!profileError && profileData) {
        setRole(profileData.role as UserRole);
        setProfile(profileData as AuthProfile);
      } else {
        setRole(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setProfile(null);
    
    router.refresh(); // Invalidate Next.js client-side router cache
    
    if (typeof window !== "undefined") {
      window.location.href = "/"; // Hard navigation to clear DOM memory
    }
  };

  return { user, role, profile, loading, signOut };
}
