"use client";

import * as React from "react";
import { Sparkles, Loader2, ChevronUp, ChevronDown, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PostWithRelations } from "@/types/database.types";

interface ThreadSummarizerProps {
  post: PostWithRelations;
}

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  perspectives: string[];
  sentiment?: string;
  isFallback?: boolean;
}

export function ThreadSummarizer({ post }: ThreadSummarizerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<SummaryResult | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsOpen(true);

    try {
      // First fetch comments for this post
      const commRes = await fetch(`/api/comments?post_id=${post.id}`);
      const commData = await commRes.json();
      const comments = commData.comments || [];

      // Send to server-side Gemini summarizer route
      const res = await fetch("/api/gemini/summarize-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          content: post.content_text,
          comments,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Summarizer error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Trigger Bar */}
      {!isOpen && (
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSummary}
          className="w-full justify-between h-9 border-accent/30 bg-accent/5 hover:bg-accent/10 text-accent hover:border-accent text-xs font-mono group transition-all"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-glow transition-transform group-hover:rotate-12" />
            <span className="font-sans font-semibold">
              Summarize Discussion with Gemini AI
            </span>
          </div>
          <Badge variant="cyan" className="text-[10px] uppercase font-mono">
            TL;DR
          </Badge>
        </Button>
      )}

      {/* Expanded Summary Card */}
      {isOpen && (
        <Card className="curia-card border-accent/40 bg-gradient-to-br from-surface via-surface to-accent/5 shadow-glow animate-fade-in">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white shadow-glow">
                <Sparkles className="h-4 w-4 text-accent-glow" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <span>Gemini Discussion TL;DR</span>
                  <Badge variant="cyan" className="text-[9px] font-mono">
                    Flash
                  </Badge>
                </CardTitle>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Synthesized via server-only route handler
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-3">
            {isLoading && (
              <div className="py-6 flex flex-col items-center justify-center space-y-2 text-xs text-muted-foreground font-mono">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <span>Reading thread and distilling perspectives...</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-lg border border-danger/30 bg-danger/10 text-xs text-danger">
                {errorMsg}
              </div>
            )}

            {!isLoading && result && (
              <div className="space-y-3 text-xs">
                {/* Executive Summary */}
                <div className="p-3 rounded-lg bg-surface-raised/80 border border-border">
                  <p className="text-foreground leading-relaxed font-sans sm:text-sm">
                    {result.summary}
                  </p>
                </div>

                {/* Key Points */}
                {result.keyPoints && result.keyPoints.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-mono text-[11px] font-semibold text-accent uppercase tracking-wider">
                      Key Takeaways
                    </p>
                    <ul className="space-y-1 text-muted-foreground">
                      {result.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Diverse Perspectives */}
                {result.perspectives && result.perspectives.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="font-mono text-[11px] font-semibold text-accent-glow uppercase tracking-wider">
                      Debate Perspectives
                    </p>
                    <ul className="space-y-1 text-muted-foreground">
                      {result.perspectives.map((persp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-accent-glow shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{persp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
