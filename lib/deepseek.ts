import { FormSchema } from "@/lib/types";
import { MOCK_FORM_SCHEMA, getMockProcessAnswerResponse } from "@/lib/mock-data";
import { sanitizeFormSchema, sanitizeAnswer, sanitizeSpeech } from "@/lib/schemas";
import { SYSTEM_PROMPT, scanFormPrompt, answerPrompt, speechPrompt } from "@/lib/prompts";

const BASE_URL = "https://api.deepseek.com/chat/completions";
export const TEXT_MODEL = "deepseek-v4-flash";
export const VISION_MODEL = "deepseek-v4-flash-vision-exp";

const USE_MOCK = process.env.AI_MODE === "mock";

// ponytail: module-scoped running token total for this node process, so a full
// test run sums its own usage without any DB/telemetry. One log line per call.
const tokenTotals = { prompt: 0, completion: 0, total: 0 };

export function getTokenTotals() {
  return { ...tokenTotals };
}

interface ChatMessage {
  role: "system" | "user";
  content: unknown;
}

async function chat(messages: ChatMessage[], model: string, json: boolean): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set.");
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: false
  };
  if (json) {
    body.response_format = { type: "json_object" };
  }

  let response: Response;
  try {
    response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error("Could not reach the AI provider. Please try again.");
  }

  if (!response.ok) {
    throw new Error("Could not process this request. Please try again.");
  }

  const data = await response.json();

  const usage = data?.usage;
  if (usage) {
    const u = {
      prompt: usage.prompt_tokens ?? 0,
      completion: usage.completion_tokens ?? 0,
      total: usage.total_tokens ?? 0
    };
    tokenTotals.prompt += u.prompt;
    tokenTotals.completion += u.completion;
    tokenTotals.total += u.total;
    console.log(`[deepseek] ${model} tokens: prompt=${u.prompt} completion=${u.completion} total=${u.total}`);
    console.log(`[deepseek] running total: prompt=${tokenTotals.prompt} completion=${tokenTotals.completion} total=${tokenTotals.total}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("The AI provider returned an empty response.");
  }
  return text;
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

  const text = await chat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: scanFormPrompt() },
          { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } }
        ]
      }
    ],
    "deepseek-v4-flash-vision-exp",
    true
  );

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

  const text = await chat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: answerPrompt(fieldId, fieldType, label, questionUrdu, transcript) }
    ],
    TEXT_MODEL,
    true
  );

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

  const text = await chat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: speechPrompt(schemaLabel, fieldIds) }
    ],
    TEXT_MODEL,
    true
  );

  return sanitizeSpeech(parseJson(text));
}
