"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/feed/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Hash, User, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { formatScore } from "@/lib/utils";
import type { PostWithRelations, Community, Profile } from "@/types/database.types";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  const [isLoading, setIsLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<PostWithRelations[]>([]);
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [users, setUsers] = React.useState<Profile[]>([]);

  React.useEffect(() => {
    if (!q.trim()) {
      setIsLoading(false);
      setPosts([]);
      setCommunities([]);
      setUsers([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setPosts(data.posts || []);
        setCommunities(data.communities || []);
        setUsers(data.users || []);
      } catch {
        // Ignored
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [q]);

  return (
    <AppShell>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Search Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Search className="h-5 w-5 text-accent" />
          <h1 className="font-sans font-bold text-lg text-foreground">
            {q ? (
              <span>
                Search results for &ldquo;<span className="text-accent">{q}</span>&rdquo;
              </span>
            ) : (
              "Explore Curia Discussions"
            )}
          </h1>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-xs text-muted-foreground font-mono">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span>Scanning full-text indices and communities...</span>
          </div>
        ) : !q.trim() ? (
          <Card className="curia-card p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Type keywords in the search bar above
            </p>
            <p className="text-xs text-muted-foreground">
              Search by post title, discussion content, community name, or username.
            </p>
          </Card>
        ) : (
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid grid-cols-3 bg-surface border border-border">
              <TabsTrigger value="posts" className="font-mono text-xs">
                Posts ({posts.length})
              </TabsTrigger>
              <TabsTrigger value="communities" className="font-mono text-xs">
                Communities ({communities.length})
              </TabsTrigger>
              <TabsTrigger value="users" className="font-mono text-xs">
                Users ({users.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: POSTS */}
            <TabsContent value="posts" className="mt-4 space-y-3">
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <Card className="curia-card p-8 text-center text-xs text-muted-foreground font-mono">
                  No posts matching &ldquo;{q}&rdquo; found.
                </Card>
              )}
            </TabsContent>

            {/* TAB 2: COMMUNITIES */}
            <TabsContent value="communities" className="mt-4 space-y-2.5">
              {communities.length > 0 ? (
                communities.map((c) => (
                  <Card key={c.id} className="curia-card hover:border-accent/40 transition-colors">
                    <CardContent className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 truncate">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised border border-border text-accent font-bold">
                          <Hash className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-sm text-foreground">
                              {c.title}
                            </span>
                            <span className="font-mono text-xs text-accent">
                              c/{c.name}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {formatScore(c.members_count)} members
                        </Badge>
                        <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                          <Link href={`/c/${c.name}`}>Visit</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="curia-card p-8 text-center text-xs text-muted-foreground font-mono">
                  No communities matching &ldquo;{q}&rdquo; found.
                </Card>
              )}
            </TabsContent>

            {/* TAB 3: USERS */}
            <TabsContent value="users" className="mt-4 space-y-2.5">
              {users.length > 0 ? (
                users.map((u) => (
                  <Card key={u.id} className="curia-card hover:border-accent/40 transition-colors">
                    <CardContent className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          {u.avatar_url && (
                            <AvatarImage src={u.avatar_url} alt={u.username} />
                          )}
                          <AvatarFallback className="font-mono text-xs">
                            {u.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {u.display_name || u.username}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            u/{u.username}
                          </p>
                        </div>
                      </div>

                      <Badge variant="cyan" className="font-mono text-xs">
                        {formatScore(u.karma)} karma
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="curia-card p-8 text-center text-xs text-muted-foreground font-mono">
                  No users matching &ldquo;{q}&rdquo; found.
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <AppShell>
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        </AppShell>
      }
    >
      <SearchContent />
    </React.Suspense>
  );
}
