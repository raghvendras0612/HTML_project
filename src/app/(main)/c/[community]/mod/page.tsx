"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  UserMinus,
  ArrowLeft,
  AlertTriangle,
  FileText,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { formatTimeAgo } from "@/lib/utils";

interface ModeratorRow {
  user_id: string;
  role: string;
  joined_at: string;
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface BanRow {
  community_id: string;
  user_id: string;
  reason: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name?: string;
  };
}

export default function ModeratorManagementPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const communityName = (params.community as string) || "";

  const [newModUsername, setNewModUsername] = React.useState("");

  // 1. Fetch Moderators
  const {
    data: modData,
    isLoading: isLoadingMods,
    error: modError,
  } = useQuery<{ moderators: ModeratorRow[] }>({
    queryKey: ["mod-team", communityName],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityName}/moderators`);
      if (res.status === 403) throw new Error("403: Forbidden — Moderator access only");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load moderators");
      }
      return res.json();
    },
    retry: false,
  });

  // 2. Fetch Banned Users
  const {
    data: banData,
    isLoading: isLoadingBans,
    error: banError,
  } = useQuery<{ bans: BanRow[] }>({
    queryKey: ["mod-bans", communityName],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityName}/bans`);
      if (res.status === 403) throw new Error("403: Forbidden — Moderator access only");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load bans");
      }
      return res.json();
    },
    retry: false,
  });

  // Add Moderator Mutation
  const addModMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`/api/communities/${communityName}/moderators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add moderator");
      return data;
    },
    onSuccess: () => {
      toast.success("Moderator added successfully");
      setNewModUsername("");
      queryClient.invalidateQueries({ queryKey: ["mod-team", communityName] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add moderator");
    },
  });

  // Remove Moderator Mutation
  const removeModMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(
        `/api/communities/${communityName}/moderators?user_id=${userId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove moderator");
      return data;
    },
    onSuccess: () => {
      toast.success("Moderator removed");
      queryClient.invalidateQueries({ queryKey: ["mod-team", communityName] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove moderator");
    },
  });

  // Unban User Mutation
  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(
        `/api/communities/${communityName}/bans?user_id=${userId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unban user");
      return data;
    },
    onSuccess: () => {
      toast.success("User unbanned successfully");
      queryClient.invalidateQueries({ queryKey: ["mod-bans", communityName] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to unban");
    },
  });

  const error = modError || banError;
  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <Card className="curia-card border-danger/40 p-6 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-danger mx-auto" />
          <h2 className="text-lg font-bold text-danger">Access Denied</h2>
          <p className="text-xs text-muted-foreground font-mono">{error.message}</p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/c/${communityName}`}>Back to c/{communityName}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const moderators = modData?.moderators || [];
  const bans = banData?.bans || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3">
          <Link
            href={`/c/${communityName}`}
            className="p-1.5 rounded-lg border border-border hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <h1 className="text-base font-bold">Community Moderation Dashboard</h1>
              <Badge variant="outline" className="text-[10px] font-mono">
                c/{communityName}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Manage moderators, active bans, and community safety settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="text-xs font-mono">
            <Link href={`/c/${communityName}/mod/reports`}>
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5 text-danger" />
              Reports Queue
            </Link>
          </Button>
        </div>
      </div>

      {/* 1. Moderator Team Management */}
      <Card className="curia-card border-border/80">
        <CardHeader className="py-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                Moderator Team ({moderators.length})
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono">
                Moderators can remove posts/comments, ban users, and resolve reports.
              </p>
            </div>

            {/* Add Moderator input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newModUsername.trim()) {
                  addModMutation.mutate(newModUsername.trim());
                }
              }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="Username (e.g. userc)"
                value={newModUsername}
                onChange={(e) => setNewModUsername(e.target.value)}
                className="h-8 text-xs font-mono w-40 bg-surface-raised"
              />
              <Button
                type="submit"
                size="sm"
                disabled={addModMutation.isPending || !newModUsername.trim()}
                className="h-8 text-xs font-mono bg-accent hover:bg-accent/90"
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Add Mod
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {isLoadingMods ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          ) : moderators.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono py-2">
              No moderators found.
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {moderators.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                    <Link
                      href={`/u/${m.user?.username}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      u/{m.user?.username || m.user_id.slice(0, 8)}
                    </Link>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      joined {formatTimeAgo(m.joined_at)}
                    </Badge>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={removeModMutation.isPending}
                    onClick={() => removeModMutation.mutate(m.user_id)}
                    className="h-7 text-xs font-mono text-danger hover:bg-danger/10 hover:text-danger"
                  >
                    <UserMinus className="mr-1.5 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Banned Users Section */}
      <Card className="curia-card border-border/80">
        <CardHeader className="py-4 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <UserX className="h-4 w-4 text-danger" />
            Banned Members ({bans.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground font-mono">
            Banned users can view public content but cannot submit posts or comments.
          </p>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {isLoadingBans ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          ) : bans.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono py-2">
              No users are currently banned from this community.
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {bans.map((b) => (
                <div
                  key={b.user_id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-semibold text-foreground">
                        u/{b.user?.username || b.user_id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        • {formatTimeAgo(b.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      Reason: <span className="text-foreground">{b.reason}</span>
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={unbanMutation.isPending}
                    onClick={() => unbanMutation.mutate(b.user_id)}
                    className="h-7 text-xs font-mono border-border hover:bg-surface-raised"
                  >
                    Unban User
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
