import { NextRequest, NextResponse } from "next/server";
import { extractSpeech } from "@/lib/deepseek";
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

  // ponytail: DeepSeek has no audio-transcription endpoint, so for now the
  // frontend sends the browser STT transcript as text. The raw `audio` file is
  // accepted but unused until we confirm the transcript-based contract with
  // Agent 2 (API_CONTRACT §6 / §20 change for tomorrow).
  const transcript = (formData.get("transcript") as string | null)?.trim();
  if (!transcript) {
    return NextResponse.json({ error: "No transcript was provided." }, { status: 400 });
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
