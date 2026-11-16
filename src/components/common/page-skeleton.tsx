import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PageSkeleton() {
  return (
    <div className="space-y-4 w-full">
      {/* Header Skeleton */}
      <Card className="curia-card">
        <CardHeader className="p-4 space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
      </Card>

      {/* Post/Content Feed Skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="curia-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <div className="flex items-center gap-4 pt-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
