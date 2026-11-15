"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Flame, ShieldAlert, ArrowUp, ArrowDown, Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const { openAuthModal } = useAuth();

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Quick Post Prompt Card */}
        <Card className="curia-card">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs">
              C
            </div>
            <Link
              href="/submit"
              className="flex-1 bg-surface-raised/70 hover:bg-surface-raised border border-border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-muted-foreground transition-colors flex items-center justify-between"
            >
              <span>Create a post or share a technical question...</span>
              <Plus className="h-4 w-4 text-accent shrink-0" />
            </Link>
          </CardContent>
        </Card>

        {/* Welcome Showcase Card */}
        <Card className="curia-card border-accent/20 bg-gradient-to-br from-surface via-surface to-accent/5">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="cyan" className="text-xs">
                Next.js 15 App Router + Supabase + Gemini
              </Badge>
              <Badge variant="mod">
                <Flame className="mr-1 h-3 w-3 text-upvote" /> Hot Feed
              </Badge>
            </div>
            <CardTitle className="text-lg sm:text-xl font-bold mt-2">
              Curia: Portfolio-Grade Technical Forum
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Dark-first Reddit alternative designed for high-signal engineering discussions, free-tier deployment, and AI moderation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 space-y-4">
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-2 py-1 rounded bg-surface-raised border border-border text-foreground">
                Row Level Security
              </span>
              <span className="px-2 py-1 rounded bg-surface-raised border border-border text-foreground">
                Infinite Scroll Feed
              </span>
              <span className="px-2 py-1 rounded bg-surface-raised border border-border text-foreground">
                Threaded Comments
              </span>
              <span className="px-2 py-1 rounded bg-surface-raised border border-border text-foreground">
                Gemini Summarizer
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" asChild>
                <Link href="/submit">Start Discussion</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAuthModal("signin")}
              >
                Sign In / Join
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
