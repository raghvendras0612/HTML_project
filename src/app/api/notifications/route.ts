import { NextResponse } from "next/server";
import { createClient, createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import type { NotificationWithRelations } from "@/types/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));
  const unreadOnly = searchParams.get("unread_only") === "true";

  if (!isSupabaseConfigured()) {
    let filtered = MOCK_NOTIFICATIONS;
    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.is_read);
    }
    const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length;
    return NextResponse.json({
      notifications: filtered.slice(offset, offset + limit),
      total: filtered.length,
      unread_count: unreadCount,
    });
  }

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

    // 1. Fetch total unread count
    const { count: unreadCount } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    // 2. Fetch notifications page
    let query = admin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: rawNotifs, error, count: totalCount } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!rawNotifs || rawNotifs.length === 0) {
      return NextResponse.json({
        notifications: [],
        total: 0,
        unread_count: unreadCount || 0,
      });
    }

    // 3. Batch enrich actors (sender profiles)
    const actorIds = Array.from(new Set(rawNotifs.map((n) => n.actor_id).filter(Boolean)));
    let profileMap: Record<string, unknown> = {};
    if (actorIds.length > 0) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, username, display_name, avatar_url, karma")
        .in("id", actorIds);
      if (profs) {
        profileMap = profs.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, unknown>);
      }
    }

    // 4. Batch enrich posts and communities
    const postIds = Array.from(new Set(rawNotifs.map((n) => n.post_id).filter(Boolean)));
    let postMap: Record<string, { id: string; title: string; community_id: string; community_name?: string }> = {};
    if (postIds.length > 0) {
      const { data: posts } = await admin
        .from("posts")
        .select("id, title, community_id")
        .in("id", postIds);

      if (posts && posts.length > 0) {
        const communityIds = Array.from(new Set(posts.map((p) => p.community_id)));
        const { data: comms } = await admin
          .from("communities")
          .select("id, name")
          .in("id", communityIds);
        const commMap = (comms || []).reduce((acc, c) => {
          acc[c.id] = c.name;
          return acc;
        }, {} as Record<string, string>);

        postMap = posts.reduce((acc, p) => {
          acc[p.id] = {
            ...p,
            community_name: commMap[p.community_id] || "curia",
          };
          return acc;
        }, {} as Record<string, typeof postMap[0]>);
      }
    }

    // 5. Batch enrich comment snippets
    const commentIds = Array.from(new Set(rawNotifs.map((n) => n.comment_id).filter(Boolean))) as string[];
    let commentMap: Record<string, { id: string; body: string }> = {};
    if (commentIds.length > 0) {
      const { data: comments } = await admin
        .from("comments")
        .select("id, body")
        .in("id", commentIds);
      if (comments) {
        commentMap = comments.reduce((acc, c) => {
          acc[c.id] = c;
          return acc;
        }, {} as Record<string, { id: string; body: string }>);
      }
    }

    const enriched: NotificationWithRelations[] = rawNotifs.map((n) => {
      const post = postMap[n.post_id];
      const comment = n.comment_id ? commentMap[n.comment_id] : null;
      return {
        ...n,
        sender: (profileMap[n.actor_id] as NotificationWithRelations["sender"]) || null,
        post: post
          ? {
              id: post.id,
              title: post.title,
              community: { name: post.community_name || "curia" },
            }
          : null,
        comment: comment || null,
      };
    });

    return NextResponse.json({
      notifications: enriched,
      total: totalCount || enriched.length,
      unread_count: unreadCount || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const { id = "all" } = body;

    let updateQuery = admin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    if (id !== "all") {
      updateQuery = updateQuery.eq("id", id);
    }

    const { error: updateErr } = await updateQuery;
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Return new unread count
    const { count: remainingUnread } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({ success: true, unread_count: remainingUnread || 0 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
