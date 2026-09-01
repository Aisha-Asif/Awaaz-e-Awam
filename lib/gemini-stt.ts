import { GoogleGenAI } from "@google/genai";

// ponytail: server-side Gemini STT — the only capability DeepSeek lacks. One
// function, mirrors lib/deepseek.ts env/mock/logging conventions.
export const STT_MODEL = "gemini-3.6-flash";

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

  let response;
  try {
    response = await ai.models.generateContent({
      model: STT_MODEL,
      contents: [
        {
          inlineData: {
            mimeType,
            data: data.toString("base64")
          }
        },
        "Transcribe the audio to text. Reply with the transcript only, no extra words."
      ]
    });
  } catch {
    throw new Error("Could not reach the speech-to-text provider. Please try again.");
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
