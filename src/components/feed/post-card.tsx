"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Share2,
  Pin,
  ExternalLink,
  Sparkles,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatScore, formatTimeAgo } from "@/lib/utils";
import type { PostWithRelations, VoteType } from "@/types/database.types";
import { useAuth } from "@/context/auth-context";

interface PostCardProps {
  post: PostWithRelations;
  onSummarize?: (post: PostWithRelations) => void;
}

export function PostCard({ post, onSummarize }: PostCardProps) {
  const { user, openAuthModal, updateUserKarma } = useAuth();

  // Optimistic Vote State
  const [currentVote, setCurrentVote] = React.useState<VoteType | null>(
    post.user_vote || null
  );
  const [score, setScore] = React.useState<number>(post.score);
  const [copied, setCopied] = React.useState(false);

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
      // Unvote / cancel
      delta = -type;
      nextVote = null;
    } else if (currentVote !== null) {
      // Flip vote (+1 to -1 or -1 to +1)
      delta = type * 2;
      nextVote = type;
    } else {
      // New vote
      delta = type;
      nextVote = type;
    }

    // Apply optimistic update immediately
    setCurrentVote(nextVote);
    setScore((s) => s + delta);
    updateUserKarma(delta);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_id: post.id,
          target_type: "post",
          vote_type: type,
        }),
      });

      if (!res.ok) {
        throw new Error("Vote failed");
      }
    } catch {
      // Rollback on error
      setCurrentVote(previousVote);
      setScore(previousScore);
      updateUserKarma(-delta);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/c/${post.community?.name || "all"}/comments/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const communityName = post.community?.name || "all";
  const postUrl = `/c/${communityName}/comments/${post.id}`;

  return (
    <Card className="curia-card overflow-hidden hover:border-accent/40 transition-all duration-150 group">
      <CardContent className="p-0 flex">
        {/* Left: Vote Column */}
        <div className="flex flex-col items-center justify-start p-2 sm:p-2.5 bg-surface-raised/40 border-r border-border/60 shrink-0 w-11 sm:w-12">
          <button
            onClick={() => handleVote(1)}
            aria-label="Upvote post"
            className={cn(
              "p-1 rounded-md transition-colors",
              currentVote === 1
                ? "text-upvote bg-upvote/15 font-bold"
                : "text-muted-foreground hover:text-upvote hover:bg-upvote/10"
            )}
          >
            <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          <span
            className={cn(
              "font-mono text-xs sm:text-sm font-semibold my-1 select-none",
              currentVote === 1 && "text-upvote",
              currentVote === -1 && "text-downvote",
              !currentVote && "text-foreground"
            )}
          >
            {formatScore(score)}
          </span>

          <button
            onClick={() => handleVote(-1)}
            aria-label="Downvote post"
            className={cn(
              "p-1 rounded-md transition-colors",
              currentVote === -1
                ? "text-downvote bg-downvote/15 font-bold"
                : "text-muted-foreground hover:text-downvote hover:bg-downvote/10"
            )}
          >
            <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Right: Content Column */}
        <div className="flex-1 p-3.5 sm:p-4 min-w-0 space-y-2.5">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-mono">
            {post.is_pinned && (
              <Badge variant="mod" className="h-4 px-1.5 text-[9px] gap-1">
                <Pin className="h-2.5 w-2.5" /> Pinned
              </Badge>
            )}

            {post.community && (
              <Link
                href={`/c/${post.community.name}`}
                className="font-bold text-foreground hover:text-accent transition-colors"
              >
                c/{post.community.name}
              </Link>
            )}

            <span>•</span>
            <span>
              Posted by{" "}
              <Link
                href={`/u/${post.author?.username || "deleted"}`}
                className="hover:underline text-muted-foreground hover:text-foreground"
              >
                u/{post.author?.username || "deleted"}
              </Link>
            </span>
            <span>•</span>
            <span title={new Date(post.created_at).toLocaleString()}>
              {formatTimeAgo(post.created_at)}
            </span>
          </div>

          {/* Post Title */}
          <Link href={postUrl} className="block group-hover:text-accent transition-colors">
            <h2 className="font-sans font-bold text-sm sm:text-base text-foreground leading-snug">
              {post.title}
            </h2>
          </Link>

          {/* Post Body: Text */}
          {post.content_type === "text" && post.content_text && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed font-sans">
              {post.content_text}
            </p>
          )}

          {/* Post Body: Image */}
          {post.content_type === "image" && post.content_url && (
            <div className="rounded-lg overflow-hidden border border-border bg-black/40 max-h-96 flex items-center justify-center my-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.content_url}
                alt={post.title}
                className="max-h-96 w-full object-contain"
                loading="lazy"
              />
            </div>
          )}

          {/* Post Body: Link */}
          {post.content_type === "link" && post.content_url && (
            <a
              href={post.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-xs text-accent hover:border-accent/50 font-mono transition-colors my-1"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-xs">{post.content_url}</span>
            </a>
          )}

          {/* Footer Action Bar */}
          <div className="flex items-center gap-1 sm:gap-2 pt-1 border-t border-border/40 text-xs font-mono text-muted-foreground">
            {/* Comments button */}
            <Link
              href={postUrl}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-surface-raised hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{post.comments_count} comments</span>
            </Link>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-surface-raised hover:text-foreground transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span className="text-success">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Gemini AI Summarizer shortcut */}
            {onSummarize && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onSummarize(post);
                }}
                className="ml-auto hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 text-[11px] transition-colors"
                title="Summarize thread with Gemini AI"
              >
                <Sparkles className="h-3 w-3 text-accent-glow" />
                <span>AI TL;DR</span>
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
