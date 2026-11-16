import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as z from "zod";
import type { Database } from "@/types/database.types";

const createPostSchema = z.object({
  community_id: z.string().uuid("Invalid community ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(300, "Title must be at most 300 characters"),
  content_type: z.enum(["text", "image", "link"]),
  content_text: z.string().optional().nullable(),
  content_url: z.string().url("Invalid URL").optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createPostSchema.parse(body);

    // Verify user is not banned from this community
    const { data: ban } = await supabase
      .from("community_bans")
      .select("community_id")
      .eq("community_id", validated.community_id)
      .eq("user_id", user.id)
      .single();

    if (ban) {
      return NextResponse.json(
        { error: "You are banned from posting in this community." },
        { status: 403 }
      );
    }

    const postInsert: Database["public"]["Tables"]["posts"]["Insert"] = {
      community_id: validated.community_id,
      author_id: user.id,
      title: validated.title,
      content_type: validated.content_type,
      content_text: validated.content_text || null,
      content_url: validated.content_url || null,
      score: 0,
      upvotes_count: 0,
      downvotes_count: 0,
      comments_count: 0,
      is_pinned: false,
      is_removed: false,
      hot_score: 0,
    };

    // Insert post
    const { data: post, error: insertError } = await supabase
      .from("posts")
      .insert(postInsert)
      .select(`
        *,
        author:profiles(*),
        community:communities(*)
      `)
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
