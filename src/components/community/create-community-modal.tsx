"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommunityForm } from "@/components/community/community-form";
import { Hash } from "lucide-react";

interface CreateCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCommunityModal({
  open,
  onOpenChange,
}: CreateCommunityModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface border-border p-6 shadow-glow">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 border border-accent/40 text-accent font-mono text-sm">
              <Hash className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Create a Community
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Communities are self-moderated discussion spaces for specific subjects.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <CommunityForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
