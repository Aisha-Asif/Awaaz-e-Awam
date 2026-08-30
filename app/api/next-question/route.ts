import { NextRequest, NextResponse } from "next/server";
import { NextQuestionRequestSchema } from "@/lib/schemas";

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

  for (const field of fields) {
    if (field.required && !answers[field.id]) {
      return NextResponse.json({
        nextField: field.id,
        questionUrdu: field.questionUrdu || null,
        complete: false
      });
    }
  }

  for (const field of fields) {
    if (!field.required && !answers[field.id]) {
      return NextResponse.json({
        nextField: field.id,
        questionUrdu: field.questionUrdu || null,
        complete: false
      });
    }
  }

  return NextResponse.json({
    nextField: null,
    questionUrdu: null,
    complete: true
  });
}
