"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Pin, Trash2, RotateCcw, AlertTriangle, Users, Hash, Loader2 } from "lucide-react";
import { MOCK_COMMUNITIES, MOCK_POSTS } from "@/lib/mock-data";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import type { PostWithRelations, Community } from "@/types/database.types";
import { toast } from "sonner";

export default function ModerationPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = React.useState<Community[]>(MOCK_COMMUNITIES);
  const [selectedCommId, setSelectedCommId] = React.useState(MOCK_COMMUNITIES[0]?.id || "");
  const [posts, setPosts] = React.useState<PostWithRelations[]>(MOCK_POSTS);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch("/api/communities");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.communities && data.communities.length > 0) {
            setCommunities(data.communities);
            setSelectedCommId(data.communities[0].id);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeCommunity =
    communities.find((c) => c.id === selectedCommId) || communities[0] || MOCK_COMMUNITIES[0];

  const communityPosts = posts.filter((p) => p.community_id === selectedCommId);
  const pinnedPosts = communityPosts.filter((p) => p.is_pinned);

  const handleAction = async (action: string, postId: string) => {
    setLoadingAction(postId + action);

    try {
      if (action === "pin" || action === "unpin") {
        const isPin = action === "pin";
        const res = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_pinned: isPin }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update pin");
        }
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, is_pinned: isPin } : p))
        );
        toast.success(isPin ? "Post pinned" : "Post unpinned");
      } else if (action === "remove_post" || action === "restore_post") {
        const isRemove = action === "remove_post";
        const res = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_removed: isRemove }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update remove status");
        }
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, is_removed: isRemove } : p))
        );
        toast.success(isRemove ? "Post removed" : "Post restored");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Moderation Hub Header */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 border border-accent/40 text-accent font-bold text-xl shadow-glow">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg sm:text-xl text-foreground">
              Community Moderation Center
            </h1>
            <p className="font-mono text-xs text-accent">
              Active Scope: c/{activeCommunity.name}
            </p>
          </div>
        </div>

        {/* Community Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            Switch:
          </label>
          <select
            value={selectedCommId}
            onChange={(e) => setSelectedCommId(e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-raised border border-border text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                c/{c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Moderation Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none h-11 bg-transparent p-0 gap-4">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none bg-transparent px-2 text-xs"
          >
            Overview & Queue
          </TabsTrigger>
          <TabsTrigger
            value="pins"
            className="data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none bg-transparent px-2 text-xs"
          >
            Pinned Announcements ({pinnedPosts.length}/2)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & POSTS QUEUE */}
        <TabsContent value="overview" className="mt-4 space-y-3">
          {communityPosts.length > 0 ? (
            communityPosts.map((post) => (
              <Card
                key={post.id}
                className={`curia-card transition-colors ${
                  post.is_removed ? "border-danger/30 bg-danger/5" : ""
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.is_pinned && (
                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] gap-1 bg-accent/10 text-accent border-accent/30 font-mono">
                          <Pin className="h-2.5 w-2.5" /> Pinned
                        </Badge>
                      )}
                      {post.is_removed && (
                        <Badge variant="danger" className="h-4 px-1.5 text-[9px] font-mono">
                          Removed
                        </Badge>
                      )}
                      <span className="font-mono text-xs text-muted-foreground">
                        u/{post.author?.username || "unknown"}
                      </span>
                    </div>

                    <Link
                      href={`/c/${activeCommunity.name}/post/${post.id}`}
                      className="font-semibold text-sm sm:text-base text-foreground hover:text-accent transition-colors block line-clamp-1"
                    >
                      {post.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleAction(
                          post.is_pinned ? "unpin" : "pin",
                          post.id
                        )
                      }
                      disabled={loadingAction === post.id + (post.is_pinned ? "unpin" : "pin")}
                      className={`h-7 text-xs ${
                        post.is_pinned ? "text-accent border-accent/30" : ""
                      }`}
                    >
                      <Pin className="h-3 w-3 mr-1" />
                      {post.is_pinned ? "Unpin" : "Pin"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleAction(
                          post.is_removed ? "restore_post" : "remove_post",
                          post.id
                        )
                      }
                      disabled={
                        loadingAction ===
                        post.id + (post.is_removed ? "restore_post" : "remove_post")
                      }
                      className={`h-7 text-xs ${
                        post.is_removed
                          ? "text-success border-success/30 hover:bg-success/10"
                          : "text-danger border-danger/30 hover:bg-danger/10"
                      }`}
                    >
                      {post.is_removed ? (
                        <>
                          <RotateCcw className="h-3 w-3 mr-1" /> Restore
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="curia-card p-8 text-center text-xs text-muted-foreground font-mono">
              No posts found in c/{activeCommunity.name}.
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: PINNED ANNOUNCEMENTS */}
        <TabsContent value="pins" className="mt-4 space-y-3">
          {pinnedPosts.length > 0 ? (
            pinnedPosts.map((post) => (
              <Card key={post.id} className="curia-card border-accent/30 bg-surface">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-mono text-accent">
                      <Pin className="h-3.5 w-3.5" />
                      <span>Pinned Announcement</span>
                    </div>
                    <p className="font-semibold text-sm text-foreground truncate mt-1">
                      {post.title}
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
  );
}
