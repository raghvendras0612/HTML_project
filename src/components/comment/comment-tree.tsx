"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CommentItem } from "@/components/comment/comment-item";
import { CommentForm } from "@/components/comment/comment-form";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import type { CommentWithRelations } from "@/types/database.types";
import { MessageSquare, Sparkles, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommentSort = "best" | "new" | "old" | "top";

interface CommentTreeProps {
  postId: string;
  communityName: string;
  focusedParentId?: string | null;
}

// Function to convert flat comments array into hierarchical tree
export function buildCommentTree(
  comments: CommentWithRelations[]
): CommentWithRelations[] {
  const commentMap = new Map<string, CommentWithRelations>();

  // Clone comments and initialize replies array
  comments.forEach((c) => {
    commentMap.set(c.id, { ...c, replies: [] });
  });

  const rootComments: CommentWithRelations[] = [];

  comments.forEach((c) => {
    const node = commentMap.get(c.id)!;
    if (c.parent_id && commentMap.has(c.parent_id)) {
      commentMap.get(c.parent_id)!.replies!.push(node);
    } else {
      rootComments.push(node);
    }
  });

  return rootComments;
}

export function CommentTree({
  postId,
  communityName,
  focusedParentId,
}: CommentTreeProps) {
  const searchParams = useSearchParams();
  const urlSort = (searchParams.get("sort") as CommentSort) || "best";
  const [commentSort, setCommentSort] = React.useState<CommentSort>(urlSort);

  // Incoming realtime comments queue
  const [incomingComments, setIncomingComments] = React.useState<CommentWithRelations[]>([]);

  React.useEffect(() => {
    if (urlSort && ["best", "new", "top", "old"].includes(urlSort)) {
      setCommentSort(urlSort);
    }
  }, [urlSort]);

  const handleSortChange = (newSort: CommentSort) => {
    setCommentSort(newSort);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("sort", newSort);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, "", newUrl);
    }
  };

  const { data, isLoading, isError, refetch } = useQuery<{
    comments: CommentWithRelations[];
    is_banned?: boolean;
    is_moderator?: boolean;
  }>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?post_id=${postId}`);
      if (!res.ok) throw new Error("Failed to load comments");
      return res.json();
    },
  });

  const rawComments = React.useMemo(() => data?.comments || [], [data?.comments]);

  // Realtime subscription for incoming comments on this post
  useRealtimeChannel<{ id: string; post_id: string; body: string }>({
    channelName: `comments-stream-${postId}`,
    table: "comments",
    event: "INSERT",
    filter: `post_id=eq.${postId}`,
    onEvent: async (payload) => {
      const newRow = payload.new;
      if (!newRow || !("id" in newRow) || !newRow.id) return;

      try {
        const res = await fetch(`/api/comments/${newRow.id}`);
        const json = await res.json();
        if (json.comment) {
          setIncomingComments((prev) => {
            if (prev.some((c) => c.id === json.comment.id)) return prev;
            if (rawComments.some((c) => c.id === json.comment.id)) return prev;
            return [...prev, json.comment];
          });
        }
      } catch {
        // Ignored
      }
    },
  });

  const handleMergeComments = () => {
    setIncomingComments([]);
    refetch();
  };

  // Sort comments according to selected filter
  const sortedComments = React.useMemo(() => {
    const list = [...rawComments];
    if (commentSort === "new") {
      list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (commentSort === "old") {
      list.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (commentSort === "top") {
      list.sort((a, b) => b.score - a.score);
    } else {
      // Best
      list.sort((a, b) => {
        const aUp = a.upvotes_count ?? Math.max(0, a.score);
        const aDown = a.downvotes_count ?? 0;
        const aRatio = aUp / (aUp + aDown + 1);

        const bUp = b.upvotes_count ?? Math.max(0, b.score);
        const bDown = b.downvotes_count ?? 0;
        const bRatio = bUp / (bUp + bDown + 1);

        return bRatio * b.score - aRatio * a.score;
      });
    }
    return list;
  }, [rawComments, commentSort]);

  const tree = React.useMemo(() => {
    const fullTree = buildCommentTree(sortedComments);
    if (focusedParentId) {
      function findSubtree(nodes: CommentWithRelations[]): CommentWithRelations | null {
        for (const n of nodes) {
          if (n.id === focusedParentId) return n;
          if (n.replies && n.replies.length > 0) {
            const found = findSubtree(n.replies);
            if (found) return found;
          }
        }
        return null;
      }
      const match = findSubtree(fullTree);
      return match ? [match] : [];
    }
    return fullTree;
  }, [sortedComments, focusedParentId]);

  return (
    <div className="space-y-4">
      {/* Top-Level Comment Composer (hidden when viewing focused subtree) */}
      {!focusedParentId && (
        <div className="p-4 rounded-xl border border-border/70 bg-surface/80 shadow-sm backdrop-blur">
          <h3 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Leave a Comment
          </h3>
          <CommentForm
            postId={postId}
            isBanned={data?.is_banned ?? false}
            placeholder="Share your technical perspective, rebuttal, or follow-up question..."
            onSuccess={() => refetch()}
          />
        </div>
      )}

      {/* Floating Realtime "N new comments" Pill */}
      {incomingComments.length > 0 && (
        <div className="sticky top-16 z-30 flex justify-center py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            data-testid="realtime-comments-pill"
            onClick={handleMergeComments}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent hover:bg-accent/90 text-white font-mono text-xs font-semibold shadow-glow transition-all cursor-pointer border border-accent-glow/40"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-glow animate-pulse" />
            <span>
              {incomingComments.length} new comment{incomingComments.length > 1 ? "s" : ""} (click to merge)
            </span>
            <ArrowUp className="h-3.5 w-3.5 ml-0.5" />
          </button>
        </div>
      )}

      {/* Comment Sorting Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5 text-accent" />
          <span className="font-semibold text-foreground">
            {rawComments.length} Comments
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSortChange("best")}
            className={cn(
              "h-7 text-xs font-mono",
              commentSort === "best" ? "text-accent bg-accent/15" : "text-muted-foreground"
            )}
          >
            Best
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSortChange("new")}
            className={cn(
              "h-7 text-xs font-mono",
              commentSort === "new" ? "text-accent bg-accent/15" : "text-muted-foreground"
            )}
          >
            New
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSortChange("top")}
            className={cn(
              "h-7 text-xs font-mono",
              commentSort === "top" ? "text-accent bg-accent/15" : "text-muted-foreground"
            )}
          >
            Top
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSortChange("old")}
            className={cn(
              "h-7 text-xs font-mono",
              commentSort === "old" ? "text-accent bg-accent/15" : "text-muted-foreground"
            )}
          >
            Old
          </Button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2.5">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-12 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <Card className="curia-card p-4 text-center border-danger/30">
          <p className="text-xs text-danger mb-2">Failed to load comments</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {/* Comments List */}
      {!isLoading && tree.length > 0 && (
        <div className="space-y-4 pt-1">
          {tree.map((rootComment) => (
            <CommentItem
              key={rootComment.id}
              comment={rootComment}
              communityName={communityName}
              isCommunityModerator={data?.is_moderator ?? false}
              isUserBanned={data?.is_banned ?? false}
              onCommentUpdated={() => refetch()}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && tree.length === 0 && (
        <div className="py-8 text-center text-xs text-muted-foreground font-mono space-y-1">
          <p>No comments yet.</p>
          <p className="text-[11px] text-muted-foreground/70">
            Be the first to share your technical perspective!
          </p>
        </div>
      )}
    </div>
  );
}
