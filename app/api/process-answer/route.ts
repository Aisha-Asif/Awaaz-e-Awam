// POST /api/process-answer: extracts one field's value from a transcript, validates + normalizes it,
// and flags sensitive field types (cnic/phone/date) for the read-back confirmation.
import { NextRequest, NextResponse } from "next/server";
import { extractAnswer } from "@/lib/ai";
import { ProcessAnswerRequestSchema } from "@/lib/schemas";
import { getFieldValidator, requiresConfirmation } from "@/lib/validation";
import { isTypedOnlyType } from "@/lib/field-model";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = ProcessAnswerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing required fields in request." }, { status: 400 });
  }

  const { fieldId, fieldType, transcript, label, questionUrdu } = parsed.data;

  try {
    // CNIC, phone and date are typed by the user and parsed by our own validators below: they are never sent to an AI.
    const extraction = isTypedOnlyType(fieldType)
      ? { value: transcript.trim() }
      : await extractAnswer(fieldId, fieldType, label ?? fieldId, questionUrdu ?? "", transcript);

    const value = extraction.value ?? "";
    if (value.trim() === "") {
      return NextResponse.json({
        fieldId,
        value: null,
        valid: false,
        needsConfirmation: false,
        error: "The answer was unclear. Please provide it again.",
      });
    }

    const validate = getFieldValidator(fieldType);
    const result: { valid: boolean; normalized: string; error?: string } = validate(value);

    return NextResponse.json({
      fieldId,
      value: result.valid ? result.normalized : value,
      valid: result.valid,
      needsConfirmation: result.valid && requiresConfirmation(fieldType),
      error: result.valid ? null : (result.error ?? "Invalid value."),
    });
  } catch (err) {
    // Log the reason on the server only (the message never contains the user's answers).
    console.error("[process-answer]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not process this response. Please try again." }, { status: 500 });
  }
}
