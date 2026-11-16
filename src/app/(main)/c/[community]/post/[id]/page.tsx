import * as React from "react";
import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MOCK_POSTS } from "@/lib/mock-data";
import { PostDetailView } from "@/components/post/post-detail-view";
import type { Metadata } from "next";
import type { PostWithRelations, VoteType } from "@/types/database.types";

interface PostPageProps {
  params: Promise<{ community: string; id: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { community: rawComm, id: postId } = await params;
  const comm = decodeURIComponent(rawComm);
  try {
    const admin = createAdminClient();
    const { data: post } = await admin
      .from("posts")
      .select("title, body")
      .eq("id", postId)
      .maybeSingle();

    if (post) {
      return {
        title: post.title,
        description: post.body ? post.body.slice(0, 160) : `Discussion in c/${comm} on Curia`,
        openGraph: {
          title: `${post.title} — c/${comm}`,
          description: post.body ? post.body.slice(0, 160) : `Discussion in c/${comm} on Curia`,
        },
      };
    }
  } catch {}
  return {
    title: `Post in c/${comm}`,
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { community: communityName, id: postId } = await params;

  let post: PostWithRelations | null = null;
  let isAuthor = false;
  let isModerator = false;

  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: dbPost } = await admin
      .from("posts")
      .select(`
        *,
        community:communities(*)
      `)
      .eq("id", postId)
      .maybeSingle();

    if (dbPost) {
      const { data: authorProf } = await admin
        .from("profiles")
        .select("*")
        .eq("id", dbPost.author_id)
        .maybeSingle();

      let user_vote: VoteType | null = null;
      if (user) {
        isAuthor = dbPost.author_id === user.id;

        const { data: vote } = await admin
          .from("votes")
          .select("value")
          .eq("user_id", user.id)
          .eq("post_id", dbPost.id)
          .maybeSingle();

        if (vote) {
          user_vote = vote.value as VoteType;
        }

        const { data: membership } = await admin
          .from("community_members")
          .select("role")
          .eq("community_id", dbPost.community_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (membership?.role === "moderator") {
          isModerator = true;
        }
      }

      post = {
        ...(dbPost as unknown as PostWithRelations),
        author: authorProf,
        user_vote,
      };
    }
  } catch {
    // Continue to mock fallback
  }

  // Fallback to mock post
  if (!post) {
    const mock = MOCK_POSTS.find((p) => p.id === postId);
    if (mock) {
      post = mock;
      isAuthor = true;
      isModerator = true;
    }
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <PostDetailView
        post={post}
        isAuthor={isAuthor}
        isModerator={isModerator}
      />
    </div>
  );
}
