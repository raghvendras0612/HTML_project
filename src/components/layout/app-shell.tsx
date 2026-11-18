"use client";

import * as React from "react";
import { TopBar } from "@/components/layout/top-bar";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/common/command-palette";
import { OnboardingModal } from "@/components/auth/onboarding-modal";
import { CreateCommunityModal } from "@/components/community/create-community-modal";
import { NotificationsDrawer } from "@/components/notifications/notifications-drawer";
import { AuthModal } from "@/components/auth/auth-modal";
import { Toaster } from "@/components/ui/sonner";
import type { Community } from "@/types/database.types";

interface AppShellProps {
  children: React.ReactNode;
  community?: Community;
  hideRightSidebar?: boolean;
}

export function AppShell({
  children,
  community,
  hideRightSidebar = false,
}: AppShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [createCommunityOpen, setCreateCommunityOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      <TopBar
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex justify-center pb-16 md:pb-6">
        {/* Left Sidebar (Desktop & Tablet) */}
        <LeftSidebar
          className="hidden md:flex"
          onOpenCreateCommunity={() => setCreateCommunityOpen(true)}
        />

        {/* Central Feed / Main Content Area */}
        <main className="flex-1 min-w-0 max-w-2xl px-3 sm:px-6 py-4">
          {children}
        </main>

        {/* Right Sidebar (Desktop only) */}
        {!hideRightSidebar && <RightSidebar community={community} />}
      </div>

      {/* Mobile Navigation & Drawer Sheet */}
      <MobileNav
        drawerOpen={mobileDrawerOpen}
        onOpenDrawer={() => setMobileDrawerOpen(true)}
        onCloseDrawer={() => setMobileDrawerOpen(false)}
        onOpenCreateCommunity={() => setCreateCommunityOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Global Modals & Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      <OnboardingModal />
      <CreateCommunityModal
        open={createCommunityOpen}
        onOpenChange={setCreateCommunityOpen}
      />
      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
