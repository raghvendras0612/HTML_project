import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { CommentTree } from "@/components/comment/comment-tree";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/utils";

interface FocusedCommentPageProps {
  params: Promise<{
    community: string;
    id: string;
    commentId: string;
  }>;
}

export default async function FocusedCommentPage({ params }: FocusedCommentPageProps) {
  const { community: communityName, id: postId, commentId } = await params;

  const admin = createAdminClient();

  const { data: post } = await admin
    .from("posts")
    .select(`
      id,
      title,
      created_at,
      score,
      comment_count,
      community:communities(name, title)
    `)
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Return to Full Discussion Banner */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
        <Link
          href={`/c/${communityName}/post/${postId}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-accent hover:underline font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>← View entire discussion</span>
        </Link>
        <span className="text-[11px] font-mono text-muted-foreground">
          Single Thread / Subtree View
        </span>
      </div>

      {/* Post Context Summary Card */}
      <Card className="curia-card">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
            <Link
              href={`/c/${communityName}`}
              className="text-foreground font-semibold hover:underline"
            >
              c/{communityName}
            </Link>
            <span>•</span>
            <span>{formatTimeAgo(post.created_at)}</span>
          </div>
          <CardTitle className="text-base sm:text-lg font-bold">
            <Link
              href={`/c/${communityName}/post/${postId}`}
              className="hover:text-accent transition-colors"
            >
              {post.title}
            </Link>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Focused Comment Subtree */}
      <div className="pt-2">
        <CommentTree
          postId={postId}
          communityName={communityName}
          focusedParentId={commentId}
        />
      </div>
    </div>
  );
}
