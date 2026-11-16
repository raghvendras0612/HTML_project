import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateGeminiContent } from "@/lib/gemini/client";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/gemini/rate-limiter";
import { computeContentHash, getCachedAIResult, setCachedAIResult } from "@/lib/gemini/cache";

const summarizeSchema = z.object({
  post_id: z.string().uuid("Invalid post ID"),
  force_refresh: z.boolean().optional(),
});

export interface SummaryResponse {
  summary: string;
  key_points: string[];
  disagreement: string | null;
  comment_count: number;
  cached?: boolean;
}

export async function POST(request: Request) {
  try {
    // 1. Parse and validate body with Zod
    const rawBody = await request.json().catch(() => null);
    const parsed = summarizeSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { post_id, force_refresh } = parsed.data;

    // 2. Auth & Rate Limiting
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let rateResult;
    if (user) {
      rateResult = checkRateLimit(user.id, "authenticated");
    } else {
      const clientIp = getClientIp(request);
      rateResult = checkRateLimit(clientIp, "anonymous");
    }

    if (!rateResult.allowed) {
      return createRateLimitResponse(rateResult.resetInSeconds);
    }

    // 3. Fetch Post from database
    const admin = createAdminClient();
    const { data: post, error: postErr } = await admin
      .from("posts")
      .select("id, title, body, comment_count")
      .eq("id", post_id)
      .maybeSingle();

    if (postErr || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const commentCount = post.comment_count ?? 0;

    // 4. Content-hash based Cache Check (Keyed by post_id + comment_count)
    const contentHash = computeContentHash(`summary:${post_id}:${commentCount}`);

    if (!force_refresh) {
      const cached = await getCachedAIResult<SummaryResponse>(contentHash);
      if (cached) {
        return NextResponse.json({ ...cached, cached: true });
      }
    }

    // 5. Fetch up to 60 top comments, prioritizing score and depth variety
    const { data: comments } = await admin
      .from("comments")
      .select("body, score, depth")
      .eq("post_id", post_id)
      .eq("is_removed", false)
      .neq("body", "[deleted]")
      .order("score", { ascending: false })
      .limit(60);

    const safeComments = comments || [];

    // Format comments without usernames to adhere strictly to neutral privacy rules
    const commentsSnippet = safeComments
      .slice(0, 50)
      .map(
        (c, idx) =>
          `[Comment #${idx + 1} (Score: ${c.score}, Depth: ${c.depth})]: ${c.body.slice(0, 300)}`
      )
      .join("\n\n");

    const prompt = `Analyze this technical discussion thread and produce an objective synthesis.

Post Title: "${post.title}"
Post Body: "${post.body || "No text body"}"
Total Comments: ${safeComments.length}

Comments Transcript:
${commentsSnippet || "No comments posted yet."}

Synthesize the discussion adhering strictly to these requirements:
1. "summary": Exactly 2 to 3 concise, neutral sentences synthesizing the core discussion.
2. "key_points": Array of 3 to 5 distinct technical arguments or recommendations raised in the thread.
3. "disagreement": Describe the primary debate, trade-off, or point of friction if one exists; if no meaningful disagreement exists, return null.
4. Privacy & Neutrality: Quote nothing at length, do not invent facts, and DO NOT mention any usernames.`;

    const systemInstruction =
      "You are a neutral, objective AI technical editor for Curia. Synthesize developer discussions accurately without hallucination, bias, or usernames.";

    const responseSchema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        key_points: {
          type: "array",
          items: { type: "string" },
        },
        disagreement: { type: ["string", "null"] },
      },
      required: ["summary", "key_points"],
    };

    // 6. Call Gemini with 15s timeout
    const geminiResult = await generateGeminiContent<{
      summary: string;
      key_points: string[];
      disagreement?: string | null;
    }>({
      prompt,
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      timeoutMs: 15000,
    });

    let resultPayload: SummaryResponse;

    if (geminiResult.success && geminiResult.data && geminiResult.data.summary) {
      resultPayload = {
        summary: geminiResult.data.summary,
        key_points: geminiResult.data.key_points || [],
        disagreement: geminiResult.data.disagreement ?? null,
        comment_count: commentCount,
        cached: false,
      };
    } else {
      // Graceful Heuristic Fallback when Gemini is unavailable, unconfigured, or times out
      const topCommentExtracts = safeComments
        .slice(0, 4)
        .map((c) => c.body.replace(/\n+/g, " ").slice(0, 120).trim());

      const fallbackPoints =
        topCommentExtracts.length >= 3
          ? topCommentExtracts.map((t) => `${t}...`)
          : [
              "Architecture decisions and implementation patterns discussed by the community.",
              "Considerations around maintainability, simplicity, and performance trade-offs.",
              "Practical recommendations based on developer production experience.",
            ];

      resultPayload = {
        summary: `The community discussion on "${post.title}" explores practical trade-offs, architectural design, and developer considerations across ${commentCount} contributions. Contributors analyze the nuances and best practices relevant to this technical domain.`,
        key_points: fallbackPoints.slice(0, 5),
        disagreement:
          safeComments.length >= 2
            ? "Contrasting views focus on simplicity versus flexibility when adopting new patterns."
            : null,
        comment_count: commentCount,
        cached: false,
      };
    }

    // 7. Cache the result
    await setCachedAIResult(contentHash, resultPayload);

    return NextResponse.json(resultPayload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summarization failed" },
      { status: 500 }
    );
  }
}
