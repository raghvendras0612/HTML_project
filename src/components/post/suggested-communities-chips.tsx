"use client";

import * as React from "react";
import { Sparkles, Hash, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CommunitySuggestion } from "@/app/api/ai/suggest-communities/route";

interface SuggestedCommunitiesChipsProps {
  title: string;
  body: string;
  onSelectCommunity: (name: string) => void;
  selectedCommunityName?: string | null;
}

export function SuggestedCommunitiesChips({
  title,
  body,
  onSelectCommunity,
  selectedCommunityName,
}: SuggestedCommunitiesChipsProps) {
  const [suggestions, setSuggestions] = React.useState<CommunitySuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const combinedText = `${title} ${body}`.trim();

  // Debounced API fetch after 20+ characters
  React.useEffect(() => {
    if (combinedText.length < 20) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/suggest-communities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "draft", title, body }),
        });

        if (res.ok && isCurrent) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch {
        // Fallback / silent fail
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }, 400);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [title, body, combinedText.length]);

  if (combinedText.length < 20) {
    return null;
  }

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
        <Sparkles className="h-3 w-3 text-accent" />
        <span className="text-[11px] font-medium text-foreground">
          AI Suggested Communities:
        </span>
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-accent" />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {suggestions.map((s) => {
          const isSelected =
            selectedCommunityName?.toLowerCase() === s.name.toLowerCase();
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => onSelectCommunity(s.name)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all border ${
                isSelected
                  ? "bg-accent text-white border-accent shadow-glow-sm"
                  : "bg-surface-raised/80 hover:bg-surface-overlay text-foreground border-border/80 hover:border-accent/40"
              }`}
              title={s.reason}
            >
              <Hash className="h-3 w-3 opacity-70" />
              <span className="font-semibold">{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
