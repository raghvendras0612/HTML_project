"use client";

import * as React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageSquare,
  CornerDownRight,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CommentForm } from "@/components/comment/comment-form";
import { VoteButtons } from "@/components/common/vote-buttons";
import { UserHoverCard } from "@/components/common/user-hover-card";
import { ReportDialog } from "@/components/post/report-dialog";
import { BanUserDialog } from "@/components/community/ban-user-dialog";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { CommentWithRelations } from "@/types/database.types";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

interface CommentItemProps {
  comment: CommentWithRelations;
  communityName: string;
  isCommunityModerator?: boolean;
  isUserBanned?: boolean;
  onCommentUpdated?: () => void;
  maxDepthThreshold?: number;
}

export function CommentItem({
  comment: initialComment,
  communityName,
  isCommunityModerator = false,
  isUserBanned = false,
  onCommentUpdated,
  maxDepthThreshold = 5,
}: CommentItemProps) {
  const { user, openAuthModal } = useAuth();
  const [comment, setComment] = React.useState<CommentWithRelations>(initialComment);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isReplying, setIsReplying] = React.useState(false);

  // Edit State
  const [isEditing, setIsEditing] = React.useState(false);
  const [editBody, setEditBody] = React.useState(comment.body || comment.content || "");
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);

  // Dialog States
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const [isBanOpen, setIsBanOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isHighlighted, setIsHighlighted] = React.useState(false);

  // Check URL hash for direct comment deep link highlight
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === `#comment-${comment.id}`) {
      setIsHighlighted(true);
      const el = document.getElementById(`comment-${comment.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [comment.id]);

  // Sync comment if updated from props
  React.useEffect(() => {
    setComment(initialComment);
    setEditBody(initialComment.body || initialComment.content || "");
  }, [initialComment]);

  const authorName = comment.author?.username || "unknown";
  const initials = authorName.substring(0, 2).toUpperCase();

  const isAuthor = Boolean(user && user.id === comment.author_id);
  const isModerator = isCommunityModerator;
  const isSoftDeleted = comment.body === "[deleted]";
  const isRemoved = comment.is_removed;
  const isEdited = Boolean(
    comment.updated_at &&
      comment.created_at &&
      new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() > 1000
  );

  const countTotalDescendants = (node: CommentWithRelations): number => {
    if (!node.replies || node.replies.length === 0) return 0;
    return node.replies.reduce(
      (sum, child) => sum + 1 + countTotalDescendants(child),
      0
    );
  };

  const descendantCount = countTotalDescendants(comment);
  const hasReplies = Boolean(comment.replies && comment.replies.length > 0);
  const isThresholdReached = (comment.depth ?? 0) >= maxDepthThreshold;

  // Author Edit
  const handleSaveEdit = async () => {
    if (!editBody.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update comment");

      setComment((prev) => ({
        ...prev,
        body: editBody.trim(),
        content: editBody.trim(),
        updated_at: new Date().toISOString(),
      }));
      setIsEditing(false);
      toast.success("Comment edited");
      onCommentUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Edit failed");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete comment");

      if (data.isSoftDeleted) {
        setComment((prev) => ({
          ...prev,
          body: "[deleted]",
          content: "[deleted]",
        }));
      }
      toast.success("Comment deleted");
      onCommentUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // Moderator Remove / Restore
  const handleToggleRemove = async () => {
    try {
      const nextRemoved = !comment.is_removed;
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_removed: nextRemoved }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Moderator action failed");

      setComment((prev) => ({
        ...prev,
        is_removed: nextRemoved,
      }));
      toast.success(nextRemoved ? "Comment removed by moderator" : "Comment restored");
      onCommentUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className={cn(
        "relative group/comment text-xs transition-all duration-500 rounded-lg",
        isHighlighted && "ring-2 ring-accent bg-accent/15 p-2 shadow-glow-sm"
      )}
    >
      <div className="flex items-start gap-2 pt-2">
        {/* Author Avatar */}
        <Avatar className="h-6 w-6 border border-border/80 shrink-0 mt-0.5">
          {!isRemoved && !isSoftDeleted && comment.author?.avatar_url && (
            <AvatarImage src={comment.author.avatar_url} alt={authorName} />
          )}
          <AvatarFallback className="text-[9px]">
            {isSoftDeleted ? "?" : initials}
          </AvatarFallback>
        </Avatar>

        {/* Comment Body & Actions */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            {isSoftDeleted ? (
              <span className="font-semibold text-muted-foreground">[deleted]</span>
            ) : isRemoved ? (
              <span className="font-semibold text-danger/80">[removed by moderators]</span>
            ) : (
              <UserHoverCard
                username={authorName}
                initialProfile={comment.author}
              >
                <Link
                  href={`/u/${authorName}`}
                  className="font-semibold text-foreground hover:underline"
                >
                  u/{authorName}
                </Link>
              </UserHoverCard>
            )}

            <span>•</span>
            <span title={new Date(comment.created_at).toLocaleString()}>
              {formatTimeAgo(comment.created_at)}
            </span>

            {isEdited && !isSoftDeleted && !isRemoved && (
              <span className="text-[10px] text-muted-foreground italic">(edited)</span>
            )}

            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto text-[10px] text-muted-foreground hover:text-accent flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-surface-raised transition-colors"
              title={isCollapsed ? "Expand thread" : "Collapse thread"}
            >
              {isCollapsed ? (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-mono">[+] {descendantCount + 1} replies</span>
                </>
              ) : (
                <ChevronDown className="h-3 w-3 opacity-60" />
              )}
            </button>
          </div>

          {!isCollapsed && (
            <>
              {/* Comment Content / Edit Form */}
              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className="w-full text-xs sm:text-sm bg-surface border-border"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit || !editBody.trim()}
                      className="text-xs h-7 px-3"
                    >
                      {isSavingEdit && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      disabled={isSavingEdit}
                      className="text-xs h-7 px-3"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-foreground font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {isRemoved ? (
                    <span className="italic text-muted-foreground font-mono text-xs">
                      [removed by moderators]
                    </span>
                  ) : isSoftDeleted ? (
                    <span className="italic text-muted-foreground font-mono text-xs">
                      [deleted]
                    </span>
                  ) : (
                    <div className="prose prose-invert max-w-none text-xs sm:text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true}>
                        {comment.body || comment.content || ""}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar */}
              {!isSoftDeleted && !isRemoved && (
                <div className="flex items-center gap-3 mt-1.5 text-muted-foreground font-mono text-[11px]">
                  {/* Reusable Vote Buttons */}
                  <div className="flex items-center bg-surface-raised/40 rounded px-1 border border-border/40">
                    <VoteButtons
                      targetType="comment"
                      targetId={comment.id}
                      score={comment.score}
                      myVote={comment.user_vote}
                      orientation="horizontal"
                      size="sm"
                    />
                  </div>

                  {/* Reply Action */}
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

                  {/* Author Edit Action */}
                  {isAuthor && (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-1 hover:text-foreground hover:bg-surface-raised px-1.5 py-0.5 rounded transition-colors"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                  )}

                  {/* Delete Action (Author or Mod) */}
                  {(isAuthor || isModerator) && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-1 hover:text-danger hover:bg-danger/10 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  )}

                  {/* More Dropdown (Report & Moderator actions) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-0.5 hover:text-foreground hover:bg-surface-raised rounded">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-surface border-border text-xs">
                      {user && !isAuthor && (
                        <DropdownMenuItem
                          onClick={() => setIsReportOpen(true)}
                          className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                          <span>Report Comment</span>
                        </DropdownMenuItem>
                      )}

                      {isModerator && (
                        <>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            onClick={handleToggleRemove}
                            className="gap-2 cursor-pointer text-danger hover:text-danger"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Remove Comment (Mod)</span>
                          </DropdownMenuItem>

                          {comment.author_id && !isAuthor && (
                            <DropdownMenuItem
                              onClick={() => setIsBanOpen(true)}
                              className="gap-2 cursor-pointer text-danger hover:text-danger"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Ban u/{authorName}</span>
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Inline Reply Form */}
              {isReplying && (
                <div className="mt-2 pl-2 border-l-2 border-accent/40">
                  <CommentForm
                    postId={comment.post_id}
                    parentId={comment.id}
                    isBanned={isUserBanned}
                    autoFocus
                    placeholder={`Reply to u/${authorName}...`}
                    onSuccess={() => {
                      setIsReplying(false);
                      onCommentUpdated?.();
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
          {/* Clickable Vertical Guide Line with hover highlighting */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
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
                href={`/c/${communityName}/post/${comment.post_id}/comment/${comment.id}`}
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
                  isCommunityModerator={isCommunityModerator}
                  isUserBanned={isUserBanned}
                  onCommentUpdated={onCommentUpdated}
                  maxDepthThreshold={maxDepthThreshold}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isReportOpen && (
        <ReportDialog
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          commentId={comment.id}
          targetTitle={comment.body?.substring(0, 50)}
        />
      )}

      {isBanOpen && comment.author_id && (
        <BanUserDialog
          isOpen={isBanOpen}
          onClose={() => setIsBanOpen(false)}
          communityName={communityName}
          userId={comment.author_id}
          username={authorName}
          onSuccess={() => onCommentUpdated?.()}
        />
      )}
    </div>
  );
}
