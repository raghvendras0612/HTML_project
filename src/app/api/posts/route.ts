import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createPostSchema } from "@/lib/validations/community-and-post";
import type { Database } from "@/types/database";

export async function POST(request: Request) {
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

    const body = await request.json();
    const validated = createPostSchema.parse(body);

    // 1. Verify user is NOT banned from this community
    const { data: ban } = await admin
      .from("community_bans")
      .select("community_id")
      .eq("community_id", validated.community_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (ban) {
      return NextResponse.json(
        { error: "You are banned from posting in this community." },
        { status: 403 }
      );
    }

    // 2. Join-Gate: Verify user is a member of this community
    const { data: membership } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", validated.community_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "You must join this community before posting." },
        { status: 403 }
      );
    }

    // 3. Rate limit: max 10 posts per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentPostsCount } = await admin
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .gte("created_at", oneHourAgo);

    if ((recentPostsCount || 0) >= 10) {
      return NextResponse.json(
        {
          error:
            "Post creation rate limit exceeded. You can create at most 10 posts per hour. Please wait before posting again.",
        },
        { status: 429 }
      );
    }

    const postInsert: Record<string, unknown> = {
      community_id: validated.community_id,
      author_id: user.id,
      type: validated.type,
      title: validated.title,
      body: validated.body || null,
      url: validated.url || null,
      image_path: validated.image_path || null,
      score: 0,
      comment_count: 0,
      is_pinned: false,
      is_removed: false,
      hot_rank: 0,
    };

    if (validated.moderation_verdict) {
      postInsert.moderation_verdict = validated.moderation_verdict;
    }

    // Insert post into database with graceful fallback if remote DB lacks moderation_verdict column
    let { data: post, error: insertError } = await admin
      .from("posts")
      .insert(postInsert as any)
      .select()
      .single();

    if (insertError && (insertError.message?.includes("moderation_verdict") || insertError.code === "42703")) {
      const fallbackInsert = { ...postInsert };
      delete fallbackInsert.moderation_verdict;
      const retryResult = await admin
        .from("posts")
        .insert(fallbackInsert as any)
        .select()
        .single();
      post = retryResult.data;
      insertError = retryResult.error;
    }

    if (insertError || !post) {
      return NextResponse.json(
        { error: insertError?.message || "Failed to create post" },
        { status: 400 }
      );
    }

    // Attach author profile and community
    const [{ data: author }, { data: comm }] = await Promise.all([
      admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      admin.from("communities").select("*").eq("id", validated.community_id).maybeSingle(),
    ]);

    const enrichedPost = {
      ...post,
      author,
      community: comm,
      user_vote: null,
    };

    return NextResponse.json({ post: enrichedPost }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "errors" in err && Array.isArray((err as { errors: { message: string }[] }).errors)) {
      return NextResponse.json(
        { error: (err as { errors: { message: string }[] }).errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
