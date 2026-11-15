"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Bell, Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/context/auth-context";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";

interface TopBarProps {
  onOpenMobileDrawer?: () => void;
  onOpenNotifications?: () => void;
}

export function TopBar({ onOpenMobileDrawer, onOpenNotifications }: TopBarProps) {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCreateClick = () => {
    if (!user) {
      openAuthModal("signin");
    } else {
      router.push("/submit");
    }
  };

  // Keyboard shortcut listener for '/'
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        const input = document.getElementById("curia-global-search");
        if (input) input.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border glass-header">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 max-w-7xl mx-auto gap-2 sm:gap-4">
        {/* Left: Mobile Drawer Trigger + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 text-muted-foreground"
            onClick={onOpenMobileDrawer}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-bold text-sm shadow-glow transition-all duration-150 group-hover:shadow-glow-cyan/60 group-hover:scale-105">
              C
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold text-lg text-foreground tracking-tight">
                Curia
              </span>
              <span className="hidden sm:inline-block rounded px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider bg-accent/15 text-accent border border-accent/25">
                v1.0
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xl mx-2 relative"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="curia-global-search"
              type="search"
              placeholder="Search Curia (posts, communities, users)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-12 h-9 bg-surface/70 hover:bg-surface focus:bg-surface border-border text-xs sm:text-sm rounded-full transition-all"
            />
            <div className="hidden sm:flex absolute right-3 items-center pointer-events-none">
              <kbd className="font-mono text-[10px] bg-surface-raised px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                /
              </kbd>
            </div>
          </div>
        </form>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={handleCreateClick}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-lg shadow-glow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create</span>
          </Button>

          {/* Notifications button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={onOpenNotifications}
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-glow opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
            )}
          </Button>

          <ThemeToggle />

          <div className="ml-1 pl-1 border-l border-border/60">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
