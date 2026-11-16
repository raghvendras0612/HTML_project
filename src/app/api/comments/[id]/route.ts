import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import * as z from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchCommentSchema = z.object({
  body: z.string().trim().min(1).max(10000).optional(),
  is_removed: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const admin = createAdminClient();
    const { data: comment, error } = await admin
      .from("comments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const { data: author } = await admin
      .from("profiles")
      .select("*")
      .eq("id", comment.author_id)
      .maybeSingle();

    return NextResponse.json({
      comment: {
        ...comment,
        content: comment.body,
        author,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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
    const validated = patchCommentSchema.parse(body);

    // Fetch comment and post to determine community and permissions
    const { data: comment, error: commentErr } = await admin
      .from("comments")
      .select("*")
      .eq("id", id)
      .single();

    if (commentErr || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const { data: post } = await admin
      .from("posts")
      .select("id, community_id")
      .eq("id", comment.post_id)
      .maybeSingle();

    const postCommunityId = post?.community_id;

    // Check if moderator of the community
    let isModerator = false;
    if (postCommunityId) {
      const { data: membership } = await admin
        .from("community_members")
        .select("role")
        .eq("community_id", postCommunityId)
        .eq("user_id", user.id)
        .maybeSingle();
      isModerator = membership?.role === "moderator";
    }

    const isAuthor = comment.author_id === user.id;

    const updates: {
      body?: string;
      is_removed?: boolean;
    } = {};

    // 1. Author edit body
    if (typeof validated.body === "string") {
      if (!isAuthor) {
        return NextResponse.json(
          { error: "Only the author can edit this comment" },
          { status: 403 }
        );
      }
      updates.body = validated.body;
    }

    // 2. Moderator remove / restore
    if (typeof validated.is_removed === "boolean") {
      if (!isModerator && !isAuthor) {
        return NextResponse.json(
          { error: "Only moderators can remove comments" },
          { status: 403 }
        );
      }
      updates.is_removed = validated.is_removed;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: updatedComment, error: updateErr } = await admin
      .from("comments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      comment: {
        ...updatedComment,
        content: updatedComment.body,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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

    const { data: comment, error: commentErr } = await admin
      .from("comments")
      .select("*")
      .eq("id", id)
      .single();

    if (commentErr || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const { data: post } = await admin
      .from("posts")
      .select("id, community_id")
      .eq("id", comment.post_id)
      .maybeSingle();

    const postCommunityId = post?.community_id;
    let isModerator = false;
    if (postCommunityId) {
      const { data: membership } = await admin
        .from("community_members")
        .select("role")
        .eq("community_id", postCommunityId)
        .eq("user_id", user.id)
        .maybeSingle();
      isModerator = membership?.role === "moderator";
    }

    const isAuthor = comment.author_id === user.id;

    if (!isAuthor && !isModerator) {
      return NextResponse.json(
        { error: "Permission denied to delete comment" },
        { status: 403 }
      );
    }

    // Check if comment has child replies
    const { count: replyCount } = await admin
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id);

    if ((replyCount || 0) > 0) {
      // Soft-delete: preserve node in tree for replies, replace body with '[deleted]'
      await admin
        .from("comments")
        .update({ body: "[deleted]" })
        .eq("id", id);
    } else {
      // Hard delete row
      await admin.from("comments").delete().eq("id", id);
    }

    // Recalculate posts.comment_count
    const { count: actualCount } = await admin
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", comment.post_id)
      .eq("is_removed", false)
      .neq("body", "[deleted]");

    await admin
      .from("posts")
      .update({ comment_count: actualCount || 0 })
      .eq("id", comment.post_id);

    return NextResponse.json({ success: true, isSoftDeleted: (replyCount || 0) > 0 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete comment" },
      { status: 500 }
    );
  }
}
