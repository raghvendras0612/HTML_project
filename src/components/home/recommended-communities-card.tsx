"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Hash, Users, Bot, Plus, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import type { CommunitySuggestion } from "@/app/api/ai/suggest-communities/route";

export function RecommendedCommunitiesCard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = React.useState<CommunitySuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [joinedMap, setJoinedMap] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadRecommendations() {
      try {
        const res = await fetch("/api/ai/suggest-communities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "home" }),
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          setRecommendations(data.suggestions || []);
        }
      } catch {
        // Fallback handled by API
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRecommendations();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user || isLoading || recommendations.length === 0) {
    return null;
  }

  const handleJoin = async (communityName: string) => {
    try {
      const res = await fetch(`/api/communities/${communityName}/join`, {
        method: "POST",
      });
      if (res.ok) {
        setJoinedMap((prev) => ({ ...prev, [communityName]: true }));
        toast.success(`Joined c/${communityName}`);
      }
    } catch {
      toast.error("Failed to join community");
    }
  };

  return (
    <Card className="curia-card border-accent/30 bg-surface/90 shadow-glow-sm overflow-hidden mb-4">
      <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/20 border border-accent/40 text-accent">
            <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-xs font-bold text-foreground font-sans">
              Communities you might like
            </CardTitle>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono bg-accent/10 text-accent border-accent/30 py-0 px-1.5 gap-1"
        >
          <Bot className="h-2.5 w-2.5" />
          AI Pick
        </Badge>
      </CardHeader>

      <CardContent className="p-3 space-y-2.5">
        {recommendations.map((comm) => {
          const isJoined = joinedMap[comm.name];
          return (
            <div
              key={comm.name}
              className="flex items-start justify-between gap-3 p-2 rounded-lg bg-surface-raised/40 hover:bg-surface-raised border border-border/40 transition-colors"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <Link
                  href={`/c/${comm.name}`}
                  className="font-mono text-xs font-bold text-foreground hover:text-accent transition-colors block truncate"
                >
                  c/{comm.name}
                </Link>
                {comm.title && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {comm.title}
                  </p>
                )}
                <p className="text-[10px] text-accent/90 italic line-clamp-1">
                  {comm.reason}
                </p>
              </div>

              <Button
                size="sm"
                variant={isJoined ? "secondary" : "default"}
                onClick={() => handleJoin(comm.name)}
                disabled={isJoined}
                className="h-6 text-[10px] px-2.5 font-mono shrink-0 shadow-none"
              >
                {isJoined ? (
                  <>
                    <Check className="h-2.5 w-2.5 mr-1 text-success" />
                    Joined
                  </>
                ) : (
                  <>
                    <Plus className="h-2.5 w-2.5 mr-1" />
                    Join
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
