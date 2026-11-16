"use client";

import { useAuth } from "@/context/auth-context";

export function useUser() {
  const auth = useAuth();
  return {
    user: auth.user,
    profile: auth.profile,
    isLoading: auth.isLoading,
    isConfigured: auth.isConfigured,
    signOut: auth.signOut,
    refreshProfile: auth.refreshProfile,
    requireAuth: auth.requireAuth,
    openAuthModal: auth.openAuthModal,
    closeAuthModal: auth.closeAuthModal,
    isAuthModalOpen: auth.authModalOpen,
    needsOnboarding: auth.needsOnboarding,
    setNeedsOnboarding: auth.setNeedsOnboarding,
    signInWithEmail: auth.signInWithEmail,
    signUpWithEmail: auth.signUpWithEmail,
    signInWithGoogle: auth.signInWithGoogle,
    updateUserKarma: auth.updateUserKarma,
  };
}
