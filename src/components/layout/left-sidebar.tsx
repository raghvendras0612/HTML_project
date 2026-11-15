"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  TrendingUp,
  Compass,
  Plus,
  Hash,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatScore } from "@/lib/utils";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";
import { useAuth } from "@/context/auth-context";

interface LeftSidebarProps {
  onOpenCreateCommunity?: () => void;
  className?: string;
}

export function LeftSidebar({
  onOpenCreateCommunity,
  className,
}: LeftSidebarProps) {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();

  const handleCreateCommunity = () => {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    if (onOpenCreateCommunity) {
      onOpenCreateCommunity();
    }
  };

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Flame,
      active: pathname === "/",
    },
    {
      label: "Popular",
      href: "/r/popular",
      icon: TrendingUp,
      active: pathname === "/r/popular",
    },
    {
      label: "Explore",
      href: "/explore",
      icon: Compass,
      active: pathname === "/explore",
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col w-60 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-border py-4 px-3 space-y-6 text-sm bg-background",
        className
      )}
    >
      {/* Feeds Section */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
          Feeds
        </p>
        <div className="space-y-0.5 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  item.active
                    ? "bg-accent/15 text-accent font-semibold border border-accent/20"
                    : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    item.active ? "text-accent" : "text-muted-foreground"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Communities Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            Communities
          </p>
          <button
            onClick={handleCreateCommunity}
            className="flex items-center justify-center h-5 w-5 rounded hover:bg-surface-raised text-muted-foreground hover:text-accent transition-colors"
            title="Create Community"
            aria-label="Create Community"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-0.5 pt-1">
          {MOCK_COMMUNITIES.map((community) => {
            const isCurrent = pathname === `/c/${community.name}`;
            return (
              <Link
                key={community.id}
                href={`/c/${community.name}`}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all duration-150 group",
                  isCurrent
                    ? "bg-surface-raised text-foreground font-bold border border-border"
                    : "text-muted-foreground hover:bg-surface-raised/70 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface-raised border border-border text-accent group-hover:border-accent/40">
                    <Hash className="h-3 w-3" />
                  </div>
                  <span className="truncate">c/{community.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground opacity-75 font-mono">
                  {formatScore(community.members_count)}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="pt-2 px-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateCommunity}
            className="w-full justify-start text-xs text-muted-foreground hover:text-accent hover:border-accent/40 h-8"
          >
            <Plus className="mr-2 h-3.5 w-3.5 text-accent" />
            Create Community
          </Button>
        </div>
      </div>

      {/* Platform Resources */}
      <div className="pt-4 border-t border-border space-y-1">
        <p className="px-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
          Platform
        </p>
        <Link
          href="/moderation"
          className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-raised transition-colors"
        >
          <Shield className="h-3.5 w-3.5 text-accent" />
          <span>Moderator Hub</span>
        </Link>
        <Link
          href="/about"
          className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-raised transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent-glow" />
          <span>Curia Architecture</span>
        </Link>
      </div>

      {/* Footer / Badge */}
      <div className="mt-auto pt-6 px-3 text-[11px] text-muted-foreground space-y-2">
        <div className="rounded-lg bg-surface-raised/60 p-2.5 border border-border text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Curia Free-Tier</span>
            <Badge variant="cyan" className="text-[9px] px-1.5 py-0">Active</Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed text-[10px]">
            Next.js App Router, Supabase Postgres & Storage, Google Gemini AI.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono">
          Curia © 2026. Built with precision.
        </p>
      </div>
    </aside>
  );
}
