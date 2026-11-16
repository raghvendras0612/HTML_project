"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Curia Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 selection:bg-danger/20">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center mb-2">
          <Logo />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-danger/10 border border-danger/30 text-danger">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>UNHANDLED_EXCEPTION</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto font-sans">
            An unexpected error occurred while rendering this view. Your session and data are secure.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface text-left space-y-3 shadow-xl">
          <div className="p-3 rounded-lg bg-surface-raised border border-border font-mono text-[11px] text-danger/90 break-words">
            {error.message || "An unknown application error occurred."}
          </div>

          {error.digest && (
            <p className="text-[10px] font-mono text-muted-foreground/60 text-right">
              Digest: {error.digest}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs border-border hover:bg-surface-raised"
            >
              <Link href="/">
                <Home className="mr-1.5 h-3.5 w-3.5" />
                Home
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => reset()}
              className="text-xs bg-accent hover:bg-accent/90 text-white font-medium shadow-glow-sm"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
