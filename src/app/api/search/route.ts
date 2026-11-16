import { NextResponse } from "next/server";
import { createClient, createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MOCK_POSTS, MOCK_COMMUNITIES, MOCK_PROFILES } from "@/lib/mock-data";
import type { PostWithRelations } from "@/types/database.types";

// Helper to sanitize search input against syntax-breaking characters for websearch
function sanitizeQuery(raw: string): string {
  // websearch_to_tsquery safely handles spaces and phrases, but we strip dangerous SQL injection attempts
  return raw
    .replace(/[;\'\"\-\-\<\>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Client-side helper to inject highlighting tags in matching text
function highlightMatches(text: string, query: string): string {
  if (!text || !query) return text;
  const terms = query
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (terms.length === 0) return text;

  const regex = new RegExp(`(${terms.join("|")})`, "gi");
  return text.replace(regex, '<mark class="bg-accent/20 text-accent font-semibold px-0.5 rounded">$1</mark>');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQ = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "relevance").toLowerCase(); // relevance, new, top
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

  if (!rawQ) {
    return NextResponse.json({
      posts: [],
      communities: [],
      users: [],
      total: 0,
    });
  }

  const cleanQ = sanitizeQuery(rawQ);

  if (!isSupabaseConfigured()) {
    const lower = cleanQ.toLowerCase();
    const matchedPosts = MOCK_POSTS.filter(
      (p) =>
        !p.is_removed &&
        (p.title.toLowerCase().includes(lower) ||
          (p.content_text && p.content_text.toLowerCase().includes(lower)) ||
          (p.body && p.body.toLowerCase().includes(lower)))
    );

    const matchedCommunities = MOCK_COMMUNITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.title.toLowerCase().includes(lower) ||
        (c.description && c.description.toLowerCase().includes(lower))
    );

    const matchedUsers = Object.values(MOCK_PROFILES).filter(
      (u) =>
        u.username.toLowerCase().includes(lower) ||
        (u.display_name && u.display_name.toLowerCase().includes(lower))
    );

    return NextResponse.json({
      posts: matchedPosts.slice(offset, offset + limit),
      communities: matchedCommunities.slice(0, 10),
      users: matchedUsers.slice(0, 10),
      total: matchedPosts.length,
    });
  }

  try {
    const admin = createAdminClient();

    // 1. Search Posts using GIN full-text search on search_tsv
    let postQuery = admin
      .from("posts")
      .select(`
        *,
        community:communities(id, name, title)
      `)
      .eq("is_removed", false);

    // If query contains terms, apply textSearch
    if (cleanQ) {
      // Use websearch_to_tsquery against stored tsvector search_tsv
      postQuery = postQuery.textSearch("search_tsv", cleanQ, {
        type: "websearch",
        config: "english",
      });
    }

    // Sort order
    if (sort === "new") {
      postQuery = postQuery.order("created_at", { ascending: false });
    } else if (sort === "top") {
      postQuery = postQuery.order("score", { ascending: false });
    } else {
      // Relevance / default: score & hot_rank
      postQuery = postQuery.order("score", { ascending: false }).order("created_at", { ascending: false });
    }

    const { data: posts, error: postErr } = await postQuery.range(offset, offset + limit - 1);

    if (postErr) {
      // Fallback query if textSearch syntax was rejected
      const { data: fallbackPosts } = await admin
        .from("posts")
        .select(`*, community:communities(id, name, title)`)
        .eq("is_removed", false)
        .ilike("title", `%${cleanQ}%`)
        .limit(limit);

      return NextResponse.json({
        posts: fallbackPosts || [],
        communities: [],
        users: [],
        total: (fallbackPosts || []).length,
      });
    }

    // Batch enrich post authors
    const authorIds = Array.from(new Set((posts || []).map((p) => p.author_id).filter(Boolean)));
    let authorMap: Record<string, unknown> = {};
    if (authorIds.length > 0) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, username, display_name, avatar_url, karma")
        .in("id", authorIds);
      if (profs) {
        authorMap = profs.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, unknown>);
      }
    }

    const enrichedPosts = (posts || []).map((p) => ({
      ...p,
      author: authorMap[p.author_id] || null,
      highlighted_title: highlightMatches(p.title, cleanQ),
    }));

    // Rank posts: Title matches ranked ahead of body-only matches
    if (sort === "relevance" && cleanQ) {
      const qWords = cleanQ.toLowerCase().split(/\s+/).filter(Boolean);
      enrichedPosts.sort((a, b) => {
        const aTitle = (a.title || "").toLowerCase();
        const bTitle = (b.title || "").toLowerCase();
        const aTitleExact = aTitle.includes(cleanQ.toLowerCase());
        const bTitleExact = bTitle.includes(cleanQ.toLowerCase());
        if (aTitleExact && !bTitleExact) return -1;
        if (!aTitleExact && bTitleExact) return 1;

        const aTitleMatches = qWords.filter((w) => aTitle.includes(w)).length;
        const bTitleMatches = qWords.filter((w) => bTitle.includes(w)).length;
        if (aTitleMatches !== bTitleMatches) return bTitleMatches - aTitleMatches;

        return (b.score || 0) - (a.score || 0);
      });
    }

    // 2. Search Communities (name, title, description)
    const { data: communities } = await admin
      .from("communities")
      .select("id, name, title, description, member_count, icon_url")
      .or(`name.ilike.%${cleanQ}%,title.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%`)
      .order("member_count", { ascending: false })
      .limit(10);

    // 3. Search Users (username, display_name)
    const { data: users } = await admin
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, karma, created_at")
      .or(`username.ilike.%${cleanQ}%,display_name.ilike.%${cleanQ}%`)
      .order("karma", { ascending: false })
      .limit(10);

    return NextResponse.json({
      posts: enrichedPosts as unknown as PostWithRelations[],
      communities: communities || [],
      users: users || [],
      total: enrichedPosts.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search error" },
      { status: 500 }
    );
  }
}
