import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { FormSchema } from "@/lib/types";
import { MOCK_FORM_SCHEMA, getMockProcessAnswerResponse } from "@/lib/mock-data";
import { sanitizeFormSchema, sanitizeAnswer, sanitizeSpeech } from "@/lib/schemas";
import { SYSTEM_PROMPT, scanFormPrompt, answerPrompt, speechPrompt } from "@/lib/prompts";
import { isNetworkError, errorStatus, RETRYABLE } from "@/lib/gemini-shared";

// ponytail: server-side Gemini text/vision client, mirroring lib/deepseek.ts so
// the app can run on Gemini (AI_PROVIDER=gemini) while DeepSeek is out of
// balance. Audio STT lives in lib/gemini-stt.ts.
export const AI_MODEL = "gemini-3.8-flash";
// ponytail: fallback models in case primary model encounters capacity issues
const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-3.5-flash"];

const USE_MOCK = process.env.AI_MODE === "mock";

// ponytail: module-scoped running token total, same pattern as deepseek.ts.
const tokenTotals = { prompt: 0, completion: 0, total: 0 };

export function getTokenTotals() {
  return { ...tokenTotals };
}

type Part =
  | string
  | { inlineData: { mimeType: string; data: string } }
  | { text: string };

function logUsage(model: string, usage: { promptTokens?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined) {
  if (!usage) return;
  const u = {
    prompt: usage.promptTokens ?? 0,
    completion: usage.candidatesTokenCount ?? 0,
    total: usage.totalTokenCount ?? (usage.promptTokens ?? 0) + (usage.candidatesTokenCount ?? 0)
  };
  tokenTotals.prompt += u.prompt;
  tokenTotals.completion += u.completion;
  tokenTotals.total += u.total;
  console.log(`[gemini] ${model} tokens: prompt=${u.prompt} completion=${u.completion} total=${u.total}`);
  console.log(`[gemini] running total: prompt=${tokenTotals.prompt} completion=${tokenTotals.completion} total=${tokenTotals.total}`);
}

async function generateJson(parts: Part[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // ponytail: try the primary model, then fall back on retryable (5xx/429)
  // saturation. The SDK already retries each model ~5x internally; this loop
  // adds cross-model failover on top. Non-retryable errors fail immediately.
  const models = [AI_MODEL, ...FALLBACK_MODELS];
  let lastStatus: number | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents: parts,
        config: {
          responseMimeType: "application/json",
          // ponytail: large image uploads can blow past Node's default body
          // timeout and abort as `fetch failed`; give big payloads room to finish.
          httpOptions: { timeout: 120000 }
        }
      });
    } catch (err) {
      const status = errorStatus(err);
      const retryable = (status !== null && RETRYABLE.has(status)) || isNetworkError(err);
      if (!retryable || i === models.length - 1) {
        console.error(`[gemini] call failed for ${model}:`, err instanceof Error ? err.message : err);
        throw new Error("Could not reach the AI provider. Please try again.");
      }
      lastStatus = status;
      console.log(`[gemini] ${model} unavailable (HTTP ${status}), failing over to ${models[i + 1]}`);
      continue;
    }

    logUsage(model, response?.usageMetadata);

    const text = response?.text;
    if (typeof text !== "string" || text.length === 0) {
      throw new Error("The AI provider returned an empty response.");
    }
    return text;
  }

  throw new Error(`The AI provider is temporarily unavailable (HTTP ${lastStatus ?? "?"}). Please try again.`);
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Image must be a base64 data-URL like "data:image/jpeg;base64,..."
export async function extractFormSchema(imageDataUrl: string): Promise<FormSchema> {
  if (USE_MOCK) {
    await sleep(900);
    return MOCK_FORM_SCHEMA;
  }

  const base64 = imageDataUrl.includes(",") ? imageDataUrl.split(",")[1] : imageDataUrl;

  // ponytail: downscale before sending — phone photos (up to ~10MiB base64)
  // exceed Gemini's inline input budget and time out; cap longest edge at 1024px.
  const buffer = Buffer.from(base64, "base64");
  const resized = await sharp(buffer)
    .rotate()
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const text = await generateJson([
    { inlineData: { mimeType: "image/jpeg", data: resized.toString("base64") } },
    scanFormPrompt()
  ]);

  return sanitizeFormSchema(parseJson(text));
}

export async function extractAnswer(
  fieldId: string,
  fieldType: string,
  label: string,
  questionUrdu: string,
  transcript: string
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

  const text = await generateJson([
    `${SYSTEM_PROMPT}\n\n${answerPrompt(fieldId, fieldType, label, questionUrdu, transcript)}`
  ]);

  const raw = sanitizeAnswer(parseJson(text), fieldId);
  return { value: raw.value, needsConfirmation: raw.needsConfirmation };
}

export async function extractSpeech(
  transcript: string,
  schemaLabel: string,
  fieldIds: string[]
): Promise<{ transcript: string; extracted: Record<string, string | null> }> {
  if (USE_MOCK) {
    await sleep(1200);
    const extracted: Record<string, string | null> = {};
    for (const field of MOCK_FORM_SCHEMA.fields) {
      const r = getMockProcessAnswerResponse(field.id, transcript);
      extracted[field.id] = r.value;
    }
    return { transcript, extracted };
  }

  const text = await generateJson([
    `${SYSTEM_PROMPT}\n\n${speechPrompt(schemaLabel, fieldIds, transcript)}`
  ]);

  return sanitizeSpeech(parseJson(text));
}