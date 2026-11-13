// Provider layer: the one contract every AI provider implements, plus the routers that pick a
// provider for the current DATA_PATH. Both routers call assertProviderAllowed first, so a request
// can never reach a provider that is forbidden on the path (lib/data-path.ts) — including the
// speech-to-text path, which previously bypassed the guard.
import type { FormSchema } from "@/lib/types";
import { assertProviderAllowed, getDataPath } from "@/lib/data-path";
import * as deepseek from "@/lib/deepseek";
import * as gemini from "@/lib/gemini";
import * as geminiStt from "@/lib/gemini-stt";
import * as groq from "@/lib/groq";

export type ExtractionProvider = {
  name: string;
  extractFormSchema(imageDataUrl: string): Promise<FormSchema>;
  extractAnswer(
    fieldId: string,
    fieldType: string,
    label: string,
    questionUrdu: string,
    transcript: string,
  ): Promise<{ value: string | null; needsConfirmation: boolean }>;
  extractSpeech(
    transcript: string,
    schemaLabel: string,
    fieldIds: string[],
  ): Promise<{ transcript: string; extracted: Record<string, string | null> }>;
};

export type SttProvider = {
  name: string;
  transcribeAudio(mimeType: string, data: Buffer): Promise<string>;
};

// Demo-path text/vision providers, chosen by AI_PROVIDER (default: whichever key is set).
// Computed once at load, as before.
const defaultProvider = process.env.DEEPSEEK_API_KEY && !process.env.GEMINI_API_KEY ? "deepseek" : "gemini";
const demoProviderName = (process.env.AI_PROVIDER || defaultProvider).toLowerCase();
if (demoProviderName !== "deepseek" && demoProviderName !== "gemini") {
  throw new Error(`Invalid AI_PROVIDER "${demoProviderName}". Use "deepseek" or "gemini".`);
}
const demoExtraction: ExtractionProvider = demoProviderName === "gemini" ? gemini : deepseek;

// Extraction provider for the current path: sensitive is Groq-only (fail closed); demo keeps the
// existing Gemini/DeepSeek selection.
export function getExtractionProvider(): ExtractionProvider {
  const provider = getDataPath() === "sensitive" ? groq : demoExtraction;
  assertProviderAllowed(provider.name);
  return provider;
}

// STT provider: Groq when a key is configured (primary, DECISIONS.md D7), else Gemini (fallback,
// demo only). On the sensitive path a missing key means the Gemini fallback is rejected by the
// guard, so the request fails closed rather than leaking audio.
export function getSttProvider(): SttProvider {
  const provider = process.env.GROQ_API_KEY ? groq : geminiStt;
  assertProviderAllowed(provider.name);
  return provider;
}
