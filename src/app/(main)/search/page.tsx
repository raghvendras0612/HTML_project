"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/feed/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Hash, Loader2, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { PostWithRelations, Community, Profile } from "@/types/database.types";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "relevance";

  const [sort, setSort] = React.useState(initialSort);
  const [activeTab, setActiveTab] = React.useState("posts");
  const [isLoading, setIsLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<PostWithRelations[]>([]);
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [users, setUsers] = React.useState<Profile[]>([]);
  const [page, setPage] = React.useState(0);
  const pageSize = 20;

  React.useEffect(() => {
    if (!q.trim()) {
      setIsLoading(false);
      setPosts([]);
      setCommunities([]);
      setUsers([]);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);

    const offset = page * pageSize;
    fetch(
      `/api/search?q=${encodeURIComponent(
        q.trim()
      )}&sort=${sort}&limit=${pageSize}&offset=${offset}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (isCurrent) {
          setPosts(data.posts || []);
          setCommunities(data.communities || []);
          setUsers(data.users || []);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setPosts([]);
          setCommunities([]);
          setUsers([]);
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [q, sort, page]);

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(0);
    const params = new URLSearchParams(window.location.search);
    params.set("sort", newSort);
    router.replace(`/search?${params.toString()}`);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Search Header Banner */}
      <div className="p-4 rounded-xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent shrink-0">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-base sm:text-lg text-foreground">
              Search Curia
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              {q ? `Showing results for "${q}"` : "Search across technical posts, communities, and authors"}
            </p>
          </div>
        </div>

        {/* Sort selector for posts */}
        {q && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Sort:</span>
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="h-8 w-36 text-xs font-mono bg-surface-raised border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border text-xs font-mono">
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="new">Newest</SelectItem>
                <SelectItem value="top">Top Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!q.trim() ? (
        <Card className="curia-card p-12 text-center space-y-3">
          <Search className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold font-mono">Ready to Search</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto font-mono">
            Type a search term in the header bar above or press ⌘K to find posts, communities, and technical authors.
          </p>
        </Card>
      ) : isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs font-mono">Searching discussions, communities, and authors...</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none h-11 bg-transparent p-0 gap-4">
            <TabsTrigger
              value="posts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none bg-transparent px-2 text-xs font-mono"
            >
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger
              value="communities"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none bg-transparent px-2 text-xs font-mono"
            >
              Communities ({communities.length})
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none bg-transparent px-2 text-xs font-mono"
            >
              Authors ({users.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: POSTS */}
          <TabsContent value="posts" className="mt-4 space-y-3">
            {posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <Card className="curia-card p-8 text-center text-xs text-muted-foreground font-mono space-y-1">
                <p>No discussions matching &ldquo;{q}&rdquo; found.</p>
                <p className="text-[10px] text-muted-foreground/60">
                  Try broader keywords or verify spelling.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: COMMUNITIES */}
          <TabsContent value="communities" className="mt-4 space-y-2">
            {communities.length > 0 ? (
              communities.map((comm) => (
                <Card
                  key={comm.id}
                  className="curia-card border-border/80 p-3.5 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {comm.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={comm.icon_url}
                          alt={comm.name}
                          className="h-9 w-9 rounded-xl object-cover border border-border"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent font-bold text-xs">
                          #
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/c/${comm.name}`}
                          className="font-bold text-sm text-foreground hover:underline font-mono"
                        >
                          c/{comm.name}
                        </Link>
                        {comm.title && (
                          <p className="text-xs text-foreground/80 line-clamp-1">{comm.title}</p>
                        )}
                        {comm.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {comm.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                        {comm.member_count ?? 1} members
                      </span>
                      <Button asChild size="sm" variant="outline" className="h-8 text-xs font-mono">
                        <Link href={`/c/${comm.name}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="curia-card p-8 text-center text-xs text-muted-foreground font-mono">
                No communities matching &ldquo;{q}&rdquo; found.
              </Card>
            )}
          </TabsContent>

          {/* TAB 3: USERS / AUTHORS */}
          <TabsContent value="users" className="mt-4 space-y-2">
            {users.length > 0 ? (
              users.map((u) => (
                <Card
                  key={u.id}
                  className="curia-card border-border/80 p-3.5 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.username} />}
                        <AvatarFallback className="text-xs">
                          {u.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/u/${u.username}`}
                          className="font-bold text-sm text-foreground hover:underline font-mono"
                        >
                          u/{u.username}
                        </Link>
                        {u.display_name && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({u.display_name})
                          </span>
                        )}
                        {u.bio ? (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {u.bio}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground/60 italic mt-0.5">
                            No bio provided
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 font-mono text-xs text-accent">
                        <Sparkles className="h-3 w-3 text-accent-glow" />
                        <span>{u.karma} karma</span>
                      </div>
                      <Button asChild size="sm" variant="outline" className="h-8 text-xs font-mono">
                        <Link href={`/u/${u.username}`}>Profile</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="curia-card p-8 text-center text-xs text-muted-foreground font-mono">
                No authors matching &ldquo;{q}&rdquo; found.
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs font-mono">Loading search...</p>
        </div>
      }
    >
      <SearchContent />
    </React.Suspense>
  );
}
