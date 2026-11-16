import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MOCK_POSTS } from "@/lib/mock-data";
import type { Database } from "@/types/database";
import type { PostWithRelations, VoteType } from "@/types/database.types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: post, error } = await admin
      .from("posts")
      .select(`
        *,
        community:communities(*)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !post) {
      // Mock fallback
      const mockPost = MOCK_POSTS.find((p) => p.id === id);
      if (mockPost) {
        return NextResponse.json({
          post: mockPost,
          isAuthor: user?.id === mockPost.author_id,
          isModerator: true,
        });
      }
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch author profile
    let author = null;
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", post.author_id)
      .maybeSingle();
    author = profile;

    // Check user vote
    let user_vote: VoteType | null = null;
    let isAuthor = false;
    let isModerator = false;

    if (user) {
      isAuthor = post.author_id === user.id;

      const { data: vote } = await admin
        .from("votes")
        .select("value")
        .eq("user_id", user.id)
        .eq("post_id", post.id)
        .maybeSingle();

      if (vote) {
        user_vote = vote.value as VoteType;
      }

      // Check if user is moderator of community
      const { data: membership } = await admin
        .from("community_members")
        .select("role")
        .eq("community_id", post.community_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership?.role === "moderator") {
        isModerator = true;
      }
    }

    const enrichedPost: PostWithRelations = {
      ...(post as unknown as PostWithRelations),
      author,
      user_vote,
    };

    return NextResponse.json({
      post: enrichedPost,
      isAuthor,
      isModerator,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
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
      return NextResponse.json({ error: "Unauthorized — please log in" }, { status: 401 });
    }

    const { data: post, error: postError } = await admin
      .from("posts")
      .select("*, community:communities(id, name)")
      .eq("id", id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if moderator
    const { data: membership } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", post.community_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const isAuthor = post.author_id === user.id;
    const isModerator = membership?.role === "moderator";

    const body = await request.json();
    const updates: Database["public"]["Tables"]["posts"]["Update"] = {};

    // 1. Edit post body (author only)
    if (typeof body.body === "string") {
      if (!isAuthor) {
        return NextResponse.json({ error: "Only the author can edit this post" }, { status: 403 });
      }
      updates.body = body.body;
    }

    // 2. Remove / restore post (author or moderator)
    if (typeof body.is_removed === "boolean") {
      if (!isAuthor && !isModerator) {
        return NextResponse.json({ error: "Permission denied to remove post" }, { status: 403 });
      }
      updates.is_removed = body.is_removed;
      updates.removed_by = body.is_removed ? user.id : null;
    }

    // 3. Pin / unpin post (moderator only, max 2 pinned posts per community)
    if (typeof body.is_pinned === "boolean") {
      if (!isModerator) {
        return NextResponse.json({ error: "Only moderators can pin posts" }, { status: 403 });
      }

      if (body.is_pinned) {
        // Enforce maximum 2 pinned posts per community
        const { count, error: countError } = await admin
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("community_id", post.community_id)
          .eq("is_pinned", true)
          .neq("id", post.id);

        if (countError) {
          return NextResponse.json({ error: countError.message }, { status: 400 });
        }

        if ((count || 0) >= 2) {
          return NextResponse.json(
            { error: "A community can have at most 2 pinned posts. Please unpin another post first." },
            { status: 400 }
          );
        }
      }

      updates.is_pinned = body.is_pinned;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 });
    }

    const { data: updatedPost, error: updateError } = await admin
      .from("posts")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        community:communities(*)
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ post: updatedPost });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
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

    const { data: post, error: postError } = await admin
      .from("posts")
      .select("author_id, community_id")
      .eq("id", id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if moderator
    const { data: membership } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", post.community_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const isAuthor = post.author_id === user.id;
    const isModerator = membership?.role === "moderator";

    if (!isAuthor && !isModerator) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { error: deleteError } = await admin
      .from("posts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
