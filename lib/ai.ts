import * as deepseek from "@/lib/deepseek";
import * as gemini from "@/lib/gemini";

// ponytail: provider toggle so the app runs on Gemini (AI_PROVIDER=gemini)
// while DeepSeek is out of balance, and flips back with one env var.
const defaultProvider = process.env.DEEPSEEK_API_KEY && !process.env.GEMINI_API_KEY ? "deepseek" : "gemini";
const provider = (process.env.AI_PROVIDER || defaultProvider).toLowerCase();
if (provider !== "deepseek" && provider !== "gemini") {
  throw new Error(`Invalid AI_PROVIDER "${provider}". Use "deepseek" or "gemini".`);
}
const useGemini = provider === "gemini";

const active = () => (useGemini ? gemini : deepseek);

export const extractFormSchema = (imageDataUrl: string) =>
  active().extractFormSchema(imageDataUrl);

export const extractAnswer = (
  fieldId: string,
  fieldType: string,
  label: string,
  questionUrdu: string,
  transcript: string
) => active().extractAnswer(fieldId, fieldType, label, questionUrdu, transcript);

export const extractSpeech = (
  transcript: string,
  schemaLabel: string,
  fieldIds: string[]
) => active().extractSpeech(transcript, schemaLabel, fieldIds);

export const getActiveProvider = () => (useGemini ? "gemini" : "deepseek");