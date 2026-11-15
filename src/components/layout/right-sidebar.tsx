"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatScore, formatTimeAgo } from "@/lib/utils";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";
import { useAuth } from "@/context/auth-context";
import type { Community } from "@/types/database.types";

interface RightSidebarProps {
  community?: Community;
  className?: string;
}

export function RightSidebar({ community: propCommunity, className }: RightSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();

  const [isJoined, setIsJoined] = React.useState(false);
  const [memberCount, setMemberCount] = React.useState(0);

  // Determine active community either from prop or URL
  const communitySlug = params?.community as string | undefined;
  const community =
    propCommunity ||
    (communitySlug
      ? MOCK_COMMUNITIES.find((c) => c.name.toLowerCase() === communitySlug.toLowerCase())
      : null);

  React.useEffect(() => {
    if (community) {
      setMemberCount(community.members_count);
    }
  }, [community]);

  const toggleJoin = () => {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    setIsJoined((prev) => {
      const next = !prev;
      setMemberCount((c) => (next ? c + 1 : c - 1));
      return next;
    });
  };

  return (
    <aside
      className={`hidden lg:flex flex-col w-80 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 px-3 space-y-4 bg-background ${
        className || ""
      }`}
    >
      {community ? (
        /* Community Specific Panel */
        <div className="space-y-4">
          <Card className="curia-card overflow-hidden">
            {community.banner_url ? (
              <div
                className="h-20 w-full bg-cover bg-center border-b border-border"
                style={{ backgroundImage: `url(${community.banner_url})` }}
              />
            ) : (
              <div className="h-16 w-full bg-gradient-to-r from-accent/30 to-accent-glow/20 border-b border-border" />
            )}
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-sans font-bold text-base text-foreground">
                    {community.title}
                  </h2>
                  <p className="font-mono text-xs text-accent">
                    c/{community.name}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {community.description}
              </p>

              <div className="grid grid-cols-2 gap-2 py-2 border-y border-border/60 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-accent" />
                  <div>
                    <p className="font-mono font-semibold text-foreground">
                      {formatScore(memberCount)}
                    </p>
                    <p className="text-[10px]">Members</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-accent-glow" />
                  <div>
                    <p className="font-mono font-semibold text-foreground">
                      {formatTimeAgo(community.created_at)}
                    </p>
                    <p className="text-[10px]">Created</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant={isJoined ? "outline" : "default"}
                  size="sm"
                  onClick={toggleJoin}
                  className="w-full text-xs font-semibold"
                >
                  {isJoined ? "Joined (Leave)" : "Join Community"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="w-full text-xs"
                >
                  <Link href={`/c/${community.name}/submit`}>Create Post</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Community Rules Card */}
          <Card className="curia-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <CardTitle className="text-sm font-semibold">
                  c/{community.name} Rules
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2 text-xs">
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-surface-raised/60 border border-border">
                  <p className="font-semibold text-foreground">
                    1. High Signal Content
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Submissions must include actionable engineering context or analysis.
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-surface-raised/60 border border-border">
                  <p className="font-semibold text-foreground">
                    2. Constructive Tone & Respect
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    No toxic comments, trolling, or hate speech. AI pre-moderation is active.
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-surface-raised/60 border border-border">
                  <p className="font-semibold text-foreground">
                    3. No Unverified Spam
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Self-promotion must be accompanied by open source code or architecture docs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Home / Trending Panel */
        <div className="space-y-4">
          {/* Trending Communities */}
          <Card className="curia-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-upvote" />
                <CardTitle className="text-sm font-semibold">
                  Trending Communities
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2">
              {MOCK_COMMUNITIES.slice(0, 4).map((c, idx) => (
                <Link
                  key={c.id}
                  href={`/c/${c.name}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-raised transition-colors group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="font-mono text-xs font-bold text-muted-foreground group-hover:text-accent w-4">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-mono text-xs font-semibold text-foreground group-hover:text-accent truncate">
                        c/{c.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {c.title}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
                    {formatScore(c.members_count)}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Gemini AI Powered Highlights */}
          <Card className="curia-card bg-gradient-to-br from-surface to-accent/5 border-accent/20">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-glow" />
                <CardTitle className="text-sm font-semibold">
                  AI-Assisted Discussions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2.5 text-xs text-muted-foreground leading-relaxed">
              <p>
                Curia is powered by <strong className="text-foreground">Gemini Flash</strong> via server route handlers.
              </p>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>Real-time thread summarization</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-glow" />
                  <span>Pre-publish toxicity & spam check</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span>Smart community recommendations</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Curia Platform Guidelines */}
          <Card className="curia-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">
                  Platform Guidelines
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2 text-xs text-muted-foreground">
              <p className="text-[11px] leading-relaxed">
                Welcome to Curia. Remember the human, verify technical assertions, and vote based on content quality and technical rigor.
              </p>
              <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono">
                <Link href="/about" className="text-accent hover:underline">
                  Architecture Docs
                </Link>
                <Link href="/moderation" className="text-muted-foreground hover:text-foreground">
                  Mod Queue
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </aside>
  );
}
