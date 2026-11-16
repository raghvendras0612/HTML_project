"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn, formatScore } from "@/lib/utils";
import type { VoteType } from "@/types/database.types";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export interface VoteButtonsProps {
  targetType: "post" | "comment";
  targetId: string;
  score: number;
  myVote?: VoteType | null;
  orientation?: "vertical" | "horizontal";
  size?: "sm" | "md";
  className?: string;
  onVoteChange?: (newScore: number, newVote: VoteType | null) => void;
}

export function VoteButtons({
  targetType,
  targetId,
  score: initialScore,
  myVote: initialVote = null,
  orientation = "vertical",
  size = "md",
  className,
  onVoteChange,
}: VoteButtonsProps) {
  const { user, openAuthModal } = useAuth();
  const queryClient = useQueryClient();

  const [currentVote, setCurrentVote] = React.useState<VoteType | null>(initialVote ?? null);
  const [score, setScore] = React.useState<number>(initialScore);

  // Sync state if props change from outside
  React.useEffect(() => {
    setCurrentVote(initialVote ?? null);
  }, [initialVote]);

  React.useEffect(() => {
    setScore(initialScore);
  }, [initialScore]);

  const voteMutation = useMutation({
    mutationFn: async ({
      voteType,
    }: {
      voteType: VoteType;
      previousVote: VoteType | null;
      previousScore: number;
    }) => {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_id: targetId,
          target_type: targetType,
          vote_type: voteType,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Network error: failed to submit vote");
      }

      return res.json();
    },
    onMutate: async ({ voteType }) => {
      const previousVote = currentVote;
      const previousScore = score;

      let delta = 0;
      let nextVote: VoteType | null = null;

      if (currentVote === voteType) {
        // Toggle off
        delta = -voteType;
        nextVote = null;
      } else if (currentVote !== null) {
        // Switch (+1 to -1 or -1 to +1)
        delta = voteType * 2;
        nextVote = voteType;
      } else {
        // Fresh vote
        delta = voteType;
        nextVote = voteType;
      }

      const nextScore = previousScore + delta;

      // Optimistic update
      setCurrentVote(nextVote);
      setScore(nextScore);
      onVoteChange?.(nextScore, nextVote);

      return { previousVote, previousScore };
    },
    onError: (err, _variables, context) => {
      if (context) {
        setCurrentVote(context.previousVote);
        setScore(context.previousScore);
        onVoteChange?.(context.previousScore, context.previousVote);
      }
      toast.error(err instanceof Error ? err.message : "Vote failed. Rolling back.");
    },
    onSettled: () => {
      // Invalidate target cache queries
      if (targetType === "post") {
        queryClient.invalidateQueries({ queryKey: ["post", targetId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["comments"] });
      }
    },
  });

  const handleVoteAction = (type: VoteType) => {
    if (!user) {
      openAuthModal("signin");
      return;
    }

    if (voteMutation.isPending) {
      return; // Prevent race conditions during rapid spam
    }

    voteMutation.mutate({
      voteType: type,
      previousVote: currentVote,
      previousScore: score,
    });
  };

  const handleVoteClick = (e: React.MouseEvent, type: VoteType) => {
    e.preventDefault();
    e.stopPropagation();
    handleVoteAction(type);
  };

  const handleVoteKeyDown = (e: React.KeyboardEvent, type: VoteType) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      handleVoteAction(type);
    }
  };

  const isVertical = orientation === "vertical";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-5 sm:w-5";

  return (
    <div
      className={cn(
        "flex select-none items-center",
        isVertical ? "flex-col justify-center" : "flex-row gap-1",
        className
      )}
    >
      <button
        type="button"
        onClick={(e) => handleVoteClick(e, 1)}
        onKeyDown={(e) => handleVoteKeyDown(e, 1)}
        disabled={voteMutation.isPending}
        aria-label="Upvote"
        className={cn(
          "rounded p-1 transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          currentVote === 1
            ? "bg-upvote/15 text-upvote font-bold"
            : "text-muted-foreground hover:bg-upvote/10 hover:text-upvote"
        )}
      >
        <ArrowUp className={iconSize} />
      </button>

      <span
        className={cn(
          "font-mono font-semibold tracking-tight tabular-nums",
          size === "sm" ? "text-xs px-1" : "text-xs sm:text-sm my-0.5",
          currentVote === 1 && "text-upvote",
          currentVote === -1 && "text-downvote",
          !currentVote && "text-foreground"
        )}
      >
        {formatScore(score)}
      </span>

      <button
        type="button"
        onClick={(e) => handleVoteClick(e, -1)}
        onKeyDown={(e) => handleVoteKeyDown(e, -1)}
        disabled={voteMutation.isPending}
        aria-label="Downvote"
        className={cn(
          "rounded p-1 transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          currentVote === -1
            ? "bg-downvote/15 text-downvote font-bold"
            : "text-muted-foreground hover:bg-downvote/10 hover:text-downvote"
        )}
      >
        <ArrowDown className={iconSize} />
      </button>
    </div>
  );
}
