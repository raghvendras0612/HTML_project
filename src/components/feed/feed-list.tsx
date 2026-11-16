"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/feed/post-card";
import { SortTabs, type SortOption, type TimeOption } from "@/components/feed/sort-tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { PostWithRelations } from "@/types/database.types";
import { Loader2, Sparkles, MessageSquareDashed } from "lucide-react";
import Link from "next/link";

interface FeedListProps {
  community?: string;
  onSummarizePost?: (post: PostWithRelations) => void;
}

interface FeedResponse {
  posts: PostWithRelations[];
  nextCursor: string | null;
}

export function FeedList({ community, onSummarizePost }: FeedListProps) {
  const [sort, setSort] = React.useState<SortOption>("hot");
  const [time, setTime] = React.useState<TimeOption>("day");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<FeedResponse, Error>({
    queryKey: ["feed", community || "all", sort, time],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("sort", sort);
      if (sort === "top") params.set("time", time);
      if (community) params.set("community", community);
      if (pageParam) params.set("cursor", pageParam as string);

      const res = await fetch(`/api/feed?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load feed");
      }
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
  });

  // Intersection Observer for infinite scrolling
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap((page) => page.posts) || [];

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <SortTabs
        currentSort={sort}
        currentTime={time}
        onSortChange={(s) => setSort(s)}
        onTimeChange={(t) => setTime(t)}
      />

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="curia-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <Skeleton className="h-6 w-4/5 rounded" />
              <Skeleton className="h-16 w-full rounded" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <Card className="curia-card p-6 text-center space-y-3 border-danger/30">
          <p className="text-xs text-danger">
            {error?.message || "Failed to load discussions."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {/* Posts Feed */}
      {!isLoading && allPosts.length > 0 && (
        <div className="space-y-3">
          {allPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onSummarize={onSummarizePost}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && allPosts.length === 0 && (
        <Card className="curia-card p-10 text-center space-y-3">
          <MessageSquareDashed className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-semibold text-foreground text-sm">
            No discussions found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {community
              ? `There are no posts in c/${community} matching this filter yet.`
              : "No discussions match this sorting timeframe."}
          </p>
          <Button size="sm" asChild className="shadow-glow-sm">
            <Link href={community ? `/submit?c=${community}` : "/submit"}>
              Create First Post
            </Link>
          </Button>
        </Card>
      )}

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span>Loading more posts...</span>
          </div>
        )}
        {!hasNextPage && allPosts.length > 0 && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            ✦ You have caught up with all discussions ✦
          </p>
        )}
      </div>
    </div>
  );
}
