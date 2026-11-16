import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateGeminiContent } from "@/lib/gemini/client";
import { checkRateLimit, createRateLimitResponse } from "@/lib/gemini/rate-limiter";

const suggestSchema = z.object({
  mode: z.enum(["draft", "home"]).default("draft"),
  title: z.string().optional(),
  body: z.string().optional(),
});

export interface CommunitySuggestion {
  name: string;
  title?: string;
  reason: string;
}

export async function POST(request: Request) {
  try {
    // 1. Auth required
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate input with Zod
    const rawBody = await request.json().catch(() => null);
    const parsed = suggestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { mode, title = "", body = "" } = parsed.data;

    // 3. Rate limiting (20 calls per user per hour)
    const rateResult = checkRateLimit(user.id, "authenticated");
    if (!rateResult.allowed) {
      return createRateLimitResponse(rateResult.resetInSeconds);
    }

    const admin = createAdminClient();

    // 4. Fetch up to 100 available communities
    const { data: allCommunities } = await admin
      .from("communities")
      .select("id, name, title, description, member_count")
      .order("member_count", { ascending: false })
      .limit(100);

    const safeCommunities = allCommunities || [];
    const validNamesSet = new Set(safeCommunities.map((c) => c.name.toLowerCase()));
    const communityMap = new Map(safeCommunities.map((c) => [c.name.toLowerCase(), c]));

    // Mode 1: Draft post matching (Create Post page)
    if (mode === "draft") {
      const combinedText = `${title} ${body}`.trim();
      if (combinedText.length < 20) {
        return NextResponse.json({
          suggestions: [],
          message: "Text must be at least 20 characters to trigger suggestions.",
        });
      }

      const communityCatalogue = safeCommunities
        .map((c) => `- c/${c.name}: "${c.title}" - ${c.description || "No description"}`)
        .join("\n");

      const prompt = `Given this draft post title and content, recommend the 3 most relevant communities from the catalog below.

Draft Title: "${title}"
Draft Content: "${body.slice(0, 500)}"

Available Community Catalog:
${communityCatalogue}

CRITICAL RULES:
1. ONLY recommend communities that exist in the catalog above. Do NOT invent, hallucinate, or recommend any names not listed.
2. For each recommendation, provide the exact community name (without "c/") and a concise 1-sentence rationale explaining why it fits.
3. Return a JSON array of up to 3 objects: [{ "name": "community_name", "reason": "One-line reason" }]`;

      const geminiResult = await generateGeminiContent<CommunitySuggestion[]>({
        prompt,
        responseMimeType: "application/json",
        timeoutMs: 15000,
      });

      let verifiedSuggestions: CommunitySuggestion[] = [];

      if (geminiResult.success && Array.isArray(geminiResult.data)) {
        // Strictly validate that returned names exist in the catalogue and discard hallucinated names
        for (const item of geminiResult.data) {
          if (item?.name && validNamesSet.has(item.name.toLowerCase())) {
            const comm = communityMap.get(item.name.toLowerCase());
            verifiedSuggestions.push({
              name: comm ? comm.name : item.name.toLowerCase(),
              title: comm?.title,
              reason: item.reason || "Matches post topics and domain.",
            });
          }
        }
      }

      // Fallback heuristics: Match keywords against titles/descriptions or return top communities
      if (verifiedSuggestions.length === 0) {
        const lowerText = combinedText.toLowerCase();
        const matched = safeCommunities
          .filter(
            (c) =>
              lowerText.includes(c.name.toLowerCase()) ||
              (c.title && lowerText.includes(c.title.toLowerCase())) ||
              (c.description && lowerText.includes(c.description.toLowerCase()))
          )
          .slice(0, 3);

        const candidates = matched.length > 0 ? matched : safeCommunities.slice(0, 3);
        verifiedSuggestions = candidates.map((c) => ({
          name: c.name,
          title: c.title,
          reason: "Popular community with active discussions in this category.",
        }));
      }

      return NextResponse.json({ suggestions: verifiedSuggestions.slice(0, 3) });
    }

    // Mode 2: Home Page Recommendations for users with < 3 joined communities
    if (mode === "home") {
      // Fetch user's joined communities
      const { data: userMemberships } = await admin
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      const joinedIds = new Set((userMemberships || []).map((m) => m.community_id));
      const joinedNames = safeCommunities
        .filter((c) => joinedIds.has(c.id))
        .map((c) => c.name);

      // Fetch user's recent upvoted posts
      const { data: recentVotes } = await admin
        .from("votes")
        .select("post_id")
        .eq("user_id", user.id)
        .eq("value", 1)
        .limit(5);

      const upvotedPostIds = (recentVotes || [])
        .map((v) => v.post_id)
        .filter((id): id is string => Boolean(id));

      let upvotedTitles: string[] = [];
      if (upvotedPostIds.length > 0) {
        const { data: upvotedPosts } = await admin
          .from("posts")
          .select("title")
          .in("id", upvotedPostIds);
        upvotedTitles = (upvotedPosts || []).map((p) => p.title).filter(Boolean);
      }

      // Filter communities user hasn't joined yet
      const candidateCommunities = safeCommunities.filter(
        (c) => !joinedNames.includes(c.name)
      );

      const fallbackPopular = candidateCommunities.slice(0, 3).map((c) => ({
        name: c.name,
        title: c.title,
        reason: `${c.member_count} members actively discussing related technical topics.`,
      }));

      if (candidateCommunities.length === 0) {
        return NextResponse.json({ suggestions: [] });
      }

      const communityCatalogue = candidateCommunities
        .slice(0, 50)
        .map((c) => `- c/${c.name}: "${c.title}" - ${c.description || ""}`)
        .join("\n");

      const prompt = `Recommend 3 communities for a developer to join based on their interests.

Joined Communities: ${joinedNames.join(", ") || "None yet"}
Recent Upvoted Posts: ${upvotedTitles.join("; ") || "None"}

Available Communities:
${communityCatalogue}

Recommend up to 3 communities the user hasn't joined yet.
Return JSON: [{ "name": "exact_name", "reason": "Personalized one-line reason" }]`;

      const geminiResult = await generateGeminiContent<CommunitySuggestion[]>({
        prompt,
        responseMimeType: "application/json",
        timeoutMs: 15000,
      });

      let verifiedSuggestions: CommunitySuggestion[] = [];

      if (geminiResult.success && Array.isArray(geminiResult.data)) {
        for (const item of geminiResult.data) {
          if (item?.name && validNamesSet.has(item.name.toLowerCase())) {
            const comm = communityMap.get(item.name.toLowerCase());
            verifiedSuggestions.push({
              name: comm ? comm.name : item.name.toLowerCase(),
              title: comm?.title,
              reason: item.reason || "Recommended based on your technical interests.",
            });
          }
        }
      }

      if (verifiedSuggestions.length === 0) {
        verifiedSuggestions = fallbackPopular;
      }

      return NextResponse.json({ suggestions: verifiedSuggestions.slice(0, 3) });
    }

    return NextResponse.json({ suggestions: [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to suggest communities" },
      { status: 500 }
    );
  }
}
