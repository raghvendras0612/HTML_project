"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { UserMenu } from "@/components/auth/user-menu";
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

  const handleNotificationsClick = () => {
    requireAuth(() => {
      if (onOpenNotifications) onOpenNotifications();
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

        {/* Center: Command Palette / Search Trigger */}
        <div className="flex-1 max-w-lg mx-2 hidden sm:block">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:border-accent/40 hover:bg-surface-raised transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Search posts, communities, or commands...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

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

          {/* Notifications Bell with badge placeholder */}
          <button
            onClick={handleNotificationsClick}
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-surface-raised rounded-full transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {user && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
            )}
          </button>

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
