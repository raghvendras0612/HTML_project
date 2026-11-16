"use client";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp,
  FileText,
  Shield,
  Sparkles,
  Users,
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatScore } from "@/lib/utils";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";
import type { Community } from "@/types/database.types";
import { useUser } from "@/hooks/use-user";

interface RightSidebarProps {
  community?: Community;
  className?: string;
}

export function RightSidebar({ community, className }: RightSidebarProps) {
  const { user, requireAuth } = useUser();
  const [isJoined, setIsJoined] = React.useState(false);
  const trending = MOCK_COMMUNITIES.slice(0, 4);

  return (
    <aside
      className={cn(
        "w-80 shrink-0 p-4 space-y-4 self-start sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto hidden lg:flex flex-col justify-between",
        className
      )}
    >
      <div className="space-y-4">
        {/* If inside a specific community, show Community Info Card */}
        {community ? (
          <Card className="curia-card border-border bg-surface">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">About Community</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {community.description || "A technical community on Curia."}
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-accent" />
                  <span>
                    {((community as unknown as { member_count?: number; members_count?: number }).member_count ??
                      (community as unknown as { member_count?: number; members_count?: number }).members_count ??
                      1).toLocaleString()}{" "}
                    members
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant={isJoined ? "outline" : "default"}
                onClick={() => requireAuth(() => setIsJoined((p) => !p))}
                className={cn(
                  "w-full text-xs h-8 mt-2",
                  !isJoined && "bg-accent hover:bg-accent/90 text-white shadow-glow-sm"
                )}
              >
                {isJoined ? "Joined" : "Join Community"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Default: Trending Communities Card */
          <Card className="curia-card border-border bg-surface">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <CardTitle className="text-sm font-semibold">Trending Communities</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] border-accent/30 text-accent font-mono">
                  Top 4
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {trending.map((c, index) => {
                const count =
                  (c as unknown as { member_count?: number; members_count?: number }).member_count ??
                  (c as unknown as { member_count?: number; members_count?: number }).members_count ??
                  100;
                return (
                  <Link
                    key={c.id}
                    href={`/c/${c.name}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-raised transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground w-4 text-center">
                        {index + 1}
                      </span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised text-accent font-bold text-xs">
                        {c.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                          c/{c.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {count.toLocaleString()} members
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2 text-muted-foreground group-hover:text-foreground"
                    >
                      View
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Curia Info Card */}
        <Card className="curia-card border-border bg-surface/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles className="h-4 w-4 text-accent-glow" />
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">
              Curia Forum
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            High-signal technical discussions, developer-first communities, and AI-assisted deep dives.
          </p>
        </Card>
      </div>

      {/* Footer Links */}
      <footer className="pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <span>•</span>
          <Link href="/rules" className="hover:text-foreground transition-colors">
            Rules
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
        </div>
        <p className="text-[11px] font-mono text-muted-foreground/60">
          Curia © 2026. Built with Next.js & Supabase.
        </p>
      </footer>
    </aside>
  );
}
