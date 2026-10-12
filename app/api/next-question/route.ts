import { NextRequest, NextResponse } from "next/server";
import { NextQuestionRequestSchema, SKIP_SENTINEL } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = NextQuestionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing required fields in request." }, { status: 400 });
  }

  const { fields, answers } = parsed.data;

  // Skip sentinels are client-local ("user chose not to answer this one") and
  // must never count as a real answer nor block the flow — they move the
  // interview forward and are never persisted or exported.
  const skipped = new Set<string>();
  const realAnswers: Record<string, string | null> = {};
  for (const [id, value] of Object.entries(answers)) {
    if (value === SKIP_SENTINEL) {
      skipped.add(id);
    } else {
      realAnswers[id] = value;
    }
  }

  for (const field of fields) {
    if (field.required && realAnswers[field.id] === undefined && !skipped.has(field.id)) {
      return NextResponse.json({
        nextField: field.id,
        questionUrdu: field.questionUrdu || null,
        complete: false,
      });
    }
  }

  for (const field of fields) {
    if (!field.required && realAnswers[field.id] === undefined && !skipped.has(field.id)) {
      return NextResponse.json({
        nextField: field.id,
        questionUrdu: field.questionUrdu || null,
        complete: false,
      });
    }
  }

  return NextResponse.json({
    nextField: null,
    questionUrdu: null,
    complete: true,
  });
}
