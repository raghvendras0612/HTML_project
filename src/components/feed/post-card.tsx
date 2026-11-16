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
import { Badge } from "@/components/ui/badge";
import { VoteButtons } from "@/components/common/vote-buttons";
import { UserHoverCard } from "@/components/common/user-hover-card";
import { cn, formatScore, formatTimeAgo } from "@/lib/utils";
import type { PostWithRelations, VoteType } from "@/types/database.types";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

interface PostCardProps {
  post: PostWithRelations;
  onSummarize?: (post: PostWithRelations) => void;
}

export function PostCard({ post, onSummarize }: PostCardProps) {
  const { user, openAuthModal, updateUserKarma } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const communityName = post.community?.name || "all";
  const postUrl = `/c/${communityName}/post/${post.id}`;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${postUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const postType = post.type ?? post.content_type ?? "text";
  const textBody = post.body ?? post.content_text;
  const linkUrl = post.url ?? post.content_url;
  const commentCount = post.comment_count ?? post.comments_count ?? 0;

  // Resolve image URL
  const imageUrl = React.useMemo(() => {
    if (post.image_path) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      return `${supabaseUrl}/storage/v1/object/public/post-images/${post.image_path}`;
    }
    if (postType === "image" && linkUrl) {
      return linkUrl;
    }
    return null;
  }, [post.image_path, postType, linkUrl]);

  // Extract domain for link posts
  const domain = React.useMemo(() => {
    if (!linkUrl) return "";
    try {
      return new URL(linkUrl).hostname.replace(/^www\./, "");
    } catch {
      return linkUrl;
    }
  }, [linkUrl]);

  return (
    <Card className="curia-card overflow-hidden hover:border-accent/40 transition-all duration-150 group">
      <CardContent className="p-0 flex">
        {/* Left: Vote Column */}
        <div className="flex flex-col items-center justify-start p-2 sm:p-2.5 bg-surface-raised/40 border-r border-border/60 shrink-0 w-11 sm:w-12">
          <VoteButtons
            targetType="post"
            targetId={post.id}
            score={post.score}
            myVote={post.user_vote}
            orientation="vertical"
          />
        </div>

        {/* Right: Content Column */}
        <div className="flex-1 p-3.5 sm:p-4 min-w-0 space-y-2.5">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-mono">
            {post.is_pinned && (
              <Badge variant="outline" className="h-4 px-1.5 text-[9px] gap-1 bg-accent/10 text-accent border-accent/30">
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
            <span className="inline-flex items-center">
              Posted by&nbsp;
              <UserHoverCard
                username={post.author?.username || "deleted"}
                initialProfile={post.author}
              >
                <Link
                  href={`/u/${post.author?.username || "deleted"}`}
                  className="hover:underline text-muted-foreground hover:text-foreground font-semibold"
                >
                  u/{post.author?.username || "deleted"}
                </Link>
              </UserHoverCard>
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

          {/* Post Body: Text snippet */}
          {postType === "text" && textBody && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed font-sans">
              {textBody}
            </p>
          )}

          {/* Post Body: Image preview */}
          {postType === "image" && imageUrl && (
            <div className="rounded-lg overflow-hidden border border-border bg-black/40 max-h-96 flex items-center justify-center my-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={post.title}
                className="max-h-96 w-full object-contain"
                loading="lazy"
              />
            </div>
          )}

          {/* Post Body: Link domain badge */}
          {postType === "link" && linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-xs text-accent hover:border-accent/50 font-mono transition-colors my-1"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="font-semibold">{domain}</span>
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
              <span>{commentCount} comments</span>
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

            {/* Gemini AI Summarizer shortcut if callback passed */}
            {onSummarize && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSummarize(post);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent/10 text-accent transition-colors ml-auto"
                title="Summarize thread with Gemini AI"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AI Summary</span>
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
