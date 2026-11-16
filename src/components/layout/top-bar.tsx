"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { UserMenu } from "@/components/auth/user-menu";
import { TopBarSearch } from "@/components/search/top-bar-search";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useUser } from "@/hooks/use-user";

interface TopBarProps {
  onOpenMobileDrawer?: () => void;
  onOpenNotifications?: () => void;
  onOpenCommandPalette?: () => void;
}

export function TopBar({
  onOpenMobileDrawer,
  onOpenNotifications,
  onOpenCommandPalette,
}: TopBarProps) {
  const router = useRouter();
  const { user, requireAuth } = useUser();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateClick = () => {
    requireAuth(() => {
      router.push("/submit");
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border glass-header">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 max-w-7xl mx-auto gap-2 sm:gap-4">
        {/* Left: Mobile Drawer Trigger + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={onOpenMobileDrawer}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Logo size="md" />
        </div>

        {/* Center: Live Debounced Top Bar Search */}
        <TopBarSearch />

        {/* Right: Actions, Notifications & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Create Post Button */}
          <Button
            size="sm"
            onClick={handleCreateClick}
            className="hidden sm:inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white font-medium text-xs h-9 px-3.5 shadow-glow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </Button>

          {/* Interactive Notifications Bell Dropdown */}
          <NotificationsDropdown />

          {/* User Menu or Log in / Sign up buttons */}
          {mounted ? (
            <UserMenu />
          ) : (
            <div className="h-8 w-20 bg-surface-raised rounded-full animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}
