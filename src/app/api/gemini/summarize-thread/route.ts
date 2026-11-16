import { NextResponse } from "next/server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini/client";

interface SummarizeRequest {
  title: string;
  content?: string | null;
  comments: Array<{
    author?: { username: string } | null;
    content: string;
    score: number;
    depth: number;
  }>;
}

export async function POST(request: Request) {
  try {
    const body: SummarizeRequest = await request.json();
    const { title, content, comments = [] } = body;

    const ai = getGeminiClient();

    if (ai) {
      const commentsSnippet = comments
        .slice(0, 30)
        .map(
          (c) =>
            `u/${c.author?.username || "user"} (score: ${c.score}, depth: ${c.depth}): ${c.content}`
        )
        .join("\n");

      const prompt = `You are Curia AI, an intelligent technical discussion summarizer for a developer forum.
Analyze this discussion thread and summarize it with technical precision.

Title: "${title}"
Post Content: "${content || "No text body"}"
Comments (${comments.length} total):
${commentsSnippet || "No comments yet."}

Return a valid JSON object strictly adhering to this structure:
{
  "summary": "A concise 2-3 sentence technical synthesis of the thread.",
  "keyPoints": [
    "Key technical argument or takeaway 1",
    "Key technical argument or takeaway 2",
    "Key technical argument or takeaway 3"
  ],
  "perspectives": [
    "Perspective A represented in the debate",
    "Perspective B or alternative recommendation"
  ],
  "sentiment": "constructive"
}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const responseText = response.text || "";
      // Strip markdown code fences if model wrapped response in ```json ... ```
      const cleaned = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      try {
        const parsed = JSON.parse(cleaned);
        return NextResponse.json(parsed);
      } catch {
        return NextResponse.json({
          summary: responseText,
          keyPoints: ["Detailed analysis provided by Gemini."],
          perspectives: ["Community discussion ongoing."],
          sentiment: "constructive",
        });
      }
    }

    // Heuristic synthesis fallback when GEMINI_API_KEY is not yet populated
    const commentCount = comments.length;
    const fallbackSummary = `The discussion centers around "${title}", focusing on practical trade-offs, architecture decisions, and implementation performance across ${commentCount} community contributions.`;

    const topComments = [...comments].sort((a, b) => b.score - a.score).slice(0, 3);
    const keyPoints =
      topComments.length > 0
        ? topComments.map((c) => `u/${c.author?.username || "user"}: "${c.content.slice(0, 110)}..."`)
        : [
            "Latency and developer ergonomics play a decisive role in tool choice.",
            "Structured schema constraints help mitigate runtime errors.",
            "Cost efficiency enables continuous multi-turn validation loops.",
          ];

    return NextResponse.json({
      summary: fallbackSummary,
      keyPoints,
      perspectives: [
        "Proponents emphasize rapid iteration and low latency.",
        "Others caution regarding error self-correction edge cases.",
      ],
      sentiment: "constructive",
      isFallback: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summarization failed" },
      { status: 500 }
    );
  }
}
