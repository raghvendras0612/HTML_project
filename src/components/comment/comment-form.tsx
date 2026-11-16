"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModerationWarningDialog } from "@/components/post/moderation-warning-dialog";

const MAX_COMMENT_LENGTH = 10000;

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  isBanned?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  postId,
  parentId = null,
  isBanned = false,
  onSuccess,
  onCancel,
  placeholder = "What are your thoughts?",
  autoFocus = false,
}: CommentFormProps) {
  const { user, profile, openAuthModal } = useAuth();
  const [content, setContent] = React.useState("");
  const [mode, setMode] = React.useState<"write" | "preview">("write");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isWarnDialogOpen, setIsWarnDialogOpen] = React.useState(false);
  const [warnReason, setWarnReason] = React.useState("");

  const charCount = content.length;
  const isOverLimit = charCount > MAX_COMMENT_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("signin");
      return;
    }

    if (isBanned) {
      setErrorMsg("You are banned from this community and cannot comment.");
      return;
    }

    if (!content.trim()) {
      setErrorMsg("Comment cannot be empty");
      return;
    }

    if (isOverLimit) {
      setErrorMsg(`Comment cannot exceed ${MAX_COMMENT_LENGTH.toLocaleString()} characters`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // AI Moderation Pre-check
    try {
      const modRes = await fetch("/api/ai/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content.trim() }),
      });

      if (modRes.ok) {
        const modData = await modRes.json();
        if (modData.verdict === "block") {
          setErrorMsg(modData.reason || "Comment blocked by content safety policy.");
          setIsSubmitting(false);
          return;
        }
        if (modData.verdict === "warn") {
          setWarnReason(
            modData.reason || "This comment may come across as hostile or insulting."
          );
          setIsWarnDialogOpen(true);
          setIsSubmitting(false);
          return;
        }
      }
    } catch {
      // Fail open if moderate endpoint encounters an error
    }

    await executeCommentSubmit("allow");
  };

  const executeCommentSubmit = async (verdict: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          parent_id: parentId,
          content: content.trim(),
          moderation_verdict: verdict,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit comment");
      }

      setContent("");
      setMode("write");
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Submission error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBanned) {
    return (
      <div className="flex items-center gap-2.5 p-3.5 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs sm:text-sm font-mono">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>You are banned from this community and cannot comment.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center justify-between">
        {profile ? (
          <p className="text-[11px] font-mono text-muted-foreground">
            Comment as <span className="text-foreground font-semibold">u/{profile.username}</span>
          </p>
        ) : (
          <span />
        )}

        {/* Write / Preview Tab switcher */}
        <div className="flex items-center gap-2">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "write" | "preview")}>
            <TabsList className="h-6 bg-surface-raised p-0.5 border border-border/60">
              <TabsTrigger value="write" className="text-[10px] h-5 px-2">
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-[10px] h-5 px-2">
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <span
            className={cn(
              "text-[10px] font-mono tabular-nums",
              isOverLimit ? "text-danger font-semibold" : "text-muted-foreground"
            )}
          >
            {charCount.toLocaleString()} / {MAX_COMMENT_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      {mode === "write" ? (
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder={user ? placeholder : "Sign in to leave a comment..."}
          rows={parentId ? 3 : 4}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          className="w-full text-xs sm:text-sm bg-surface-raised/50 focus:bg-surface border-border"
        />
      ) : (
        <div className="min-h-[80px] p-3 rounded-md border border-border/80 bg-surface-raised/30 text-xs sm:text-sm prose prose-invert max-w-none">
          {content.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true}>
              {content}
            </ReactMarkdown>
          ) : (
            <span className="text-muted-foreground italic text-xs font-mono">
              Nothing to preview.
            </span>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] text-danger font-mono font-medium">{errorMsg}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs h-7"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !content.trim() || isOverLimit}
          className="text-xs h-8 px-4 font-semibold shadow-glow-sm"
        >
          {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {parentId ? "Reply" : "Comment"}
        </Button>
      </div>

      <ModerationWarningDialog
        open={isWarnDialogOpen}
        reason={warnReason}
        onEdit={() => setIsWarnDialogOpen(false)}
        onConfirm={() => {
          setIsWarnDialogOpen(false);
          executeCommentSubmit("warn");
        }}
      />
    </form>
  );
}
