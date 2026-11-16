import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { Compass, Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 selection:bg-accent/20">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center mb-2">
          <Logo />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-accent/10 border border-accent/30 text-accent">
            <span>HTTP 404</span>
            <span className="opacity-40">•</span>
            <span>NOT_FOUND</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Page Not Found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            The discussion, community, or route you are looking for has been moved, archived, or does not exist.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface/80 backdrop-blur space-y-4 shadow-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              readOnly
              placeholder="Search Curia (Ctrl+K)..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface-raised border border-border text-xs text-muted-foreground cursor-pointer focus:outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs border-border hover:bg-surface-raised"
            >
              <Link href="/">
                <Home className="mr-1.5 h-3.5 w-3.5" />
                Return to Home
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="w-full sm:w-auto text-xs bg-accent hover:bg-accent/90 text-white font-medium shadow-glow-sm"
            >
              <Link href="/communities">
                <Compass className="mr-1.5 h-3.5 w-3.5" />
                Explore Communities
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-[11px] font-mono text-muted-foreground/60">
          Curia Technical Discussions • 100% Free-Tier Architecture
        </p>
      </div>
    </div>
  );
}
