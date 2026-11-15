"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Profile } from "@/types/database.types";
import { MOCK_PROFILES } from "@/lib/mock-data";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  authModalOpen: boolean;
  authModalTab: "signin" | "signup";
  openAuthModal: (tab?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateUserKarma: (delta: number) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authModalTab, setAuthModalTab] = React.useState<"signin" | "signup">("signin");
  const isConfigured = isSupabaseConfigured();

  const openAuthModal = React.useCallback((tab: "signin" | "signup" = "signin") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = React.useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const updateUserKarma = React.useCallback((delta: number) => {
    setProfile((prev) => {
      if (!prev) return null;
      return { ...prev, karma: prev.karma + delta };
    });
  }, []);

  // Initialize auth state
  React.useEffect(() => {
    if (!isConfigured) {
      // In local demo / portfolio mode without Supabase keys, use mock user profile
      const mockProfile = MOCK_PROFILES["user-1"];
      const mockAuthUser = {
        id: mockProfile.id,
        email: "alex@curia.dev",
        app_metadata: {},
        user_metadata: {
          username: mockProfile.username,
          display_name: mockProfile.display_name,
        },
        aud: "authenticated",
        created_at: mockProfile.created_at,
      } as unknown as User;

      setUser(mockAuthUser);
      setProfile(mockProfile);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    const fetchSessionAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isConfigured) {
      // Mock login
      const mockProfile = MOCK_PROFILES["user-1"];
      setProfile(mockProfile);
      closeAuthModal();
      return {};
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };
      closeAuthModal();
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to sign in" };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    username: string
  ) => {
    if (!isConfigured) {
      // Mock signup
      const newMockProfile: Profile = {
        id: "user-new",
        username: username.toLowerCase(),
        display_name: username,
        avatar_url: null,
        bio: "",
        karma: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(newMockProfile);
      closeAuthModal();
      return {};
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
          },
        },
      });

      if (error) return { error: error.message };
      if (data.user) {
        closeAuthModal();
      }
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to sign up" };
    }
  };

  const signInWithGoogle = async () => {
    if (!isConfigured) {
      const mockProfile = MOCK_PROFILES["user-2"];
      setProfile(mockProfile);
      closeAuthModal();
      return {};
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) return { error: error.message };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "OAuth error" };
    }
  };

  const signOut = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isConfigured,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        updateUserKarma,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
