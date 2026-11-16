"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { FeedList } from "@/components/feed/feed-list";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const { user, openAuthModal } = useAuth();

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Quick Post Box */}
        <Card className="curia-card">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs">
              C
            </div>
            <Link
              href={user ? "/submit" : "#"}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  openAuthModal("signin");
                }
              }}
              className="flex-1 bg-surface-raised/70 hover:bg-surface-raised border border-border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-muted-foreground transition-colors flex items-center justify-between"
            >
              <span>Create a post or share a technical question...</span>
              <Plus className="h-4 w-4 text-accent shrink-0" />
            </Link>
          </CardContent>
        </Card>

        {/* Global Feeds with Infinite Scroll & Sorting */}
        <FeedList />
      </div>
    </AppShell>
  );
}
