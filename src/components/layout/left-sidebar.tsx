"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  TrendingUp,
  Globe,
  Plus,
  Users,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { EmptyState } from "@/components/common/empty-state";

interface LeftSidebarProps {
  onOpenCreateCommunity?: () => void;
  className?: string;
}

export function LeftSidebar({
  onOpenCreateCommunity,
  className,
}: LeftSidebarProps) {
  const pathname = usePathname();
  const { user, requireAuth } = useUser();
  const [joinedCommunities, setJoinedCommunities] = React.useState<{ name: string; title: string }[]>([]);

  const handleCreateCommunity = () => {
    requireAuth(() => {
      if (onOpenCreateCommunity) onOpenCreateCommunity();
    });
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
      href: "/popular",
      icon: TrendingUp,
      active: pathname === "/popular",
    },
    {
      label: "All",
      href: "/all",
      icon: Globe,
      active: pathname === "/all",
    },
  ];

  return (
    <aside
      className={cn(
        "w-60 shrink-0 border-r border-border p-4 space-y-6 self-start sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto hidden md:flex flex-col justify-between",
        className
      )}
    >
      <div className="space-y-6">
        {/* Primary Feeds */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Feeds
          </p>
          <nav className="space-y-0.5 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    item.active
                      ? "bg-accent/10 text-accent font-semibold"
                      : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", item.active ? "text-accent" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Your Communities Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Your Communities
            </p>
            <button
              onClick={handleCreateCommunity}
              className="text-accent hover:text-accent-glow p-0.5 rounded transition-colors"
              title="Create Community"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {joinedCommunities.length > 0 ? (
            <div className="space-y-0.5">
              {joinedCommunities.map((c) => (
                <Link
                  key={c.name}
                  href={`/c/${c.name}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors font-mono"
                >
                  <span className="text-accent">c/</span>
                  <span className="truncate">{c.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-1 py-2">
              <EmptyState
                icon={<Users className="h-5 w-5" />}
                title="No communities yet"
                description="Join interesting communities or launch your own technical circle."
                actionLabel="+ Create Community"
                onAction={handleCreateCommunity}
                className="p-4 py-5"
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Community Launcher */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateCommunity}
          className="w-full flex items-center justify-center gap-2 border-dashed border-border hover:border-accent/50 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Community</span>
        </Button>
      </div>
    </aside>
  );
}
