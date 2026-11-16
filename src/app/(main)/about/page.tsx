import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import {
  Layers,
  Cpu,
  ShieldCheck,
  Zap,
  Sparkles,
  Database,
  Code2,
  ExternalLink,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Curia",
  description:
    "Curia is a portfolio-grade, dark-first technical discussion forum built on 100% free-tier architecture with Next.js, Supabase, and Google Gemini AI.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="p-8 rounded-2xl border border-border bg-gradient-to-b from-surface-raised/40 via-surface to-surface text-center space-y-4 shadow-xl">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-accent/10 border border-accent/30 text-accent">
          <span>PORTFOLIO-GRADE DISCUSSION PLATFORM</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Built for Speed, Substance & Technical Depth
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans">
          Curia is a modern Reddit-inspired discussion forum designed from the ground up for software engineers, systems architects, and designers. Engineered for sub-second reactivity and dark-first visual ergonomics.
        </p>
      </div>

      {/* 100% Free-Tier Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface border-border">
          <CardHeader className="pb-2">
            <div className="h-9 w-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-2">
              <Layers className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold">Vercel Frontend</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Next.js 15 App Router with streaming SSR, Server Components for zero-bundle data fetching, and dynamic edge Open Graph image generation.
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader className="pb-2">
            <div className="h-9 w-9 rounded-lg bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-accent-glow mb-2">
              <Database className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold">Supabase PostgreSQL</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Relational Postgres engine with Row Level Security (RLS) on all 10 tables, real-time WebSocket subscriptions, and atomic voting stored procedures.
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader className="pb-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-success mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold">Google Gemini AI</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Server-only Route Handlers calling Gemini 2.5 Flash for thread summarization with SHA-256 caching, pre-publish moderation, and community matching.
          </CardContent>
        </Card>
      </div>

      {/* Core Design Tokens */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Code2 className="h-5 w-5 text-accent" />
            Obsidian Design Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Curia avoids harsh pure blacks (#000000) that cause eye strain in low-light environments. Instead, the UI layers obsidian tones with crisp 1px borders and soft violet glows:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg border border-border bg-[#0B0D12] text-[#E6E9F0]">
              <div className="font-bold">Background</div>
              <div className="text-[10px] text-muted-foreground">#0B0D12</div>
            </div>
            <div className="p-3 rounded-lg border border-border bg-[#12151C] text-[#E6E9F0]">
              <div className="font-bold">Surface</div>
              <div className="text-[10px] text-muted-foreground">#12151C</div>
            </div>
            <div className="p-3 rounded-lg border border-border bg-[#181C25] text-[#E6E9F0]">
              <div className="font-bold">Raised Surface</div>
              <div className="text-[10px] text-muted-foreground">#181C25</div>
            </div>
            <div className="p-3 rounded-lg border border-[#7C5CFF]/40 bg-[#7C5CFF]/15 text-[#7C5CFF]">
              <div className="font-bold">Accent Glow</div>
              <div className="text-[10px] opacity-80">#7C5CFF</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-xl border border-border bg-surface-raised gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Explore Community Guidelines</h3>
          <p className="text-xs text-muted-foreground">Learn about our standards for constructive technical discourse.</p>
        </div>
        <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-white font-medium text-xs shadow-glow-sm">
          <Link href="/guidelines">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            View Guidelines
          </Link>
        </Button>
      </div>
    </div>
  );
}
