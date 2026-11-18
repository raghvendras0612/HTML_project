"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  ArrowDown,
  Pin,
  ExternalLink,
  Share2,
  Trash2,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  Check,
  MessageSquare,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoteButtons } from "@/components/common/vote-buttons";
import { UserHoverCard } from "@/components/common/user-hover-card";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatScore, formatTimeAgo } from "@/lib/utils";
import type { PostWithRelations, VoteType } from "@/types/database.types";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { CommentTree } from "@/components/comment/comment-tree";
import { ThreadSummaryCard } from "@/components/post/thread-summary-card";

interface PostDetailViewProps {
  post: PostWithRelations;
  isAuthor: boolean;
  isModerator: boolean;
}

export function PostDetailView({
  post: initialPost,
  isAuthor: initialIsAuthor,
  isModerator: initialIsModerator,
}: PostDetailViewProps) {
  const router = useRouter();
  const { user, openAuthModal, updateUserKarma } = useAuth();

  const [post, setPost] = React.useState<PostWithRelations>(initialPost);
  const [currentVote, setCurrentVote] = React.useState<VoteType | null>(
    post.user_vote || null
  );
  const [score, setScore] = React.useState<number>(post.score);
  const [copied, setCopied] = React.useState(false);

  // Live score update from Realtime
  useRealtimeChannel<{ id: string; score: number }>({
    channelName: `post-detail-score-${post.id}`,
    table: "posts",
    filter: `id=eq.${post.id}`,
    event: "UPDATE",
    onEvent: (payload) => {
      const newRow = payload.new;
      if (newRow && "score" in newRow && typeof newRow.score === "number") {
        setScore(newRow.score);
      }
    },
  });

  // Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editBody, setEditBody] = React.useState(post.body || post.content_text || "");
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);

  // Moderator Action States
  const [isTogglingPin, setIsTogglingPin] = React.useState(false);
  const [isTogglingRemove, setIsTogglingRemove] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isAuthor = initialIsAuthor || (user && user.id === post.author_id);
  const isModerator = initialIsModerator;

  // Optimistic Vote Handler
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
          target_id: post.id,
          target_type: "post",
          vote_type: type,
        }),
      });

      if (!res.ok) throw new Error("Vote failed");
    } catch {
      setCurrentVote(previousVote);
      setScore(previousScore);
      updateUserKarma(-delta);
      toast.error("Failed to register vote");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Author Edit Body
  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update post");

      setPost((prev) => ({ ...prev, body: editBody, content_text: editBody }));
      setIsEditDialogOpen(false);
      toast.success("Post updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to edit post");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Author / Mod Delete Post
  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete post");
      }

      toast.success("Post deleted");
      router.push(`/c/${post.community?.name || "all"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete post");
      setIsDeleting(false);
    }
  };

  // Mod Pin / Unpin Post
  const handleTogglePin = async () => {
    setIsTogglingPin(true);
    const nextPinState = !post.is_pinned;

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: nextPinState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to pin post");

      setPost((prev) => ({ ...prev, is_pinned: nextPinState }));
      toast.success(nextPinState ? "Post pinned to community" : "Post unpinned");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle pin");
    } finally {
      setIsTogglingPin(false);
    }
  };

  // Mod Remove / Restore Post
  const handleToggleRemove = async () => {
    setIsTogglingRemove(true);
    const nextRemoveState = !post.is_removed;

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_removed: nextRemoveState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update remove status");

      setPost((prev) => ({ ...prev, is_removed: nextRemoveState }));
      toast.success(nextRemoveState ? "Post marked as removed" : "Post restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove post");
    } finally {
      setIsTogglingRemove(false);
    }
  };

  const postType = post.type ?? post.content_type ?? "text";
  const textBody = post.body ?? post.content_text;
  const linkUrl = post.url ?? post.content_url;

  // Resolve Image URL
  const imageUrl = React.useMemo(() => {
    if (post.image_path) {
      if (post.image_path.startsWith("http://") || post.image_path.startsWith("https://")) {
        return post.image_path;
      }
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      return `${supabaseUrl}/storage/v1/object/public/post-images/${post.image_path}`;
    }
    if (postType === "image" && linkUrl) {
      return linkUrl;
    }
    return null;
  }, [post.image_path, postType, linkUrl]);

  return (
    <div className="space-y-4">
      {/* Main Post Card */}
      <Card className="curia-card overflow-hidden">
        <CardContent className="p-0 flex">
          {/* Vote Column */}
          <div className="flex flex-col items-center justify-start p-3 bg-surface-raised/40 border-r border-border/60 shrink-0 w-12 sm:w-14">
            <VoteButtons
              targetType="post"
              targetId={post.id}
              score={post.score}
              myVote={post.user_vote}
              orientation="vertical"
            />
          </div>

          {/* Post Content Column */}
          <div className="flex-1 p-4 sm:p-6 min-w-0 space-y-4">
            {/* Metadata Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted-foreground border-b border-border/40 pb-3">
              <div className="flex flex-wrap items-center gap-1.5">
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
                      className="hover:underline text-foreground font-semibold"
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

              {/* Action Buttons for Author & Mod */}
              <div className="flex items-center gap-1">
                {isAuthor && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDeleting}
                      onClick={handleDeletePost}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-danger gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </Button>
                  </>
                )}

                {isModerator && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isTogglingPin}
                      onClick={handleTogglePin}
                      className={`h-7 text-xs px-2 gap-1 ${
                        post.is_pinned
                          ? "text-accent bg-accent/10"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Pin className="h-3 w-3" />
                      <span>{post.is_pinned ? "Unpin" : "Pin"}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isTogglingRemove}
                      onClick={handleToggleRemove}
                      className={`h-7 text-xs px-2 gap-1 ${
                        post.is_removed
                          ? "text-success bg-success/10"
                          : "text-danger hover:bg-danger/10"
                      }`}
                    >
                      <ShieldAlert className="h-3 w-3" />
                      <span>{post.is_removed ? "Restore" : "Remove"}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Post Title */}
            <h1 className="text-lg sm:text-2xl font-bold font-sans text-foreground leading-tight">
              {post.title}
            </h1>

            {/* Post Body Rendering */}
            {post.is_removed ? (
              <div className="p-4 rounded-lg bg-surface-raised border border-border/80 text-xs text-muted-foreground font-mono flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-danger" />
                <span>[removed by moderators]</span>
              </div>
            ) : (
              <>
                {/* Text Post: Full Markdown Render */}
                {postType === "text" && textBody && (
                  <div className="prose prose-invert prose-sm sm:prose-base max-w-none font-sans text-foreground leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true}>
                      {textBody}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Image Post: Full Image View */}
                {postType === "image" && imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-border bg-black/40 flex items-center justify-center my-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={post.title}
                      className="max-h-[36rem] w-full object-contain"
                    />
                  </div>
                )}

                {/* Link Post: External URL Box */}
                {postType === "link" && linkUrl && (
                  <div className="p-4 rounded-xl bg-surface-raised border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                        External Resource
                      </p>
                      <p className="font-mono text-sm text-accent truncate">
                        {linkUrl}
                      </p>
                    </div>
                    <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-white shadow-glow-sm shrink-0">
                      <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Open Link
                      </a>
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Footer Bar */}
            <div className="flex items-center gap-2 pt-3 border-t border-border/50 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-raised">
                <MessageSquare className="h-3.5 w-3.5 text-accent" />
                <span>{post.comment_count ?? post.comments_count ?? 0} comments</span>
              </span>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-surface-raised hover:text-foreground transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span className="text-success">Copied link</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Author Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Post Body</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              placeholder="Update post body markdown..."
              className="min-h-56 bg-surface-raised border-border text-xs sm:text-sm font-sans"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSavingEdit}
              onClick={handleSaveEdit}
              className="bg-accent hover:bg-accent/90 text-white shadow-glow-sm"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Thread Summarizer with AI (Requirement 4 & 5) */}
      <ThreadSummaryCard
        postId={post.id}
        commentCount={post.comment_count ?? post.comments_count ?? 0}
      />

      {/* Comments Section */}
      <div className="pt-2">
        <CommentTree
          postId={post.id}
          communityName={post.community?.name || "all"}
        />
      </div>
    </div>
  );
}
