"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Flame,
  Search,
  Plus,
  Bell,
  User,
  TrendingUp,
  Globe,
  Users,
  Compass,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Logo } from "@/components/common/logo";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";

interface MobileNavProps {
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
  onOpenCreateCommunity: () => void;
  onOpenNotifications: () => void;
  onOpenCommandPalette: () => void;
}

export function MobileNav({
  drawerOpen,
  onOpenDrawer,
  onCloseDrawer,
  onOpenCreateCommunity,
  onOpenNotifications,
  onOpenCommandPalette,
}: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, requireAuth } = useUser();

  const handleCreatePost = () => {
    requireAuth(() => {
      router.push("/submit");
    });
  };

  const handleNotificationsClick = () => {
    requireAuth(onOpenNotifications);
  };

  const handleProfileClick = () => {
    if (user && profile) {
      router.push(`/u/${profile.username}`);
    } else {
      router.push("/login");
    }
  };

  return (
    <>
      {/* Mobile Drawer (Sheet) */}
      <Sheet open={drawerOpen} onOpenChange={(open) => !open && onCloseDrawer()}>
        <SheetContent side="left" className="w-4/5 max-w-xs bg-surface border-border p-5 flex flex-col justify-between">
          <div className="space-y-6">
            <SheetHeader className="text-left pb-3 border-b border-border">
              <SheetTitle>
                <Logo size="md" />
              </SheetTitle>
            </SheetHeader>

            {/* Feeds */}
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Feeds
              </p>
              <nav className="space-y-1 pt-1">
                <Link
                  href="/"
                  onClick={onCloseDrawer}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/" ? "bg-accent/10 text-accent font-semibold" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                  )}
                >
                  <Flame className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link
                  href="/popular"
                  onClick={onCloseDrawer}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/popular" ? "bg-accent/10 text-accent font-semibold" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                  )}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Popular</span>
                </Link>
                <Link
                  href="/all"
                  onClick={onCloseDrawer}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/all" ? "bg-accent/10 text-accent font-semibold" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                  )}
                >
                  <Globe className="h-4 w-4" />
                  <span>All</span>
                </Link>
              </nav>
            </div>

            {/* Explore Communities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Featured Circles
                </p>
              </div>
              <div className="space-y-1">
                {MOCK_COMMUNITIES.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href={`/c/${c.name}`}
                    onClick={onCloseDrawer}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-raised hover:text-foreground font-mono"
                  >
                    <span className="text-accent">c/</span>
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-2">
            <div className="flex gap-3">
              <Link href="/about" onClick={onCloseDrawer} className="hover:text-foreground">About</Link>
              <span>•</span>
              <Link href="/rules" onClick={onCloseDrawer} className="hover:text-foreground">Rules</Link>
              <span>•</span>
              <Link href="/privacy" onClick={onCloseDrawer} className="hover:text-foreground">Privacy</Link>
            </div>
            <p className="text-[10px] text-muted-foreground/60 font-mono">Curia © 2026</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Fixed Mobile Bottom Navigation Bar (5 Items: Home, Search, Create, Alerts, Profile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-surface/90 backdrop-blur-md px-3 py-1 shadow-lg">
        <div className="flex items-center justify-around h-12">
          {/* 1. Home */}
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors w-12",
              pathname === "/" ? "text-accent" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Flame className="h-5 w-5" />
            <span>Home</span>
          </Link>

          {/* 2. Search */}
          <button
            onClick={onOpenCommandPalette}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors w-12"
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>

          {/* 3. Center Create (+) Button */}
          <button
            onClick={handleCreatePost}
            className="flex h-11 w-11 -mt-4 items-center justify-center rounded-full bg-accent text-white shadow-glow hover:scale-105 active:scale-95 transition-transform"
            aria-label="Create Post"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>

          {/* 4. Notifications */}
          <button
            onClick={handleNotificationsClick}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors w-12 relative"
          >
            <Bell className="h-5 w-5" />
            {user && (
              <span className="absolute top-0 right-2.5 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
            <span>Alerts</span>
          </button>

          {/* 5. Profile */}
          <button
            onClick={handleProfileClick}
            className={cn(
              "flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors w-12",
              pathname.startsWith("/u/") ? "text-accent" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-5 w-5" />
            <span>{user ? "Profile" : "Log In"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
