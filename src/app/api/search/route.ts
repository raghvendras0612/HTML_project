import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MOCK_POSTS, MOCK_COMMUNITIES, MOCK_PROFILES } from "@/lib/mock-data";
import type { PostWithRelations } from "@/types/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ posts: [], communities: [], users: [] });
  }

  if (!isSupabaseConfigured()) {
    // In mock mode
    const lower = q.toLowerCase();
    const matchedPosts = MOCK_POSTS.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        (p.content_text && p.content_text.toLowerCase().includes(lower))
    );

    const matchedCommunities = MOCK_COMMUNITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.title.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower)
    );

    const matchedUsers = Object.values(MOCK_PROFILES).filter(
      (u) =>
        u.username.toLowerCase().includes(lower) ||
        (u.display_name && u.display_name.toLowerCase().includes(lower))
    );

    return NextResponse.json({
      posts: matchedPosts,
      communities: matchedCommunities,
      users: matchedUsers,
    });
  }

  try {
    const supabase = await createClient();

    // 1. Search Posts
    const { data: posts } = await supabase
      .from("posts")
      .select(`
        *,
        author:profiles(*),
        community:communities(*)
      `)
      .or(`title.ilike.%${q}%,content_text.ilike.%${q}%`)
      .eq("is_removed", false)
      .limit(20);

    // 2. Search Communities
    const { data: communities } = await supabase
      .from("communities")
      .select("*")
      .or(`name.ilike.%${q}%,title.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(10);

    // 3. Search Profiles
    const { data: users } = await supabase
      .from("profiles")
      .select("*")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(10);

    return NextResponse.json({
      posts: (posts || []) as unknown as PostWithRelations[],
      communities: communities || [],
      users: users || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
