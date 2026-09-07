import { GoogleGenAI } from "@google/genai";
import { isNetworkError, errorStatus, RETRYABLE } from "@/lib/gemini-shared";

// ponytail: server-side Gemini STT — the only capability DeepSeek lacks. One
// function, mirrors lib/deepseek.ts env/mock/logging conventions.
export const STT_MODEL = "gemini-3.8-flash";
// ponytail: same failover as lib/gemini.ts
const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-3.5-flash"];

const USE_MOCK = process.env.AI_MODE === "mock";

const mockTranscripts: Record<string, string> = {
  "audio/webm": "Mera naam Ali Raza hai. Mere walid ka naam Ahmed Raza hai.",
  "audio/wav": "Mera naam Ali Raza hai. Mere walid ka naam Ahmed Raza hai."
};

export async function transcribeAudio(mimeType: string, data: Buffer): Promise<string> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1200));
    return mockTranscripts[mimeType] ?? "Mera naam Ali Raza hai.";
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // ponytail: try the primary STT model, failing over on retryable (5xx/429)
  // saturation, same as lib/gemini.ts. The SDK already retries per model.
  const models = [STT_MODEL, ...FALLBACK_MODELS];
  let lastStatus: number | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType,
              data: data.toString("base64")
            }
          },
          "Transcribe the audio faithfully into Urdu. Reply with the transcript in Urdu script (اردو) only — no Latin transliteration, no Devanagari, no extra words."
        ],
        config: {
          // ponytail: larger audio blobs can outlast Node's default body timeout.
          httpOptions: { timeout: 120000 }
        }
      });
    } catch (err) {
      const status = errorStatus(err);
      const retryable = (status !== null && RETRYABLE.has(status)) || isNetworkError(err);
      if (!retryable || i === models.length - 1) {
        console.error(`[gemini] STT call failed for ${model}:`, err instanceof Error ? err.message : err);
        throw new Error("Could not reach the speech-to-text provider. Please try again.");
      }
      lastStatus = status;
      console.log(`[gemini] STT ${model} unavailable (HTTP ${status}), failing over to ${models[i + 1]}`);
      continue;
    }

    const text = response?.text;
    if (typeof text !== "string" || text.trim().length === 0) {
      // ponytail: audio transcripts are richer in the audio part; fall back to
      // response text, then to mock-only empty. Upgrade to part.transcription if
      // we start needing word timings/speaker labels.
      throw new Error("Could not transcribe the audio. Please try again.");
    }

    return text.trim();
  }

  throw new Error(`The speech-to-text provider is temporarily unavailable (HTTP ${lastStatus ?? "?"}). Please try again.`);
}
