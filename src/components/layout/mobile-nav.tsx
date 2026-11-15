"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Flame,
  TrendingUp,
  Plus,
  Compass,
  Bell,
  X,
  Hash,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";

interface MobileNavProps {
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
  onOpenCreateCommunity: () => void;
  onOpenNotifications: () => void;
}

export function MobileNav({
  drawerOpen,
  onOpenDrawer,
  onCloseDrawer,
  onOpenCreateCommunity,
  onOpenNotifications,
}: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const handleCreatePost = () => {
    if (!user) {
      openAuthModal("signin");
    } else {
      router.push("/submit");
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop and Slide-out Sheet */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseDrawer}
          />
          <div className="relative flex flex-col w-4/5 max-w-xs bg-surface border-r border-border h-full p-4 overflow-y-auto z-10 space-y-6 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white font-bold text-xs shadow-glow">
                  C
                </div>
                <span className="font-bold text-base text-foreground">Curia</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onCloseDrawer}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Feeds */}
            <div className="space-y-1">
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                Feeds
              </p>
              <Link
                href="/"
                onClick={onCloseDrawer}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                  pathname === "/" ? "bg-accent/15 text-accent font-semibold" : "text-muted-foreground"
                )}
              >
                <Flame className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link
                href="/r/popular"
                onClick={onCloseDrawer}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                  pathname === "/r/popular" ? "bg-accent/15 text-accent font-semibold" : "text-muted-foreground"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Popular</span>
              </Link>
            </div>

            {/* Communities */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Communities
                </p>
                <button
                  onClick={() => {
                    onCloseDrawer();
                    onOpenCreateCommunity();
                  }}
                  className="text-xs text-accent font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> New
                </button>
              </div>

              <div className="space-y-0.5 pt-1">
                {MOCK_COMMUNITIES.map((c) => (
                  <Link
                    key={c.id}
                    href={`/c/${c.name}`}
                    onClick={onCloseDrawer}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                  >
                    <Hash className="h-3.5 w-3.5 text-accent" />
                    <span>c/{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Hub Links */}
            <div className="pt-4 border-t border-border space-y-2">
              <Link
                href="/moderation"
                onClick={onCloseDrawer}
                className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Shield className="h-3.5 w-3.5 text-accent" />
                <span>Moderation Queue</span>
              </Link>
              <Link
                href="/about"
                onClick={onCloseDrawer}
                className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent-glow" />
                <span>Curia System Architecture</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-surface/95 backdrop-blur-md px-4 py-2">
        <div className="flex items-center justify-around">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium transition-colors",
              pathname === "/" ? "text-accent" : "text-muted-foreground"
            )}
          >
            <Flame className="h-5 w-5" />
            <span>Home</span>
          </Link>

          <Link
            href="/r/popular"
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium transition-colors",
              pathname === "/r/popular" ? "text-accent" : "text-muted-foreground"
            )}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Popular</span>
          </Link>

          {/* Center Create (+) Button */}
          <button
            onClick={handleCreatePost}
            className="flex h-11 w-11 -mt-4 items-center justify-center rounded-full bg-accent text-white shadow-glow hover:scale-105 transition-transform"
            aria-label="Create Post"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>

          <button
            onClick={onOpenNotifications}
            className="flex flex-col items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span>Alerts</span>
          </button>

          <button
            onClick={onOpenDrawer}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium transition-colors",
              drawerOpen ? "text-accent" : "text-muted-foreground"
            )}
          >
            <Compass className="h-5 w-5" />
            <span>Explore</span>
          </button>
        </div>
      </nav>
    </>
  );
}
