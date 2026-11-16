"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  commentId?: string;
  targetTitle?: string;
}

const REPORT_REASONS = [
  "Spam or self-promotion",
  "Harassment or bullying",
  "Hate speech or symbols",
  "Misinformation or harmful advice",
  "Violation of community rules",
  "Other issues",
];

export function ReportDialog({
  isOpen,
  onClose,
  postId,
  commentId,
  targetTitle,
}: ReportDialogProps) {
  const [reason, setReason] = React.useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const fullReason = details.trim() ? `${reason}: ${details.trim()}` : reason;
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId || null,
          comment_id: commentId || null,
          reason: fullReason,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit report");
      }

      toast.success("Thank you for your report. Community moderators have been notified.");
      onClose();
      setDetails("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-mono text-base">
            <AlertTriangle className="h-4 w-4 text-danger" />
            Report {commentId ? "Comment" : "Post"}
          </DialogTitle>
        </DialogHeader>

        {targetTitle && (
          <p className="text-xs text-muted-foreground font-mono truncate">
            Target: &ldquo;{targetTitle}&rdquo;
          </p>
        )}

        <div className="space-y-3 py-2 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-muted-foreground mb-1">
              Reason
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full bg-surface-raised border-border text-xs">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border">
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-muted-foreground mb-1">
              Additional context (optional)
            </label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any extra details to help moderators review..."
              rows={3}
              className="w-full bg-surface-raised border-border text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs font-semibold"
          >
            {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
