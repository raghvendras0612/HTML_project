import { NextResponse } from "next/server";
import { createClient, createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MOCK_POSTS } from "@/lib/mock-data";
import type { PostWithRelations, VoteType } from "@/types/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const feedType = searchParams.get("type") || "home"; // home | popular | all
  const sort = searchParams.get("sort") || "hot"; // hot | new | top
  const time = searchParams.get("time") || "day"; // day | week | month | year | all
  const community = searchParams.get("community");
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const offset = cursor && !isNaN(parseInt(cursor, 10)) ? parseInt(cursor, 10) : 0;

  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = admin
      .from("posts")
      .select(`
        *,
        community:communities(*)
      `)
      .eq("is_removed", false);

    // Filter by community or feed type
    if (community) {
      const { data: commData } = await admin
        .from("communities")
        .select("id")
        .ilike("name", community)
        .maybeSingle();

      if (commData) {
        query = query.eq("community_id", commData.id);
      } else {
        return NextResponse.json({ posts: [], nextCursor: null });
      }
    } else if (feedType === "home" && user) {
      // Home feed: joined communities
      const { data: userMemberships } = await admin
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      if (userMemberships && userMemberships.length > 0) {
        const commIds = userMemberships.map((m) => m.community_id);
        query = query.in("community_id", commIds);
      }
      // If no memberships, falls through to popular/site-wide
    }

    // Pinned posts always on top for community feed
    if (community) {
      query = query.order("is_pinned", { ascending: false });
    }

    // Sort order
    if (feedType === "all" || sort === "new") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "top") {
      const now = new Date();
      if (time === "day") {
        const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        query = query.gte("created_at", past.toISOString());
      } else if (time === "week") {
        const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", past.toISOString());
      } else if (time === "month") {
        const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", past.toISOString());
      } else if (time === "year") {
        const past = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", past.toISOString());
      }
      query = query.order("score", { ascending: false }).order("created_at", { ascending: false });
    } else {
      // Default: Hot rank
      query = query.order("hot_rank", { ascending: false }).order("created_at", { ascending: false });
    }

    // Range pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Batch fetch authors
    const authorIds = Array.from(new Set((posts || []).map((p) => p.author_id).filter(Boolean)));
    let authorMap: Record<string, unknown> = {};
    if (authorIds.length > 0) {
      const { data: authors } = await admin
        .from("profiles")
        .select("*")
        .in("id", authorIds);
      if (authors) {
        authorMap = authors.reduce((acc, a) => {
          acc[a.id] = a;
          return acc;
        }, {} as Record<string, unknown>);
      }
    }

    // Fetch user votes if authenticated
    let userVotesMap: Record<string, VoteType> = {};
    if (user && posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const { data: votes } = await admin
        .from("votes")
        .select("post_id, value")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      if (votes) {
        userVotesMap = votes.reduce((acc, v) => {
          if (v.post_id) {
            acc[v.post_id] = v.value as VoteType;
          }
          return acc;
        }, {} as Record<string, VoteType>);
      }
    }

    const rawPosts = (posts || []) as unknown as PostWithRelations[];
    const enrichedPosts: PostWithRelations[] = rawPosts.map((p) => ({
      ...p,
      author: (authorMap[p.author_id] as PostWithRelations["author"]) || null,
      user_vote: userVotesMap[p.id] || null,
    }));

    let nextCursor: string | null = null;
    if (enrichedPosts.length === limit) {
      nextCursor = (offset + limit).toString();
    }

    return NextResponse.json({
      posts: enrichedPosts,
      nextCursor,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
