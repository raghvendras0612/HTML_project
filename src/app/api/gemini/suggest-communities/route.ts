import { NextResponse } from "next/server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini/client";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";

interface SuggestRequest {
  title: string;
  content?: string | null;
}

export async function POST(request: Request) {
  try {
    const body: SuggestRequest = await request.json();
    const { title, content = "" } = body;

    const availableCommunities = MOCK_COMMUNITIES.map((c) => ({
      name: c.name,
      title: c.title,
      description: c.description,
    }));

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are Curia Community Matchmaker. Given this draft post, recommend the top 2-3 most relevant communities from the available list.

Available Communities:
${JSON.stringify(availableCommunities, null, 2)}

Draft Post:
Title: "${title}"
Content: "${content || ""}"

Return a strictly valid JSON object:
{
  "suggestions": [
    {
      "name": "community_name",
      "reason": "Why this community is an exact fit",
      "confidence": 0.95
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const responseText = response.text || "";
      const cleaned = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      try {
        const parsed = JSON.parse(cleaned);
        return NextResponse.json(parsed);
      } catch {
        // Fallback if parsing fails
      }
    }

    // Heuristic suggestions fallback
    const combined = `${title} ${content}`.toLowerCase();
    const suggestions = [];

    if (combined.includes("ai") || combined.includes("model") || combined.includes("llm")) {
      suggestions.push({
        name: "ai_engineers",
        reason: "Matches machine learning, reasoning models, and agent architectures.",
        confidence: 0.96,
      });
    }

    if (combined.includes("type") || combined.includes("ts") || combined.includes("interface")) {
      suggestions.push({
        name: "typescript",
        reason: "Focuses on static typing, compiler mechanics, and language ergonomics.",
        confidence: 0.92,
      });
    }

    if (combined.includes("design") || combined.includes("token") || combined.includes("css") || combined.includes("ui")) {
      suggestions.push({
        name: "design_systems",
        reason: "Discusses design tokens, accessibility, and visual consistency.",
        confidence: 0.88,
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        name: "webdev",
        reason: "General web technologies, backend, and frontend development.",
        confidence: 0.85,
      });
    }

    return NextResponse.json({
      suggestions,
      isFallback: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Suggestion failed" },
      { status: 500 }
    );
  }
}
