"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  FileText,
  Shield,
  Sparkles,
  Users,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatScore } from "@/lib/utils";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";
import type { Community, CommunityRule } from "@/types/database.types";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

interface RightSidebarProps {
  community?: Community;
  className?: string;
}

export function RightSidebar({ community: initialCommunity, className }: RightSidebarProps) {
  const pathname = usePathname();
  const { user, requireAuth } = useUser();

  const [trending, setTrending] = React.useState<Community[]>(MOCK_COMMUNITIES.slice(0, 5));
  const [activeCommunity, setActiveCommunity] = React.useState<Community | null>(initialCommunity || null);
  const [moderators, setModerators] = React.useState<{ id: string; username: string; display_name?: string | null }[]>([]);
  const [isJoined, setIsJoined] = React.useState(false);
  const [isJoinLoading, setIsJoinLoading] = React.useState(false);
  const [expandedRule, setExpandedRule] = React.useState<number | null>(null);

  // Check if current route is a community route /c/[name]
  const communityMatch = pathname.match(/^\/c\/([a-zA-Z0-9_]+)/);
  const routeCommunityName = communityMatch ? communityMatch[1].toLowerCase() : null;

  // 1. Fetch trending communities
  React.useEffect(() => {
    let isMounted = true;
    async function loadTrending() {
      try {
        const res = await fetch("/api/communities?trending=true");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.communities && data.communities.length > 0) {
            setTrending(data.communities);
          }
        }
      } catch {
        // Fallback to initial
      }
    }
    loadTrending();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch community details if inside /c/[name]
  React.useEffect(() => {
    let isMounted = true;
    if (initialCommunity) {
      setActiveCommunity(initialCommunity);
      return;
    }

    if (!routeCommunityName) {
      setActiveCommunity(null);
      return;
    }

    async function loadCommunity() {
      try {
        const res = await fetch(`/api/communities/${routeCommunityName}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.community) {
            setActiveCommunity(data.community);
            setModerators(data.moderators || []);
            setIsJoined(Boolean(data.isMember));
          }
        }
      } catch {
        // Fallback to mock
        const mock = MOCK_COMMUNITIES.find((c) => c.name.toLowerCase() === routeCommunityName);
        if (isMounted && mock) {
          setActiveCommunity(mock);
        }
      }
    }
    loadCommunity();
    return () => {
      isMounted = false;
    };
  }, [routeCommunityName, initialCommunity]);

  // Handle Join / Leave
  const handleToggleJoin = async () => {
    if (!activeCommunity) return;
    requireAuth(async () => {
      setIsJoinLoading(true);
      const prevJoined = isJoined;
      setIsJoined(!prevJoined); // Optimistic

      try {
        const res = await fetch(`/api/communities/${activeCommunity.name}/join`, {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          setIsJoined(data.joined);
          toast.success(data.joined ? `Joined c/${activeCommunity.name}` : `Left c/${activeCommunity.name}`);
        } else {
          const err = await res.json();
          setIsJoined(prevJoined);
          toast.error(err.error || "Failed to update membership");
        }
      } catch {
        setIsJoined(prevJoined);
        toast.error("Network error updating membership");
      } finally {
        setIsJoinLoading(false);
      }
    });
  };

  const parsedRules: CommunityRule[] = React.useMemo(() => {
    if (!activeCommunity?.rules) return [];
    if (Array.isArray(activeCommunity.rules)) {
      return activeCommunity.rules as unknown as CommunityRule[];
    }
    return [];
  }, [activeCommunity]);

  const memberCount =
    (activeCommunity as unknown as { member_count?: number; members_count?: number })?.member_count ??
    (activeCommunity as unknown as { member_count?: number; members_count?: number })?.members_count ??
    1;

  return (
    <aside
      className={cn(
        "w-80 shrink-0 p-4 space-y-4 self-start sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto hidden lg:flex flex-col justify-between",
        className
      )}
    >
      <div className="space-y-4">
        {/* If inside a specific community, show Community Info Card */}
        {activeCommunity ? (
          <>
            <Card className="curia-card border-border bg-surface">
              <CardHeader className="p-4 pb-2 border-b border-border/50">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>About Community</span>
                  <span className="font-mono text-xs text-accent">c/{activeCommunity.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeCommunity.description || "A technical community on Curia."}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-accent" />
                    <span>{memberCount.toLocaleString()} members</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={isJoined ? "outline" : "default"}
                    disabled={isJoinLoading}
                    onClick={handleToggleJoin}
                    className={cn(
                      "flex-1 text-xs h-8",
                      !isJoined && "bg-accent hover:bg-accent/90 text-white shadow-glow-sm"
                    )}
                  >
                    {isJoined ? "Joined" : "Join Community"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="text-xs h-8 gap-1.5 border-border hover:border-accent/40"
                  >
                    <Link href={`/c/${activeCommunity.name}/submit`}>
                      <Plus className="h-3.5 w-3.5 text-accent" />
                      <span>Post</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Community Rules Card */}
            {parsedRules.length > 0 && (
              <Card className="curia-card border-border bg-surface">
                <CardHeader className="p-4 pb-2 border-b border-border/50">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-accent" />
                    <span>Rules of c/{activeCommunity.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {parsedRules.map((rule, idx) => {
                    const isExpanded = expandedRule === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-lg p-2 hover:bg-surface-raised transition-colors text-xs"
                      >
                        <button
                          onClick={() => setExpandedRule(isExpanded ? null : idx)}
                          className="w-full flex items-center justify-between text-left font-medium text-foreground gap-2"
                        >
                          <span className="truncate">
                            <span className="font-mono text-muted-foreground mr-1.5">{idx + 1}.</span>
                            {rule.title}
                          </span>
                          {rule.body && (
                            isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )
                          )}
                        </button>
                        {isExpanded && rule.body && (
                          <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed pl-4 border-l border-border">
                            {rule.body}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Moderators Card */}
            {moderators.length > 0 && (
              <Card className="curia-card border-border bg-surface">
                <CardHeader className="p-4 pb-2 border-b border-border/50">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-accent" />
                    <span>Moderators</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-1.5">
                  {moderators.map((mod) => (
                    <Link
                      key={mod.id}
                      href={`/u/${mod.username}`}
                      className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-accent transition-colors"
                    >
                      <span className="text-accent">u/</span>
                      <span>{mod.username}</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
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
                  Top 5
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
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised text-accent font-bold text-xs shrink-0">
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
