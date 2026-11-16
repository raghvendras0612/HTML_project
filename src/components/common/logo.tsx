import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-3xl",
  };

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-1 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90 select-none",
        sizeClasses[size],
        className
      )}
    >
      <span className="font-sans lowercase">curia</span>
      <span className="inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(124,92,255,0.8)] animate-pulse" />
    </Link>
  );
}
