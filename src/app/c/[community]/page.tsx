import * as React from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hash, Users, Plus, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { MOCK_COMMUNITIES, MOCK_POSTS } from "@/lib/mock-data";
import { formatScore } from "@/lib/utils";

interface CommunityPageProps {
  params: Promise<{ community: string }>;
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { community: communityName } = await params;

  const community = MOCK_COMMUNITIES.find(
    (c) => c.name.toLowerCase() === communityName.toLowerCase()
  );

  if (!community) {
    notFound();
  }

  const communityPosts = MOCK_POSTS.filter(
    (p) => p.community_id === community.id
  );

  return (
    <AppShell community={community}>
      <div className="space-y-4">
        {/* Community Header Banner Card */}
        <div className="rounded-xl overflow-hidden border border-border bg-surface">
          {community.banner_url ? (
            <div
              className="h-28 sm:h-36 w-full bg-cover bg-center border-b border-border"
              style={{ backgroundImage: `url(${community.banner_url})` }}
            />
          ) : (
            <div className="h-24 w-full bg-gradient-to-r from-accent/30 via-surface to-accent-glow/20 border-b border-border" />
          )}

          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 -mt-8 sm:-mt-10 shrink-0 items-center justify-center rounded-2xl bg-surface border-2 border-border shadow-glow text-accent font-bold text-xl">
                <Hash className="h-7 w-7" />
              </div>
              <div>
                <h1 className="font-sans font-bold text-lg sm:text-xl text-foreground">
                  {community.title}
                </h1>
                <p className="font-mono text-xs text-accent">
                  c/{community.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" asChild className="text-xs shadow-glow-sm">
                <Link href={`/submit?c=${community.name}`}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create Post
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Community Quick Stats */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border text-xs">
          <div className="flex items-center gap-3">
            <Badge variant="cyan" className="font-mono text-[10px]">
              <Users className="mr-1 h-3 w-3" />
              {formatScore(community.members_count)} members
            </Badge>
            <span className="text-muted-foreground hidden sm:inline">
              {community.description}
            </span>
          </div>
          <Link
            href="/moderation"
            className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1"
          >
            <Shield className="h-3 w-3" /> Mod Rules
          </Link>
        </div>

        {/* Posts List Placeholder (wired to full FeedList in Task 6) */}
        <div className="space-y-3">
          {communityPosts.length > 0 ? (
            communityPosts.map((post) => (
              <Card key={post.id} className="curia-card">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span>Posted by u/{post.author?.username}</span>
                    <span>•</span>
                    <span>{post.comments_count} comments</span>
                  </div>
                  <Link
                    href={`/c/${community.name}/comments/${post.id}`}
                    className="block font-bold text-base hover:text-accent transition-colors"
                  >
                    {post.title}
                  </Link>
                  {post.content_text && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.content_text}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="curia-card p-8 text-center space-y-3">
              <p className="text-muted-foreground text-sm">
                No posts in c/{community.name} yet. Be the first to start the discussion!
              </p>
              <Button size="sm" asChild>
                <Link href={`/submit?c=${community.name}`}>Create First Post</Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
