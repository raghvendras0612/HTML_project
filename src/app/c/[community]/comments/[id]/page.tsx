import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/feed/post-card";
import { CommentForm } from "@/components/comment/comment-form";
import { CommentTree } from "@/components/comment/comment-tree";
import { ThreadSummarizer } from "@/components/gemini/thread-summarizer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Share2 } from "lucide-react";
import { MOCK_POSTS, MOCK_COMMUNITIES } from "@/lib/mock-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PostWithRelations } from "@/types/database.types";

interface PostDetailPageProps {
  params: Promise<{ community: string; id: string }>;
  searchParams: Promise<{ parent?: string }>;
}

export default async function PostDetailPage({
  params,
  searchParams,
}: PostDetailPageProps) {
  const { community: communitySlug, id: postId } = await params;
  const { parent: focusedParentId } = await searchParams;

  let post: PostWithRelations | null = null;
  let community = MOCK_COMMUNITIES.find(
    (c) => c.name.toLowerCase() === communitySlug.toLowerCase()
  );

  if (!isSupabaseConfigured()) {
    // In demo mode
    post = MOCK_POSTS.find((p) => p.id === postId) || null;
    if (!community && post?.community) {
      community = post.community;
    }
  } else {
    try {
      const supabase = await createClient();
      const { data: postData } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles(*),
          community:communities(*)
        `)
        .eq("id", postId)
        .single();

      if (postData) {
        post = postData as unknown as PostWithRelations;
        if (post.community) community = post.community;
      }
    } catch {
      post = null;
    }
  }

  if (!post) {
    notFound();
  }

  return (
    <AppShell community={community}>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-1">
          <Link
            href={`/c/${post.community?.name || communitySlug}`}
            className="flex items-center gap-1.5 hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to c/{post.community?.name || communitySlug}</span>
          </Link>
          <Badge variant="cyan" className="text-[10px]">
            Discussion Thread
          </Badge>
        </div>

        {/* Hero Post Card */}
        <PostCard post={post} />

        {/* Gemini Thread Summarizer */}
        <ThreadSummarizer post={post} />

        {/* Top-level Comment Submission Form */}
        <Card className="curia-card">
          <CardContent className="p-4 sm:p-5">
            <CommentForm
              postId={post.id}
              placeholder="What are your thoughts on this discussion?"
            />
          </CardContent>
        </Card>

        {/* Threaded Comments Tree */}
        <Card className="curia-card">
          <CardContent className="p-4 sm:p-5">
            {focusedParentId && (
              <div className="mb-4 p-2.5 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-between text-xs">
                <span className="font-mono text-accent">
                  Viewing single comment thread
                </span>
                <Link
                  href={`/c/${communitySlug}/comments/${post.id}`}
                  className="font-mono text-foreground hover:underline text-[11px]"
                >
                  View all comments →
                </Link>
              </div>
            )}
            <CommentTree
              postId={post.id}
              communityName={post.community?.name || communitySlug}
              focusedParentId={focusedParentId}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
