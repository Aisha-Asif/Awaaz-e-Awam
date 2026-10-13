// POST /api/process-speech: transcribes an audio clip (or takes a transcript), extracts as many
// fields as possible in one shot, and reports which required fields are still missing.
import { NextRequest, NextResponse } from "next/server";
import { extractSpeech } from "@/lib/ai";
import { transcribeAudio } from "@/lib/gemini-stt";
import { MOCK_FORM_SCHEMA } from "@/lib/mock-data";
import { getTemplate } from "@/lib/templates";

export const runtime = "nodejs";

const FORM_TITLES: Record<string, string> = {
  citizen: "Citizen Information Form",
};

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the request." }, { status: 400 });
  }

  // Prefer the raw audio file: transcribed via Gemini STT (DeepSeek has no
  // audio-STT endpoint). Fall back to a text `transcript` field for testing /
  // browser-STT paths.
  let transcript: string | null = null;

  const audio = formData.get("audio");
  if (audio && typeof audio !== "string" && typeof audio.arrayBuffer === "function") {
    try {
      const mimeType = (audio as File).type || "audio/webm";
      const buffer = Buffer.from(await audio.arrayBuffer());
      transcript = await transcribeAudio(mimeType, buffer);
    } catch {
      return NextResponse.json({ error: "Could not transcribe the audio. Please try again." }, { status: 500 });
    }
  }

  if (!transcript) {
    transcript = (formData.get("transcript") as string | null)?.trim() || null;
  }
  if (!transcript) {
    return NextResponse.json({ error: "No audio or transcript was provided." }, { status: 400 });
  }

  const formType = (formData.get("formType") as string | null) || "citizen";
  const templateId = (formData.get("templateId") as string | null) || null;
  const template = templateId ? getTemplate(templateId) : undefined;
  if (templateId && !template) {
    return NextResponse.json({ error: "Unknown form." }, { status: 400 });
  }
  const schema = template ? template.schema : MOCK_FORM_SCHEMA;

  // The person speaking is the applicant, so the one-shot extraction only covers
  // their fields; anyone else's (the attester) is asked about in the interview.
  const speakable = template
    ? schema.fields.filter((f) => !f.section || f.section.startsWith("Applicant"))
    : schema.fields;

  // The prompt only receives ids, so for a template spell out what each id means.
  // "presentCity" vs "permanentCity" is otherwise a guess.
  const formLabel = template
    ? `${template.title}. Field meanings: ${speakable.map((f) => `${f.id} = ${f.label}`).join("; ")}`
    : (FORM_TITLES[formType] ?? formType);

  try {
    const result = await extractSpeech(
      transcript,
      formLabel,
      speakable.map((f) => f.id),
    );

    const extracted: Record<string, string | null> = {};
    for (const field of schema.fields) {
      const value = result.extracted[field.id] ?? null;
      extracted[field.id] = value && value.trim() !== "" ? value : null;
    }

    const missingFields = schema.fields.filter((f) => f.required && !extracted[f.id]).map((f) => f.id);

    const followUpQuestion =
      missingFields.length > 0 ? (schema.fields.find((f) => f.id === missingFields[0])?.questionUrdu ?? null) : null;

    return NextResponse.json({
      transcript: result.transcript || transcript,
      extracted,
      validation: {
        valid: missingFields.length === 0,
        missingFields,
        invalidFields: [],
      },
      followUpQuestion,
    });
  } catch {
    return NextResponse.json({ error: "Could not process this response. Please try again." }, { status: 500 });
  }
}
