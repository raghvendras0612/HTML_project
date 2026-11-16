import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column skeleton */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <Skeleton className="h-44 w-full rounded-xl bg-surface border border-border" />
          <Skeleton className="h-64 w-full rounded-xl bg-surface border border-border" />
        </div>

        {/* Center feed skeleton */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-border">
            <Skeleton className="h-8 w-20 rounded-md bg-surface-raised" />
            <Skeleton className="h-8 w-20 rounded-md bg-surface-raised" />
            <Skeleton className="h-8 w-20 rounded-md bg-surface-raised" />
          </div>

          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-surface border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full bg-surface-raised" />
                <Skeleton className="h-4 w-28 rounded bg-surface-raised" />
                <Skeleton className="h-4 w-16 rounded bg-surface-raised" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded bg-surface-raised" />
              <Skeleton className="h-16 w-full rounded bg-surface-raised/60" />
              <div className="flex items-center gap-4 pt-2">
                <Skeleton className="h-7 w-20 rounded-full bg-surface-raised" />
                <Skeleton className="h-7 w-24 rounded-full bg-surface-raised" />
              </div>
            </div>
          ))}
        </div>

        {/* Right sidebar skeleton */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <Skeleton className="h-52 w-full rounded-xl bg-surface border border-border" />
          <Skeleton className="h-40 w-full rounded-xl bg-surface border border-border" />
        </div>
      </div>
    </div>
  );
}
