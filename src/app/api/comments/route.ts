import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MOCK_COMMENTS, MOCK_PROFILES } from "@/lib/mock-data";
import * as z from "zod";
import type { CommentWithRelations, VoteType } from "@/types/database.types";

const commentSchema = z.object({
  post_id: z.string(),
  parent_id: z.string().nullable().optional(),
  content: z.string().min(1, "Comment cannot be empty"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("post_id");

  if (!postId) {
    return NextResponse.json({ error: "post_id is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    // In mock mode, return mock comments
    const comments = MOCK_COMMENTS.filter((c) => c.post_id === postId);
    return NextResponse.json({ comments });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        *,
        author:profiles(*)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch user votes on comments
    let userVotesMap: Record<string, VoteType> = {};
    if (user && comments && comments.length > 0) {
      const commentIds = comments.map((c) => c.id);
      const { data: votes } = await supabase
        .from("votes")
        .select("target_id, vote_type")
        .eq("user_id", user.id)
        .eq("target_type", "comment")
        .in("target_id", commentIds);

      if (votes) {
        userVotesMap = votes.reduce((acc, v) => {
          acc[v.target_id] = v.vote_type as VoteType;
          return acc;
        }, {} as Record<string, VoteType>);
      }
    }

    const rawComments = (comments || []) as unknown as CommentWithRelations[];
    const enrichedComments: CommentWithRelations[] = rawComments.map((c) => ({
      ...c,
      user_vote: userVotesMap[c.id] || null,
    }));

    return NextResponse.json({ comments: enrichedComments });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { post_id, parent_id, content } = commentSchema.parse(body);

    if (!isSupabaseConfigured()) {
      // Mock creation
      const newComment: CommentWithRelations = {
        id: `c-${Date.now()}`,
        post_id,
        parent_id: parent_id || null,
        author_id: "user-1",
        content,
        score: 1,
        upvotes_count: 1,
        downvotes_count: 0,
        depth: parent_id ? 1 : 0,
        is_removed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: MOCK_PROFILES["user-1"],
        user_vote: 1,
        replies: [],
      };

      MOCK_COMMENTS.push(newComment);
      return NextResponse.json({ comment: newComment }, { status: 201 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine depth
    let depth = 0;
    if (parent_id) {
      const { data: parent } = await supabase
        .from("comments")
        .select("depth")
        .eq("id", parent_id)
        .single();
      if (parent) {
        depth = parent.depth + 1;
      }
    }

    const { data: comment, error: insertError } = await supabase
      .from("comments")
      .insert({
        post_id,
        parent_id: parent_id || null,
        author_id: user.id,
        content,
        depth,
        score: 0,
        upvotes_count: 0,
        downvotes_count: 0,
        is_removed: false,
      })
      .select(`
        *,
        author:profiles(*)
      `)
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Trigger Notification for Post Author or Parent Author
    try {
      if (parent_id) {
        const { data: parentComment } = await supabase
          .from("comments")
          .select("author_id")
          .eq("id", parent_id)
          .single();

        if (parentComment && parentComment.author_id && parentComment.author_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: parentComment.author_id,
            sender_id: user.id,
            type: "reply_comment",
            entity_id: comment.id,
            post_id,
          });
        }
      } else {
        const { data: post } = await supabase
          .from("posts")
          .select("author_id")
          .eq("id", post_id)
          .single();

        if (post && post.author_id && post.author_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: post.author_id,
            sender_id: user.id,
            type: "reply_post",
            entity_id: comment.id,
            post_id,
          });
        }
      }
    } catch {
      // Non-blocking notification failure
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Comment creation failed" },
      { status: 500 }
    );
  }
}
