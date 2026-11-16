# Spec: Task 8 - Gemini AI Integrations

## Purpose
Integrate Google Gemini AI via the official `@google/genai` SDK on the server side to power three intelligence features:
1. **Thread Summarizer** (`/api/gemini/summarize-thread`): Distills long, multi-branch discussion trees into an executive TL;DR, consensus points, and divergent debate angles.
2. **Toxicity & Quality Pre-Check** (`/api/gemini/check-content`): Evaluates post draft for constructiveness, readability, spam indicators, and toxicity.
3. **Smart Community Suggester** (`/api/gemini/suggest-communities`): Recommends the most relevant Curia communities based on draft text.

## Inputs
- Environment variables:
  - `GEMINI_API_KEY`: Google AI Studio API key
  - `GEMINI_MODEL`: Model name (defaults to `gemini-2.5-flash`)
- Request payloads:
  - Summarize: `{ post: { title, content_text }, comments: { author, content, score, depth }[] }`
  - Quality Check: `{ title, content, type }`
  - Community Suggestion: `{ title, content }`

## Outputs
- `src/lib/gemini/client.ts`: Server-only Google Gen AI helper configuring the model name (`process.env.GEMINI_MODEL || "gemini-2.5-flash"`).
- Route Handlers:
  - `src/app/api/gemini/summarize-thread/route.ts`
  - `src/app/api/gemini/check-content/route.ts`
  - `src/app/api/gemini/suggest-communities/route.ts`
- Client Components:
  - `src/components/gemini/thread-summarizer.tsx`: Interactive AI summary banner with collapsible view, glowing violet border, and bulleted takeaways.
  - Integration into post detail page (`/c/[community]/comments/[id]`) and submit page (`/submit`).

## Edge Cases
- **Missing or Invalid API Key**: If `GEMINI_API_KEY` is not configured or fails, the handler falls back to an intelligent, realistic heuristic synthesis so portfolio reviewers can test the user interface zero-config.
- **Large Threads Context Window**: Deep comment trees with dozens of comments are sanitized and summarized efficiently without token bloat.
- **Structured JSON Adherence**: Prompts explicitly request clean markdown or JSON formatting.

## Acceptance Criteria
1. Server route handlers only invoke `@google/genai` in Node.js server runtime.
2. Thread summarizer produces bulleted consensus and debate breakdown.
3. Content check flags abusive text and approves constructive technical content.
4. `npm run build` and `npm run lint` succeed with zero errors.
