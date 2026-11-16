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
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface BanUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  communityName: string;
  userId: string;
  username: string;
  onSuccess?: () => void;
}

export function BanUserDialog({
  isOpen,
  onClose,
  communityName,
  userId,
  username,
  onSuccess,
}: BanUserDialogProps) {
  const [reason, setReason] = React.useState("Violation of community rules");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleBan = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/communities/${communityName}/bans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          reason: reason.trim() || "Violation of community rules",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to ban user");
      }

      toast.success(`u/${username} has been banned from c/${communityName}`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ban user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-danger font-mono text-base">
            <ShieldAlert className="h-4 w-4" />
            Ban u/{username} from c/{communityName}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Banning this user will immediately revoke their ability to post and comment in{" "}
          <span className="font-semibold text-foreground">c/{communityName}</span>. They will still be able to participate in other communities.
        </p>

        <div className="space-y-2 py-2">
          <label className="block text-[11px] font-mono text-muted-foreground">
            Reason for Ban (Optional)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Specify reason for moderation record..."
            rows={3}
            className="w-full bg-surface-raised border-border text-xs"
          />
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
            onClick={handleBan}
            disabled={isSubmitting}
            className="text-xs font-semibold"
          >
            {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Confirm Ban
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
