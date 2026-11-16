"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  CornerDownRight,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentForm } from "@/components/comment/comment-form";
import { cn, formatScore, formatTimeAgo } from "@/lib/utils";
import type { CommentWithRelations, VoteType } from "@/types/database.types";
import { useAuth } from "@/context/auth-context";

interface CommentItemProps {
  comment: CommentWithRelations;
  communityName: string;
  onCommentAdded?: () => void;
  maxDepthThreshold?: number;
}

export function CommentItem({
  comment,
  communityName,
  onCommentAdded,
  maxDepthThreshold = 6,
}: CommentItemProps) {
  const { user, openAuthModal, updateUserKarma } = useAuth();

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isReplying, setIsReplying] = React.useState(false);

  // Optimistic Vote State
  const [currentVote, setCurrentVote] = React.useState<VoteType | null>(
    comment.user_vote || null
  );
  const [score, setScore] = React.useState<number>(comment.score);

  const handleVote = async (type: VoteType) => {
    if (!user) {
      openAuthModal("signin");
      return;
    }

    const previousVote = currentVote;
    const previousScore = score;

    let delta = 0;
    let nextVote: VoteType | null = null;

    if (currentVote === type) {
      delta = -type;
      nextVote = null;
    } else if (currentVote !== null) {
      delta = type * 2;
      nextVote = type;
    } else {
      delta = type;
      nextVote = type;
    }

    setCurrentVote(nextVote);
    setScore((s) => s + delta);
    updateUserKarma(delta);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_id: comment.id,
          target_type: "comment",
          vote_type: type,
        }),
      });

      if (!res.ok) {
        throw new Error("Comment vote failed");
      }
    } catch {
      setCurrentVote(previousVote);
      setScore(previousScore);
      updateUserKarma(-delta);
    }
  };

  const countTotalDescendants = (node: CommentWithRelations): number => {
    if (!node.replies || node.replies.length === 0) return 0;
    return node.replies.reduce(
      (sum, child) => sum + 1 + countTotalDescendants(child),
      0
    );
  };

  const descendantCount = countTotalDescendants(comment);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isThresholdReached = comment.depth >= maxDepthThreshold && hasReplies;

  const authorName = comment.is_removed
    ? "[deleted]"
    : comment.author?.username || "unknown";

  const initials = authorName.substring(0, 2).toUpperCase();

  return (
    <div className="relative group/comment text-xs">
      <div className="flex items-start gap-2 pt-2">
        {/* Author Avatar or Collapse pill */}
        <Avatar className="h-6 w-6 border border-border/80 shrink-0 mt-0.5">
          {!comment.is_removed && comment.author?.avatar_url && (
            <AvatarImage src={comment.author.avatar_url} alt={authorName} />
          )}
          <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
        </Avatar>

        {/* Comment Body & Actions */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Link
              href={comment.is_removed ? "#" : `/u/${authorName}`}
              className={cn(
                "font-semibold hover:underline",
                comment.is_removed ? "text-muted-foreground cursor-default" : "text-foreground"
              )}
            >
              u/{authorName}
            </Link>

            <span>•</span>
            <span title={new Date(comment.created_at).toLocaleString()}>
              {formatTimeAgo(comment.created_at)}
            </span>

            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto text-[10px] text-muted-foreground hover:text-accent flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-surface-raised"
              title={isCollapsed ? "Expand thread" : "Collapse thread"}
            >
              {isCollapsed ? (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span>+{descendantCount + 1}</span>
                </>
              ) : (
                <ChevronDown className="h-3 w-3 opacity-60" />
              )}
            </button>
          </div>

          {!isCollapsed && (
            <>
              {/* Comment Content */}
              <div className="mt-1 text-foreground font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {comment.is_removed ? (
                  <span className="italic text-muted-foreground">
                    [comment removed by moderator]
                  </span>
                ) : (
                  comment.content
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-2 mt-1.5 text-muted-foreground font-mono text-[11px]">
                {/* Vote buttons */}
                <div className="flex items-center bg-surface-raised/60 rounded px-1 border border-border/40">
                  <button
                    onClick={() => handleVote(1)}
                    className={cn(
                      "p-0.5 rounded transition-colors",
                      currentVote === 1
                        ? "text-upvote font-bold"
                        : "hover:text-upvote"
                    )}
                    aria-label="Upvote comment"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <span
                    className={cn(
                      "px-1.5 font-semibold text-[11px]",
                      currentVote === 1 && "text-upvote",
                      currentVote === -1 && "text-downvote"
                    )}
                  >
                    {formatScore(score)}
                  </span>
                  <button
                    onClick={() => handleVote(-1)}
                    className={cn(
                      "p-0.5 rounded transition-colors",
                      currentVote === -1
                        ? "text-downvote font-bold"
                        : "hover:text-downvote"
                    )}
                    aria-label="Downvote comment"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Reply toggle */}
                <button
                  onClick={() => {
                    if (!user) {
                      openAuthModal("signin");
                      return;
                    }
                    setIsReplying(!isReplying);
                  }}
                  className="flex items-center gap-1 hover:text-foreground hover:bg-surface-raised px-1.5 py-0.5 rounded transition-colors"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>Reply</span>
                </button>
              </div>

              {/* Inline Reply Form */}
              {isReplying && (
                <div className="mt-2 pl-2 border-l-2 border-accent/40">
                  <CommentForm
                    postId={comment.post_id}
                    parentId={comment.id}
                    autoFocus
                    placeholder={`Reply to u/${authorName}...`}
                    onSuccess={() => {
                      setIsReplying(false);
                      if (onCommentAdded) onCommentAdded();
                    }}
                    onCancel={() => setIsReplying(false)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Nested Replies with Vertical Guide Line */}
      {!isCollapsed && hasReplies && (
        <div className="relative pl-3 sm:pl-4 ml-3 sm:ml-3 mt-1">
          {/* Clickable Vertical Guide Line */}
          <button
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse comment thread"
            className="absolute left-0 top-0 bottom-0 w-3 -ml-1 group/line flex justify-center cursor-pointer focus:outline-none"
            title="Click to collapse thread"
          >
            <span className="w-[1.5px] h-full bg-border group-hover/line:bg-accent/80 transition-colors" />
          </button>

          {isThresholdReached ? (
            /* Continue Thread boundary link past depth 6 */
            <div className="py-2 pl-2">
              <Link
                href={`/c/${communityName}/comments/${comment.post_id}?parent=${comment.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-accent hover:border-accent font-mono text-xs transition-colors"
              >
                <CornerDownRight className="h-3.5 w-3.5 text-accent-glow" />
                <span>Continue this thread ({descendantCount} more replies) →</span>
              </Link>
            </div>
          ) : (
            /* Render direct children recursively */
            <div className="space-y-2">
              {comment.replies!.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  communityName={communityName}
                  onCommentAdded={onCommentAdded}
                  maxDepthThreshold={maxDepthThreshold}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
