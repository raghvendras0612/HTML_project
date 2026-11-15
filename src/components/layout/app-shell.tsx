"use client";

import * as React from "react";
import { TopBar } from "@/components/layout/top-bar";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
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
  const [createCommunityOpen, setCreateCommunityOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
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
        {!hideRightSidebar && (
          <RightSidebar community={community} />
        )}
      </div>

      {/* Mobile Navigation & Drawer */}
      <MobileNav
        drawerOpen={mobileDrawerOpen}
        onOpenDrawer={() => setMobileDrawerOpen(true)}
        onCloseDrawer={() => setMobileDrawerOpen(false)}
        onOpenCreateCommunity={() => setCreateCommunityOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />
    </div>
  );
}
