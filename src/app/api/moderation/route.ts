import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MOCK_POSTS, MOCK_COMMUNITIES } from "@/lib/mock-data";
import * as z from "zod";

const modActionSchema = z.object({
  action: z.enum([
    "pin",
    "unpin",
    "remove_post",
    "restore_post",
    "remove_comment",
    "ban_user",
    "unban_user",
  ]),
  community_id: z.string(),
  target_id: z.string(),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, community_id, target_id, reason } = modActionSchema.parse(body);

    if (!isSupabaseConfigured()) {
      // Mock moderation in demo mode
      if (action === "pin") {
        const pinnedInCommunity = MOCK_POSTS.filter(
          (p) => p.community_id === community_id && p.is_pinned
        );
        if (pinnedInCommunity.length >= 2) {
          return NextResponse.json(
            { error: "A community can pin at most 2 posts simultaneously." },
            { status: 400 }
          );
        }
        const post = MOCK_POSTS.find((p) => p.id === target_id);
        if (post) post.is_pinned = true;
      } else if (action === "unpin") {
        const post = MOCK_POSTS.find((p) => p.id === target_id);
        if (post) post.is_pinned = false;
      } else if (action === "remove_post") {
        const post = MOCK_POSTS.find((p) => p.id === target_id);
        if (post) post.is_removed = true;
      } else if (action === "restore_post") {
        const post = MOCK_POSTS.find((p) => p.id === target_id);
        if (post) post.is_removed = false;
      }
      return NextResponse.json({ success: true, action });
    }

    // Live Supabase moderation
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify moderator privileges
    const { data: isMod } = await supabase.rpc("is_community_moderator", {
      p_community_id: community_id,
      p_user_id: user.id,
    });

    if (!isMod) {
      return NextResponse.json(
        { error: "Forbidden: You are not a moderator of this community." },
        { status: 403 }
      );
    }

    if (action === "pin") {
      // Check 2 pinned post cap
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("community_id", community_id)
        .eq("is_pinned", true);

      if (count !== null && count >= 2) {
        return NextResponse.json(
          { error: "A community can pin at most 2 posts simultaneously." },
          { status: 400 }
        );
      }

      await supabase
        .from("posts")
        .update({ is_pinned: true })
        .eq("id", target_id);
    } else if (action === "unpin") {
      await supabase
        .from("posts")
        .update({ is_pinned: false })
        .eq("id", target_id);
    } else if (action === "remove_post") {
      await supabase
        .from("posts")
        .update({ is_removed: true })
        .eq("id", target_id);
    } else if (action === "restore_post") {
      await supabase
        .from("posts")
        .update({ is_removed: false })
        .eq("id", target_id);
    } else if (action === "remove_comment") {
      await supabase
        .from("comments")
        .update({ is_removed: true })
        .eq("id", target_id);
    } else if (action === "ban_user") {
      await supabase.from("community_bans").insert({
        community_id,
        user_id: target_id,
        reason: reason || "Violating community standards",
        banned_by: user.id,
      });
    } else if (action === "unban_user") {
      await supabase
        .from("community_bans")
        .delete()
        .eq("community_id", community_id)
        .eq("user_id", target_id);
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Moderation action failed" },
      { status: 500 }
    );
  }
}
