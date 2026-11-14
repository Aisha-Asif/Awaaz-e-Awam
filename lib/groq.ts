// Groq provider: OpenAI-compatible API used for speech-to-text (Whisper) and text extraction.
// It is the only provider allowed on DATA_PATH=sensitive (DECISIONS.md D7/D9): it does not train
// on submitted data, so it is the sole LLM on the real-PII path. Mirrors the lib/gemini.ts
// contract (same functions, same mock behaviour) so lib/provider.ts can pick either.
import { FormSchema } from "@/lib/types";
import { MOCK_FORM_SCHEMA, getMockProcessAnswerResponse } from "@/lib/mock-data";
import { sanitizeAnswer, sanitizeSpeech } from "@/lib/schemas";
import { SYSTEM_PROMPT, answerPrompt, speechPrompt } from "@/lib/prompts";

export const name = "groq";

export const STT_MODEL = "whisper-large-v3";
export const CHAT_MODEL = "openai/gpt-oss-120b";

const BASE_URL = "https://api.groq.com/openai/v1";
const USE_MOCK = process.env.AI_MODE === "mock";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockTranscripts: Record<string, string> = {
  "audio/webm": "Mera naam Ali Raza hai. Mere walid ka naam Ahmed Raza hai.",
  "audio/wav": "Mera naam Ali Raza hai. Mere walid ka naam Ahmed Raza hai.",
};

// Audio mime type -> file extension for the multipart upload (Groq accepts these formats).
const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/flac": "flac",
};

function apiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not set.");
  }
  return key;
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Could not parse the AI response.");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

// ponytail: no retry/backoff on 429 yet — free-tier limits are unknown until we see real
// traffic. Add a retry loop (like lib/gemini.ts) if evals show throttling.
async function chatJson(userPrompt: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq chat request failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("The AI provider returned an empty response.");
  }
  return text;
}

// Transcribes an audio buffer to Urdu text with Groq Whisper.
export async function transcribeAudio(mimeType: string, data: Buffer): Promise<string> {
  if (USE_MOCK) {
    await sleep(1200);
    return mockTranscripts[mimeType] ?? "Mera naam Ali Raza hai.";
  }

  const form = new FormData();
  // ponytail: copy the Buffer into a plain Uint8Array — Buffer<ArrayBufferLike> isn't a BlobPart.
  form.append("file", new Blob([new Uint8Array(data)], { type: mimeType }), `audio.${EXTENSIONS[mimeType] ?? "webm"}`);
  form.append("model", STT_MODEL);
  // Urdu improves accuracy/latency; the prompt biases output to Urdu script over Latin.
  form.append("language", "ur");
  form.append("response_format", "json");
  form.append("prompt", "اردو میں نقل کریں۔");

  const res = await fetch(`${BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq transcription failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
  }

  const payload = (await res.json()) as { text?: string };
  const text = payload.text?.trim();
  if (!text) {
    throw new Error("Could not transcribe the audio. Please try again.");
  }
  return text;
}

// Extracts one field's value from a transcript (mock mode regex-matches digits).
export async function extractAnswer(
  fieldId: string,
  fieldType: string,
  label: string,
  questionUrdu: string,
  transcript: string,
): Promise<{ value: string | null; needsConfirmation: boolean }> {
  if (USE_MOCK) {
    await sleep(300);
    const v = transcript.trim();
    if (fieldType === "cnic") {
      const m = v.match(/(\d{5}[-\s]?\d{7}[-\s]?\d{1})|(\d{13})/);
      return { value: m ? m[0].replace(/[\s-]/g, "") : null, needsConfirmation: true };
    }
    if (fieldType === "phone") {
      const m = v.match(/(?:0|\+92|92)?[\s-]?3\d{2}[\s-]?\d{7}/);
      return { value: m ? m[0].replace(/[\s-]/g, "") : null, needsConfirmation: true };
    }
    if (fieldType === "date") {
      const m = v.match(/\d{1,2}[\/\-\s]\d{1,2}[\/\-\s]\d{4}/);
      if (m) {
        const [d, mo, y] = m[0].split(/[\/\-\s]/);
        return { value: `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`, needsConfirmation: true };
      }
      return { value: null, needsConfirmation: true };
    }
    return { value: v || null, needsConfirmation: false };
  }

  const text = await chatJson(answerPrompt(fieldId, fieldType, label, questionUrdu, transcript));
  const raw = sanitizeAnswer(parseJson(text), fieldId);
  return { value: raw.value, needsConfirmation: raw.needsConfirmation };
}

// Extracts as many fields as possible from a natural monologue.
export async function extractSpeech(
  transcript: string,
  schemaLabel: string,
  fieldIds: string[],
): Promise<{ transcript: string; extracted: Record<string, string | null> }> {
  if (USE_MOCK) {
    await sleep(1200);
    const extracted: Record<string, string | null> = {};
    for (const field of MOCK_FORM_SCHEMA.fields) {
      extracted[field.id] = getMockProcessAnswerResponse(field.id, transcript).value;
    }
    return { transcript, extracted };
  }

  const text = await chatJson(speechPrompt(schemaLabel, fieldIds, transcript));
  return sanitizeSpeech(parseJson(text));
}

// Reading a form image needs a vision model, which this path does not use. Scan stays on the
// demo path until on-device OCR lands (Phase 2), so the sensitive path fails closed here.
export async function extractFormSchema(_imageDataUrl: string): Promise<FormSchema> {
  if (USE_MOCK) {
    await sleep(900);
    return MOCK_FORM_SCHEMA;
  }
  throw new Error("Scanning a form image is not available on the sensitive data path.");
}
