"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  postId,
  parentId = null,
  onSuccess,
  onCancel,
  placeholder = "What are your thoughts?",
  autoFocus = false,
}: CommentFormProps) {
  const { user, profile, openAuthModal } = useAuth();
  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("signin");
      return;
    }

    if (!content.trim()) {
      setErrorMsg("Comment cannot be empty");
      return;
    }

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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit comment");
      }

      setContent("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Submission error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {profile && (
        <p className="text-[11px] font-mono text-muted-foreground">
          Comment as <span className="text-foreground font-semibold">u/{profile.username}</span>
        </p>
      )}

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={user ? placeholder : "Sign in to leave a comment..."}
        rows={parentId ? 3 : 4}
        autoFocus={autoFocus}
        disabled={isSubmitting}
        className="w-full text-xs sm:text-sm bg-surface-raised/50 focus:bg-surface border-border"
      />

      {errorMsg && (
        <p className="text-[11px] text-danger">{errorMsg}</p>
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
          disabled={isSubmitting || !content.trim()}
          className="text-xs h-8 px-4 font-semibold shadow-glow-sm"
        >
          {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {parentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
