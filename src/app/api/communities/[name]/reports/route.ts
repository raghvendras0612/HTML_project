import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { name } = await params;
  const communityName = decodeURIComponent(name).toLowerCase();

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

    const { data: community } = await admin
      .from("communities")
      .select("id, name")
      .ilike("name", communityName)
      .maybeSingle();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Verify user is moderator
    const { data: memberRow } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberRow?.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden — moderator access only" }, { status: 403 });
    }

    // Get all post IDs for this community
    const { data: commPosts } = await admin
      .from("posts")
      .select("id")
      .eq("community_id", community.id);

    const postIds = (commPosts || []).map((p) => p.id);

    if (postIds.length === 0) {
      return NextResponse.json({ reports: [] });
    }

    // Fetch open reports
    const { data: openReports, error: reportErr } = await admin
      .from("reports")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (reportErr) {
      return NextResponse.json({ error: reportErr.message }, { status: 400 });
    }

    if (!openReports || openReports.length === 0) {
      return NextResponse.json({ reports: [] });
    }

    const reportPostIds = openReports.map((r) => r.post_id).filter(Boolean) as string[];
    const reportCommentIds = openReports.map((r) => r.comment_id).filter(Boolean) as string[];

    let postMap: Record<string, { id: string; title: string; author_id: string; is_removed: boolean; community_id: string }> = {};
    if (reportPostIds.length > 0) {
      const { data: posts } = await admin
        .from("posts")
        .select("id, title, author_id, is_removed, community_id")
        .in("id", reportPostIds);
      if (posts) {
        postMap = posts.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, typeof posts[0]>);
      }
    }

    let commentMap: Record<string, { id: string; body: string; author_id: string; is_removed: boolean; post_id: string }> = {};
    if (reportCommentIds.length > 0) {
      const { data: comments } = await admin
        .from("comments")
        .select("id, body, author_id, is_removed, post_id")
        .in("id", reportCommentIds);
      if (comments) {
        commentMap = comments.reduce((acc, c) => {
          acc[c.id] = c;
          return acc;
        }, {} as Record<string, typeof comments[0]>);
      }
    }

    // Filter reports for this community
    const communityReports = openReports.filter((r) => {
      if (r.post_id && postIds.includes(r.post_id)) return true;
      if (r.comment_id && commentMap[r.comment_id] && postIds.includes(commentMap[r.comment_id].post_id)) return true;
      return false;
    });

    // Batch enrich reporter profiles
    const reporterIds = Array.from(new Set(communityReports.map((r) => r.reporter_id)));
    let profileMap: Record<string, unknown> = {};
    if (reporterIds.length > 0) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, username, display_name")
        .in("id", reporterIds);
      if (profs) {
        profileMap = profs.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, unknown>);
      }
    }

    const enriched = communityReports.map((r) => ({
      ...r,
      post: r.post_id ? postMap[r.post_id] || null : null,
      comment: r.comment_id ? commentMap[r.comment_id] || null : null,
      reporter: profileMap[r.reporter_id] || null,
    }));

    return NextResponse.json({ reports: enriched });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load reports" },
      { status: 500 }
    );
  }
}
