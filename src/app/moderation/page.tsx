"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Pin, Trash2, RotateCcw, AlertTriangle, Users, Hash, Loader2 } from "lucide-react";
import { MOCK_COMMUNITIES, MOCK_POSTS } from "@/lib/mock-data";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import type { PostWithRelations } from "@/types/database.types";

export default function ModerationPage() {
  const { user, profile } = useAuth();
  const [selectedCommId, setSelectedCommId] = React.useState(MOCK_COMMUNITIES[0]?.id || "");
  const [posts, setPosts] = React.useState<PostWithRelations[]>(MOCK_POSTS);
  const [msg, setMsg] = React.useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const activeCommunity =
    MOCK_COMMUNITIES.find((c) => c.id === selectedCommId) || MOCK_COMMUNITIES[0];

  const communityPosts = posts.filter((p) => p.community_id === selectedCommId);
  const pinnedPosts = communityPosts.filter((p) => p.is_pinned);

  const handleAction = async (action: string, postId: string) => {
    setLoadingAction(postId + action);
    setMsg(null);

    try {
      const res = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          community_id: selectedCommId,
          target_id: postId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      // Update state locally
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            if (action === "pin") return { ...p, is_pinned: true };
            if (action === "unpin") return { ...p, is_pinned: false };
            if (action === "remove_post") return { ...p, is_removed: true };
            if (action === "restore_post") return { ...p, is_removed: false };
          }
          return p;
        })
      );

      setMsg({
        text: `Action "${action}" succeeded on post.`,
        type: "success",
      });
    } catch (err) {
      setMsg({
        text: err instanceof Error ? err.message : "Moderation error",
        type: "error",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 border border-accent/40 text-accent font-bold">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg text-foreground">
                Moderator Control Center
              </h1>
              <p className="font-mono text-xs text-muted-foreground">
                Pin announcements, review flagged submissions, and enforce community rules
              </p>
            </div>
          </div>
          <Badge variant="mod">Mod Tooling</Badge>
        </div>

        {/* Community Selector */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
          <label className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            Managing:
          </label>
          <select
            value={selectedCommId}
            onChange={(e) => setSelectedCommId(e.target.value)}
            className="flex-1 h-9 rounded-lg border border-border bg-surface-raised px-3 text-xs font-mono font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {MOCK_COMMUNITIES.map((c) => (
              <option key={c.id} value={c.id}>
                c/{c.name} — {c.title}
              </option>
            ))}
          </select>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-lg border text-xs ${
              msg.type === "success"
                ? "bg-success/10 border-success/30 text-success"
                : "bg-danger/10 border-danger/30 text-danger"
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Moderation Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid grid-cols-2 bg-surface border border-border">
            <TabsTrigger value="posts" className="font-mono text-xs">
              Post Queue ({communityPosts.length})
            </TabsTrigger>
            <TabsTrigger value="pinned" className="font-mono text-xs">
              Pinned Posts ({pinnedPosts.length}/2)
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ALL COMMUNITY POSTS */}
          <TabsContent value="posts" className="mt-4 space-y-3">
            {communityPosts.map((post) => (
              <Card key={post.id} className="curia-card">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>
                      Posted by u/{post.author?.username || "unknown"} •{" "}
                      {post.score} points
                    </span>
                    <div className="flex items-center gap-1.5">
                      {post.is_pinned && (
                        <Badge variant="mod" className="text-[10px]">
                          Pinned
                        </Badge>
                      )}
                      {post.is_removed && (
                        <Badge variant="danger" className="text-[10px]">
                          Removed
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/c/${activeCommunity.name}/comments/${post.id}`}
                    className="font-bold text-sm text-foreground hover:text-accent block leading-snug"
                  >
                    {post.title}
                  </Link>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                    {post.is_pinned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction("unpin", post.id)}
                        disabled={loadingAction === post.id + "unpin"}
                        className="h-7 text-xs font-mono gap-1"
                      >
                        <Pin className="h-3 w-3" /> Unpin
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAction("pin", post.id)}
                        disabled={
                          loadingAction === post.id + "pin" || pinnedPosts.length >= 2
                        }
                        className="h-7 text-xs font-mono gap-1"
                        title={
                          pinnedPosts.length >= 2 ? "Maximum 2 pinned posts reached" : ""
                        }
                      >
                        <Pin className="h-3 w-3" /> Pin (Max 2)
                      </Button>
                    )}

                    {post.is_removed ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction("restore_post", post.id)}
                        disabled={loadingAction === post.id + "restore_post"}
                        className="h-7 text-xs font-mono gap-1 text-success hover:border-success/40"
                      >
                        <RotateCcw className="h-3 w-3" /> Restore
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleAction("remove_post", post.id)}
                        disabled={loadingAction === post.id + "remove_post"}
                        className="h-7 text-xs font-mono gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* TAB 2: PINNED POSTS */}
          <TabsContent value="pinned" className="mt-4 space-y-3">
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent font-mono flex items-center justify-between">
              <span>Pinned Announcements Capacity</span>
              <span className="font-bold">{pinnedPosts.length} / 2 Slots Active</span>
            </div>

            {pinnedPosts.length > 0 ? (
              pinnedPosts.map((post) => (
                <Card key={post.id} className="curia-card border-accent/30">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="truncate">
                      <p className="font-bold text-sm text-foreground truncate">
                        {post.title}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        Pinned announcement in c/{activeCommunity.name}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction("unpin", post.id)}
                      disabled={loadingAction === post.id + "unpin"}
                      className="h-7 text-xs shrink-0"
                    >
                      Unpin
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="curia-card p-8 text-center text-xs text-muted-foreground font-mono">
                No pinned announcements in c/{activeCommunity.name}. Pin up to 2 posts above.
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
