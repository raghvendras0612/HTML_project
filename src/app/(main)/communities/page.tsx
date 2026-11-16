"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Users,
  Plus,
  Compass,
  ArrowRight,
  Hash,
} from "lucide-react";
import type { Community } from "@/types/database.types";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export default function CommunitiesExplorePage() {
  const { user, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [joinedSet, setJoinedSet] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(true);

  // 1. Fetch communities and user's joined set
  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [commRes, joinedRes] = await Promise.all([
          fetch(`/api/communities${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`),
          user ? fetch("/api/communities?joined=true") : Promise.resolve(null),
        ]);

        if (commRes.ok) {
          const commData = await commRes.json();
          if (isMounted) setCommunities(commData.communities || []);
        }

        if (joinedRes && joinedRes.ok) {
          const joinedData = await joinedRes.json();
          if (isMounted && joinedData.communities) {
            const set = new Set<string>(joinedData.communities.map((c: Community) => c.id));
            setJoinedSet(set);
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadData();
    }, 200);

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [searchQuery, user]);

  const handleToggleJoin = async (c: Community, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openAuthModal("signin");
      return;
    }

    const isCurrentlyJoined = joinedSet.has(c.id);
    const nextSet = new Set(joinedSet);
    if (isCurrentlyJoined) {
      nextSet.delete(c.id);
    } else {
      nextSet.add(c.id);
    }
    setJoinedSet(nextSet);

    try {
      const res = await fetch(`/api/communities/${c.name}/join`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.joined ? `Joined c/${c.name}` : `Left c/${c.name}`);
      } else {
        setJoinedSet(joinedSet); // Rollback
        toast.error("Failed to update membership");
      }
    } catch {
      setJoinedSet(joinedSet); // Rollback
      toast.error("Network error updating membership");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-accent mb-1">
            <Compass className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold">
              Directory
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Explore Communities
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Discover focused circles, developer hubs, and domain-specific spaces.
          </p>
        </div>

        <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-white shadow-glow-sm shrink-0">
          <Link href="/communities/create">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Community
          </Link>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search communities by name, topic, or description..."
          className="pl-10 h-10 bg-surface border-border text-sm"
        />
      </div>

      {/* Grid of Community Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="curia-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-7 w-20 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : communities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communities.map((c) => {
            const isJoined = joinedSet.has(c.id);
            const memberCount =
              (c as unknown as { member_count?: number; members_count?: number }).member_count ??
              (c as unknown as { member_count?: number; members_count?: number }).members_count ??
              1;

            return (
              <Link key={c.id} href={`/c/${c.name}`} className="block group">
                <Card className="curia-card h-full p-4 flex flex-col justify-between hover:border-accent/40 transition-all duration-150">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {c.icon_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.icon_url}
                            alt={c.name}
                            className="h-10 w-10 rounded-xl object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised border border-border text-accent font-bold text-base shrink-0 group-hover:border-accent/50 transition-colors">
                            {c.name[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors">
                            {c.title}
                          </h3>
                          <p className="font-mono text-xs text-accent">
                            c/{c.name}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isJoined ? "outline" : "default"}
                        onClick={(e) => handleToggleJoin(c, e)}
                        className={`h-7 px-2.5 text-xs shrink-0 ${
                          !isJoined
                            ? "bg-accent hover:bg-accent/90 text-white shadow-glow-sm"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isJoined ? "Joined" : "Join"}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {c.description || "A technical community for developers."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs font-mono text-muted-foreground mt-3">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-accent" />
                      {memberCount.toLocaleString()} members
                    </span>
                    <span className="flex items-center gap-1 text-accent font-sans group-hover:translate-x-0.5 transition-transform text-xs">
                      View feed
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="curia-card p-12 text-center space-y-3">
          <Hash className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="font-semibold text-foreground text-sm">
            No communities found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No community matched "${searchQuery}". Why not start one?`
              : "No communities are currently available."}
          </p>
          <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-white shadow-glow-sm">
            <Link href="/communities/create">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Community
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
