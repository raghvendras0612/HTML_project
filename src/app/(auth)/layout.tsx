import * as React from "react";
import { Logo } from "@/components/common/logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Subtle ambient gradient glow in background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-accent/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Top return link */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Curia</span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <div className="mb-6">
          <Logo size="lg" />
        </div>
        {children}
      </div>
    </div>
  );
}
