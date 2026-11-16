"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ModerationWarningDialogProps {
  open: boolean;
  reason?: string;
  onEdit: () => void;
  onConfirm: () => void;
}

export function ModerationWarningDialog({
  open,
  reason,
  onEdit,
  onConfirm,
}: ModerationWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onEdit()}>
      <DialogContent className="sm:max-w-md bg-surface border-border">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-foreground">
              Content Advisory
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-foreground/90 font-sans leading-relaxed">
            This may come across as hostile. Post anyway?
          </DialogDescription>
        </DialogHeader>

        {reason && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed font-sans">
            <span className="font-semibold">Reason:</span> {reason}
          </div>
        )}

        <DialogFooter className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className="bg-accent hover:bg-accent/90 text-white font-medium text-xs h-8 px-4 shadow-glow-sm"
          >
            Post anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
