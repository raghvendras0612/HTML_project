import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import * as z from "zod";
import type { CommentWithRelations, VoteType } from "@/types/database.types";

const commentSchema = z.object({
  post_id: z.string().uuid("Invalid post ID"),
  parent_id: z.string().uuid().nullable().optional(),
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(10000, "Comment cannot exceed 10,000 characters"),
  moderation_verdict: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("post_id");

  if (!postId) {
    return NextResponse.json({ error: "post_id is required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Load all comments for post ordered by path (and created_at fallback)
    const { data: comments, error } = await admin
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Batch fetch author profiles in 1 query
    const authorIds = Array.from(
      new Set((comments || []).map((c) => c.author_id).filter(Boolean))
    );
    let authorMap: Record<string, unknown> = {};
    if (authorIds.length > 0) {
      const { data: profs } = await admin
        .from("profiles")
        .select("*")
        .in("id", authorIds);
      if (profs) {
        authorMap = profs.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, unknown>);
      }
    }

    // Batch fetch user votes on comments in 1 query
    let userVotesMap: Record<string, VoteType> = {};
    if (user && comments && comments.length > 0) {
      const commentIds = comments.map((c) => c.id);
      const { data: votes } = await admin
        .from("votes")
        .select("comment_id, value")
        .eq("user_id", user.id)
        .in("comment_id", commentIds);

      if (votes) {
        userVotesMap = votes.reduce((acc, v) => {
          if (v.comment_id) {
            acc[v.comment_id] = v.value as VoteType;
          }
          return acc;
        }, {} as Record<string, VoteType>);
      }
    }

    // Fetch post to check community for bans and moderator status
    const { data: post } = await admin
      .from("posts")
      .select("community_id")
      .eq("id", postId)
      .maybeSingle();

    let isBanned = false;
    let isModerator = false;

    if (user && post?.community_id) {
      const { data: ban } = await admin
        .from("community_bans")
        .select("community_id")
        .eq("community_id", post.community_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (ban) isBanned = true;

      const { data: membership } = await admin
        .from("community_members")
        .select("role")
        .eq("community_id", post.community_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (membership?.role === "moderator") isModerator = true;
    }

    const rawComments = (comments || []) as unknown as CommentWithRelations[];
    const enrichedComments: CommentWithRelations[] = rawComments.map((c) => ({
      ...c,
      content: c.body,
      author: (authorMap[c.author_id] as CommentWithRelations["author"]) || null,
      user_vote: userVotesMap[c.id] || null,
    }));

    return NextResponse.json({
      comments: enrichedComments,
      is_banned: isBanned,
      is_moderator: isModerator,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { post_id, parent_id, content } = commentSchema.parse(body);

    // 1. Fetch post to get community_id, author_id and current comment_count
    const { data: post, error: postErr } = await admin
      .from("posts")
      .select("community_id, author_id, comment_count")
      .eq("id", post_id)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 2. Check if user is banned from this community
    const { data: ban } = await admin
      .from("community_bans")
      .select("community_id")
      .eq("community_id", post.community_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (ban) {
      return NextResponse.json(
        { error: "You are banned from this community and cannot comment." },
        { status: 403 }
      );
    }

    // Rate limit: max 60 comments per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCommentsCount } = await admin
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .gte("created_at", oneHourAgo);

    if ((recentCommentsCount || 0) >= 60) {
      return NextResponse.json(
        {
          error:
            "Comment creation rate limit exceeded. You can create at most 60 comments per hour. Please wait before commenting again.",
        },
        { status: 429 }
      );
    }

    // 3. Compute depth and path
    let depth = 0;
    let path = "";
    if (parent_id) {
      const { data: parent } = await admin
        .from("comments")
        .select("depth, path")
        .eq("id", parent_id)
        .single();

      if (parent) {
        depth = (parent.depth ?? 0) + 1;
        path = parent.path || "";
      }
    }

    // Generate unique short path segment
    const segment = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const fullPath = path ? `${path}.${segment}` : segment;

    // 4. Insert comment
    const commentInsert: Record<string, unknown> = {
      post_id,
      parent_id: parent_id || null,
      author_id: user.id,
      body: content,
      depth,
      path: fullPath,
      score: 0,
      is_removed: false,
    };
    if (body.moderation_verdict) {
      commentInsert.moderation_verdict = body.moderation_verdict;
    }

    let { data: comment, error: insertError } = await admin
      .from("comments")
      .insert(commentInsert as any)
      .select()
      .single();

    if (insertError && (insertError.message?.includes("moderation_verdict") || insertError.code === "42703")) {
      const fallbackInsert = { ...commentInsert };
      delete fallbackInsert.moderation_verdict;
      const retryResult = await admin
        .from("comments")
        .insert(fallbackInsert as any)
        .select()
        .single();
      comment = retryResult.data;
      insertError = retryResult.error;
    }

    if (insertError || !comment) {
      return NextResponse.json(
        { error: insertError?.message || "Failed to create comment" },
        { status: 400 }
      );
    }

    // 5. Update posts.comment_count
    const { count: actualCommentCount } = await admin
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", post_id)
      .eq("is_removed", false)
      .neq("body", "[deleted]");

    await admin
      .from("posts")
      .update({ comment_count: actualCommentCount || 0 })
      .eq("id", post_id);

    // 6. Generate notification for recipient (skipping self-replies)
    try {
      let recipientId: string | null = null;
      let notifType: "post_reply" | "comment_reply" = "post_reply";

      if (parent_id) {
        const { data: parentComm } = await admin
          .from("comments")
          .select("author_id")
          .eq("id", parent_id)
          .maybeSingle();
        if (parentComm) {
          recipientId = parentComm.author_id;
          notifType = "comment_reply";
        }
      } else {
        recipientId = post.author_id;
        notifType = "post_reply";
      }

      if (recipientId && recipientId !== user.id) {
        // Check if DB trigger already inserted to avoid duplicates
        const { data: existingNotif } = await admin
          .from("notifications")
          .select("id")
          .eq("comment_id", comment.id)
          .maybeSingle();

        if (!existingNotif) {
          await admin.from("notifications").insert({
            user_id: recipientId,
            actor_id: user.id,
            type: notifType,
            post_id,
            comment_id: comment.id,
            is_read: false,
          });
        }
      }
    } catch (notifErr) {
      console.error("Failed to generate notification:", notifErr);
    }

    // 7. Fetch author profile
    const { data: author } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const enrichedComment: CommentWithRelations = {
      ...(comment as unknown as CommentWithRelations),
      content: comment.body,
      author,
      user_vote: null,
      replies: [],
    };

    return NextResponse.json({ comment: enrichedComment }, { status: 201 });
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
