import { GoogleGenAI } from "@google/genai";

if (typeof window !== "undefined") {
  throw new Error("SECURITY VIOLATION: src/lib/gemini/client.ts must only be loaded on the server.");
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key) && !key?.includes("placeholder") && key !== "";
}

export function getGeminiClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

export interface GeminiCallOptions {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: unknown;
  timeoutMs?: number;
}

export interface GeminiCallResult<T = unknown> {
  success: boolean;
  data?: T;
  rawText?: string;
  error?: string;
  isTimeout?: boolean;
}

/**
 * Execute a Gemini generation call with strict 15s timeout, structured JSON extraction,
 * and comprehensive error catching to guarantee graceful degradation.
 */
export async function generateGeminiContent<T = unknown>(
  options: GeminiCallOptions
): Promise<GeminiCallResult<T>> {
  const client = getGeminiClient();
  if (!client) {
    return {
      success: false,
      error: "Gemini API key is not configured",
    };
  }

  const timeoutMs =
    options.timeoutMs ??
    (process.env.GEMINI_TIMEOUT_MS ? parseInt(process.env.GEMINI_TIMEOUT_MS, 10) : 15000);

  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<GeminiCallResult<T>>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Gemini call timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const config: Record<string, unknown> = {};
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options.responseMimeType) {
      config.responseMimeType = options.responseMimeType;
    }
    if (options.responseSchema) {
      config.responseSchema = options.responseSchema;
    }

    const apiCall = client.models.generateContent({
      model: GEMINI_MODEL,
      contents: options.prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    const result = (await Promise.race([apiCall, timeoutPromise])) as { text?: string };
    if (timer) clearTimeout(timer);

    const rawText = result.text || "";

    if (options.responseMimeType === "application/json" || options.responseSchema) {
      try {
        const cleaned = rawText
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned) as T;
        return { success: true, data: parsed, rawText };
      } catch {
        return {
          success: false,
          rawText,
          error: "Failed to parse structured JSON response from Gemini",
        };
      }
    }

    return { success: true, rawText, data: rawText as unknown as T };
  } catch (err: unknown) {
    if (timer) clearTimeout(timer);
    const message = err instanceof Error ? err.message : "Unknown Gemini API error";
    const isTimeout = message.toLowerCase().includes("timed out");
    return {
      success: false,
      error: message,
      isTimeout,
    };
  }
}
