"use client";

import * as React from "react";
import { Flame, Sparkles, Trophy, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SortOption = "hot" | "new" | "top";
export type TimeOption = "day" | "week" | "month" | "year" | "all";

interface SortTabsProps {
  currentSort: SortOption;
  currentTime: TimeOption;
  onSortChange: (sort: SortOption) => void;
  onTimeChange: (time: TimeOption) => void;
}

const timeLabels: Record<TimeOption, string> = {
  day: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  all: "All Time",
};

export function SortTabs({
  currentSort,
  currentTime,
  onSortChange,
  onTimeChange,
}: SortTabsProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-1.5 shadow-sm text-xs">
      <div className="flex items-center gap-1">
        {/* Hot */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSortChange("hot")}
          className={cn(
            "h-8 gap-1.5 text-xs font-semibold rounded-lg transition-all",
            currentSort === "hot"
              ? "bg-accent/15 text-accent border border-accent/25 shadow-glow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
          )}
        >
          <Flame
            className={cn(
              "h-3.5 w-3.5",
              currentSort === "hot" ? "text-upvote" : "text-muted-foreground"
            )}
          />
          <span>Hot</span>
        </Button>

        {/* New */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSortChange("new")}
          className={cn(
            "h-8 gap-1.5 text-xs font-semibold rounded-lg transition-all",
            currentSort === "new"
              ? "bg-accent/15 text-accent border border-accent/25 shadow-glow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
          )}
        >
          <Sparkles
            className={cn(
              "h-3.5 w-3.5",
              currentSort === "new" ? "text-accent-glow" : "text-muted-foreground"
            )}
          />
          <span>New</span>
        </Button>

        {/* Top */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSortChange("top")}
          className={cn(
            "h-8 gap-1.5 text-xs font-semibold rounded-lg transition-all",
            currentSort === "top"
              ? "bg-accent/15 text-accent border border-accent/25 shadow-glow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
          )}
        >
          <Trophy
            className={cn(
              "h-3.5 w-3.5",
              currentSort === "top" ? "text-yellow-400" : "text-muted-foreground"
            )}
          />
          <span>Top</span>
        </Button>
      </div>

      {/* Top Time Frame Dropdown */}
      {currentSort === "top" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-mono font-medium gap-1 text-muted-foreground border-border hover:text-foreground"
            >
              <Clock className="h-3 w-3 text-accent" />
              <span>{timeLabels[currentTime]}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 font-mono text-xs">
            {(Object.keys(timeLabels) as TimeOption[]).map((timeKey) => (
              <DropdownMenuItem
                key={timeKey}
                onClick={() => onTimeChange(timeKey)}
                className={cn(
                  "cursor-pointer",
                  currentTime === timeKey && "text-accent font-bold bg-accent/10"
                )}
              >
                {timeLabels[timeKey]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
