import { GoogleGenAI } from "@google/genai";

// Standard Resilient Fallback Ladder ordered by latency and model availability
export const MODEL_FALLBACK_LADDER = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash"
];

let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set. Using local dummy client if available.");
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiClient;
}

export interface GenerationOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}

export async function generateContentWithFallback(
  prompt: string | Array<{ role: string; parts: Array<{ text: string }> }>,
  options: GenerationOptions = {}
): Promise<{ text: string; modelUsed: string }> {
  const ai = getAiClient();

  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      let contents: any;
      if (typeof prompt === "string") {
        contents = prompt;
      } else {
        contents = prompt;
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
          responseMimeType: options.responseMimeType,
        }
      });

      const text = response.text || "";
      if (text.trim().length > 0) {
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.status || err?.statusCode || err?.code;
      console.warn(`[Gemini Fallback] Model ${model} failed with status: ${statusCode || err?.message}. Trying next fallback.`);
      // Continue to next model in ladder for 503, 429, 404, 500, or network timeouts
      continue;
    }
  }

  throw lastError || new Error("All Gemini models in fallback ladder failed.");
}
