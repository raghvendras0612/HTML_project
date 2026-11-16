import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CommunityForm } from "@/components/community/community-form";
import { Hash, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Create a Community — Curia",
  description: "Start a new technical community on Curia.",
};

export default function CreateCommunityPage() {
  return (
    <div className="space-y-4 max-w-xl mx-auto py-2">
      <Link
        href="/communities"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Communities</span>
      </Link>

      <Card className="curia-card border-border bg-surface p-2 sm:p-4">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent font-mono text-base shadow-glow-sm">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground">
                Create a Community
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Set up a focused discussion space with custom rules and topic scope.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <CommunityForm />
        </CardContent>
      </Card>
    </div>
  );
}
