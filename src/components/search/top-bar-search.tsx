"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2, Hash, Users, FileText, ArrowRight, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PostWithRelations, Community, Profile } from "@/types/database.types";

interface SearchResults {
  posts: (PostWithRelations & { highlighted_title?: string })[];
  communities: Community[];
  users: Profile[];
}

export function TopBarSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResults>({
    posts: [],
    communities: [],
    users: [],
  });

  const containerRef = React.useRef<HTMLDivElement>(null);

  // 1. Debounce user typing by 250ms
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  // 2. Fetch search results when debounced query changes
  React.useEffect(() => {
    if (!debouncedQuery) {
      setResults({ posts: [], communities: [], users: [] });
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
      .then((res) => res.json())
      .then((data) => {
        if (isCurrent) {
          setResults({
            posts: data.posts || [],
            communities: data.communities || [],
            users: data.users || [],
          });
          setIsOpen(true);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setResults({ posts: [], communities: [], users: [] });
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery]);

  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const hasResults =
    results.posts.length > 0 || results.communities.length > 0 || results.users.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-2 hidden sm:block">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
                e.currentTarget.blur();
              } else if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Search posts, communities, or users..."
            className="w-full rounded-lg border border-border bg-surface pl-8 pr-16 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent/60 focus:bg-surface-raised focus:outline-none focus:ring-1 focus:ring-accent transition-all shadow-sm"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setIsOpen(false);
                }}
                className="p-0.5 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
              ↵
            </kbd>
          </div>
        </div>
      </form>

      {/* Floating Results Popover Dropdown */}
      {isOpen && query.trim() && (
        <div
          data-testid="search-popover"
          className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border bg-surface p-2 shadow-glow animate-in fade-in-50 zoom-in-95 duration-150 max-h-96 overflow-y-auto divide-y divide-border/40"
        >
          {/* GROUP 1: COMMUNITIES */}
          {results.communities.length > 0 && (
            <div className="pb-2 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2">
                Communities
              </span>
              {results.communities.map((comm) => (
                <Link
                  key={comm.id}
                  href={`/c/${comm.name}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-raised transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/20 border border-accent/40 text-accent font-bold text-[10px]">
                      #
                    </div>
                    <div>
                      <span className="font-semibold text-foreground font-mono">
                        c/{comm.name}
                      </span>
                      {comm.title && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-xs">
                          {comm.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {comm.member_count ?? 1} members
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* GROUP 2: AUTHORS / USERS */}
          {results.users.length > 0 && (
            <div className="py-2 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2">
                Authors
              </span>
              {results.users.map((u) => (
                <Link
                  key={u.id}
                  href={`/u/${u.username}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-raised transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-border">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.username} />}
                      <AvatarFallback className="text-[9px]">
                        {u.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-semibold text-foreground font-mono">
                        u/{u.username}
                      </span>
                      {u.display_name && (
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          ({u.display_name})
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-accent">
                    {u.karma} karma
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* GROUP 3: POSTS */}
          {results.posts.length > 0 && (
            <div className="py-2 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2">
                Discussions
              </span>
              {results.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/c/${post.community?.name || "curia"}/post/${post.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block p-2 rounded-lg hover:bg-surface-raised transition-colors text-xs space-y-0.5"
                >
                  <div
                    className="font-medium text-foreground line-clamp-1"
                    dangerouslySetInnerHTML={{
                      __html: post.highlighted_title || post.title,
                    }}
                  />
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                    <span>c/{post.community?.name || "curia"}</span>
                    <span>•</span>
                    <span>{post.score} points</span>
                    <span>•</span>
                    <span>{post.comment_count ?? 0} comments</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {!isLoading && !hasResults && (
            <div className="p-4 text-center text-xs text-muted-foreground font-mono space-y-1">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-[10px] text-muted-foreground/60">
                Try searching for different keywords or check spelling.
              </p>
            </div>
          )}

          {/* FOOTER ACTION */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-raised/60 hover:bg-surface-raised text-accent font-mono text-xs transition-colors"
            >
              <span>See all results for &ldquo;{query}&rdquo;</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
