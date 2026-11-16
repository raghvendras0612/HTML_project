"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CommentItem } from "@/components/comment/comment-item";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { CommentWithRelations } from "@/types/database.types";
import { MessageSquare, Flame, Clock, Trophy, History } from "lucide-react";
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
  const [commentSort, setCommentSort] = React.useState<CommentSort>("best");

  const { data, isLoading, isError, refetch } = useQuery<{
    comments: CommentWithRelations[];
  }>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?post_id=${postId}`);
      if (!res.ok) throw new Error("Failed to load comments");
      return res.json();
    },
  });

  const rawComments = React.useMemo(() => data?.comments || [], [data?.comments]);

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
      // Best: Wilson score approximation or positive vote ratio
      list.sort((a, b) => {
        const aRatio = a.upvotes_count / (a.upvotes_count + a.downvotes_count + 1);
        const bRatio = b.upvotes_count / (b.upvotes_count + b.downvotes_count + 1);
        return bRatio * b.score - aRatio * a.score;
      });
    }
    return list;
  }, [rawComments, commentSort]);

  const tree = React.useMemo(() => {
    if (focusedParentId) {
      // When focusing on a subtree (past depth 6)
      const focusedNode = sortedComments.find((c) => c.id === focusedParentId);
      if (focusedNode) {
        return buildCommentTree(sortedComments).filter((c) => c.id === focusedParentId);
      }
    }
    return buildCommentTree(sortedComments);
  }, [sortedComments, focusedParentId]);

  return (
    <div className="space-y-3">
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
            onClick={() => setCommentSort("best")}
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
            onClick={() => setCommentSort("new")}
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
            onClick={() => setCommentSort("top")}
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
            onClick={() => setCommentSort("old")}
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
              onCommentAdded={() => refetch()}
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
