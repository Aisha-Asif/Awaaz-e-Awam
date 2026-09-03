import { NextRequest, NextResponse } from "next/server";
import { extractAnswer } from "@/lib/ai";
import { ProcessAnswerRequestSchema } from "@/lib/schemas";
import { getFieldValidator, requiresConfirmation } from "@/lib/validation";

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

  const { fieldId, fieldType, transcript } = parsed.data;

  try {
    const extraction = await extractAnswer(fieldId, fieldType, fieldId, "", transcript);

    const value = extraction.value ?? "";
    if (value.trim() === "") {
      return NextResponse.json({
        fieldId,
        value: null,
        valid: false,
        needsConfirmation: false,
        error: "The answer was unclear. Please provide it again."
      });
    }

    const validate = getFieldValidator(fieldType);
    const result: { valid: boolean; normalized: string; error?: string } = validate(value);

    return NextResponse.json({
      fieldId,
      value: result.valid ? result.normalized : value,
      valid: result.valid,
      needsConfirmation: result.valid && requiresConfirmation(fieldType),
      error: result.valid ? null : (result.error ?? "Invalid value.")
    });
  } catch {
    return NextResponse.json({ error: "Could not process this response. Please try again." }, { status: 500 });
  }
}
