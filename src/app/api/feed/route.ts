import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MOCK_POSTS } from "@/lib/mock-data";
import type { PostWithRelations, VoteType } from "@/types/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "hot";
  const time = searchParams.get("time") || "day";
  const community = searchParams.get("community");
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  // If Supabase is unconfigured, serve sorted mock posts
  if (!isSupabaseConfigured()) {
    let posts = [...MOCK_POSTS];

    if (community) {
      posts = posts.filter(
        (p) => p.community?.name.toLowerCase() === community.toLowerCase()
      );
    }

    if (sort === "new") {
      posts.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "top") {
      const now = Date.now();
      if (time === "day") {
        posts = posts.filter((p) => now - new Date(p.created_at).getTime() <= 24 * 3600 * 1000);
      } else if (time === "week") {
        posts = posts.filter((p) => now - new Date(p.created_at).getTime() <= 7 * 24 * 3600 * 1000);
      } else if (time === "month") {
        posts = posts.filter((p) => now - new Date(p.created_at).getTime() <= 30 * 24 * 3600 * 1000);
      }
      posts.sort((a, b) => b.score - a.score);
    } else {
      // Hot sort
      posts.sort((a, b) => b.hot_score - a.hot_score);
    }

    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const paginatedPosts = posts.slice(startIndex, startIndex + limit);
    const nextCursor =
      startIndex + limit < posts.length ? (startIndex + limit).toString() : null;

    return NextResponse.json({
      posts: paginatedPosts,
      nextCursor,
    });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from("posts")
      .select(`
        *,
        author:profiles(*),
        community:communities(*)
      `)
      .eq("is_removed", false);

    if (community) {
      const { data: commData } = await supabase
        .from("communities")
        .select("id")
        .ilike("name", community)
        .single();

      if (commData) {
        query = query.eq("community_id", commData.id);
      }
    }

    // Time window for TOP sort
    if (sort === "top") {
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
      query = query.order("score", { ascending: false });
    } else if (sort === "new") {
      query = query.order("created_at", { ascending: false });
    } else {
      // Default: Hot
      query = query.order("hot_score", { ascending: false });
    }

    query = query.limit(limit);

    if (cursor) {
      if (sort === "new") {
        query = query.lt("created_at", cursor);
      } else if (sort === "top") {
        query = query.lt("score", parseInt(cursor, 10));
      } else {
        query = query.lt("hot_score", parseFloat(cursor));
      }
    }

    const { data: posts, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch user votes if authenticated
    let userVotesMap: Record<string, VoteType> = {};
    if (user && posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const { data: votes } = await supabase
        .from("votes")
        .select("target_id, vote_type")
        .eq("user_id", user.id)
        .eq("target_type", "post")
        .in("target_id", postIds);

      if (votes) {
        userVotesMap = votes.reduce((acc, v) => {
          acc[v.target_id] = v.vote_type as VoteType;
          return acc;
        }, {} as Record<string, VoteType>);
      }
    }

    const rawPosts = (posts || []) as unknown as PostWithRelations[];
    const enrichedPosts: PostWithRelations[] = rawPosts.map((p) => ({
      ...p,
      user_vote: userVotesMap[p.id] || null,
    }));

    let nextCursor: string | null = null;
    if (enrichedPosts.length === limit) {
      const last = enrichedPosts[enrichedPosts.length - 1];
      if (sort === "new") nextCursor = last.created_at;
      else if (sort === "top") nextCursor = last.score.toString();
      else nextCursor = last.hot_score.toString();
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
