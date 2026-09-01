import { NextRequest, NextResponse } from "next/server";
import { extractSpeech } from "@/lib/deepseek";
import { transcribeAudio } from "@/lib/gemini-stt";
import { MOCK_FORM_SCHEMA } from "@/lib/mock-data";

export const runtime = "nodejs";

const FORM_TITLES: Record<string, string> = {
  citizen: "Citizen Information Form"
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
      return NextResponse.json(
        { error: "Could not transcribe the audio. Please try again." },
        { status: 500 }
      );
    }
  }

  if (!transcript) {
    transcript = (formData.get("transcript") as string | null)?.trim() || null;
  }
  if (!transcript) {
    return NextResponse.json({ error: "No audio or transcript was provided." }, { status: 400 });
  }

  const formType = (formData.get("formType") as string | null) || "citizen";
  const schema = MOCK_FORM_SCHEMA;

  try {
    const result = await extractSpeech(transcript, FORM_TITLES[formType] ?? formType, schema.fields.map((f) => f.id));

    const extracted: Record<string, string | null> = {};
    for (const field of schema.fields) {
      const value = result.extracted[field.id] ?? null;
      extracted[field.id] = value && value.trim() !== "" ? value : null;
    }

    const missingFields = schema.fields.filter((f) => f.required && !extracted[f.id]).map((f) => f.id);

    const followUpQuestion =
      missingFields.length > 0
        ? schema.fields.find((f) => f.id === missingFields[0])?.questionUrdu ?? null
        : null;

    return NextResponse.json({
      transcript: result.transcript || transcript,
      extracted,
      validation: {
        valid: missingFields.length === 0,
        missingFields,
        invalidFields: []
      },
      followUpQuestion
    });
  } catch {
    return NextResponse.json({ error: "Could not process this response. Please try again." }, { status: 500 });
  }
}
