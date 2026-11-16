import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, MessageSquare, AlertTriangle, Scale, Bot, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "Curia community standards, civil discourse principles, and content safety policies.",
};

export default function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="p-8 rounded-2xl border border-border bg-gradient-to-b from-surface-raised/40 via-surface to-surface text-center space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-accent/10 border border-accent/30 text-accent">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>COMMUNITY STANDARDS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Curia Community Guidelines
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Curia is dedicated to substantive, civil, and productive technical discussions. We prioritize signal over noise, intellectual honesty, and mutual respect.
        </p>
      </div>

      {/* 4 Pillars of Community Conduct */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              1. Attack Ideas, Not People
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <p>
              Robust technical disagreement is welcome and encouraged. You are free to critique frameworks, languages, algorithms, and design choices.
            </p>
            <p className="text-foreground/90 font-medium">
              Personal insults, derogatory slurs, harassment, and dismissive gatekeeping are strictly prohibited.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Scale className="h-4 w-4 text-success" />
              2. Substantive & Transparent
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <p>
              When sharing benchmarks, code snippets, or architectural retrospectives, provide reproducible context and realistic metrics.
            </p>
            <p className="text-foreground/90 font-medium">
              Disclose commercial affiliations when presenting tools or libraries you created or are compensated for.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              3. Zero Tolerance for Spam
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <p>
              Commercial link drops, affiliate link spam, automated scraping bots, and unformatted marketing dumps will be blocked immediately.
            </p>
            <p className="text-foreground/90 font-medium">
              Posts containing more than 3 commercial external links are automatically flagged by our safety heuristics.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bot className="h-4 w-4 text-accent-glow" />
              4. Automated AI Safety & Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <p>
              Curia uses Google Gemini 2.5 and local heuristics to evaluate draft tone and safety before publication.
            </p>
            <p className="text-foreground/90 font-medium">
              Borderline heated comments trigger a &quot;Content Advisory&quot; giving you an opportunity to edit or rephrase before submitting.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enforcement Ladder */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold">Enforcement & Moderation Ladder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Content Warning:</span> On borderline hostile comments, our AI safety pre-check notifies the author with an advisory dialog.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Moderator Removal:</span> Community creators and appointed moderators can soft-delete non-compliant posts or comments.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Community Bans:</span> Repeat offenders are barred from participating in that specific community with enforced server-level RLS policies.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
