import { z } from "zod";

const FormFieldTypeSchema = z.enum([
  "text",
  "number",
  "date",
  "cnic",
  "phone",
  "address",
  "select",
  "checkbox",
  "unknown"
]);

const BoundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
});

// ---------------------------------------------------------------------------
// Request body schemas
// ---------------------------------------------------------------------------

export const ProcessAnswerRequestSchema = z.object({
  fieldId: z.string().min(1),
  fieldType: FormFieldTypeSchema,
  transcript: z.string().min(1)
});

export type ProcessAnswerRequest = z.infer<typeof ProcessAnswerRequestSchema>;

const FormFieldInputSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  type: FormFieldTypeSchema.optional().default("unknown"),
  required: z.boolean().optional().default(false),
  questionUrdu: z.string().optional().default(""),
  questionEnglish: z.string().optional(),
  boundingBox: BoundingBoxSchema.optional()
});

export const NextQuestionRequestSchema = z.object({
  fields: z.array(FormFieldInputSchema).min(1),
  answers: z.record(z.string().nullable())
});

export type NextQuestionRequest = z.infer<typeof NextQuestionRequestSchema>;

// ---------------------------------------------------------------------------
// Output validators + sanitizers for DeepSeek's returned JSON.
// DeepSeek's response_format only guarantees valid JSON, not shape, so we
// validate and coerce here.
// ---------------------------------------------------------------------------

const FIELD_TYPE_SET = new Set<string>(FormFieldTypeSchema.options);
export type SanitizedFieldType = z.infer<typeof FormFieldTypeSchema>;

function slugId(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+([a-z0-9])/g, (_, c) => c.toUpperCase())
    .replace(/\s+/g, "");

  if (/^[a-z][a-z0-9]*$/.test(cleaned)) return cleaned;
  return "";
}

const RawFormFieldSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  type: z.string().optional(),
  required: z.boolean().optional(),
  questionUrdu: z.string().optional(),
  questionEnglish: z.string().optional(),
  boundingBox: BoundingBoxSchema.optional()
});

const RawFormSchema = z.object({
  formTitle: z.string().optional(),
  fields: z.array(RawFormFieldSchema).optional().default([])
});

export function sanitizeFormSchema(data: unknown) {
  const parsed = RawFormSchema.parse(data);
  const seen = new Set<string>();

  const fields: {
    id: string;
    label: string;
    type: SanitizedFieldType;
    required: boolean;
    questionUrdu: string;
    questionEnglish?: string;
    boundingBox?: z.infer<typeof BoundingBoxSchema>;
  }[] = parsed.fields
    .map((f) => ({
      id: slugId(f.id),
      label: f.label ?? f.id,
      type: (FIELD_TYPE_SET.has(f.type ?? "") ? f.type : "unknown") as SanitizedFieldType,
      required: f.required ?? false,
      questionUrdu: f.questionUrdu ?? "",
      questionEnglish: f.questionEnglish,
      boundingBox: f.boundingBox
    }))
    .filter((f) => f.id !== "" && !seen.has(f.id) && seen.add(f.id));

  return {
    formTitle: parsed.formTitle ?? "Detected Form",
    fields
  };
}

const RawAnswerSchema = z.object({
  fieldId: z.string().optional(),
  value: z.string().nullable().optional(),
  valid: z.boolean().optional(),
  needsConfirmation: z.boolean().optional(),
  error: z.string().nullable().optional()
});

export function sanitizeAnswer(data: unknown, fieldId: string) {
  const parsed = RawAnswerSchema.parse(data);
  return {
    fieldId: parsed.fieldId ?? fieldId,
    value: parsed.value ?? null,
    valid: parsed.valid ?? false,
    needsConfirmation: parsed.needsConfirmation ?? false,
    error: parsed.error ?? null
  };
}

const RawSpeechSchema = z.object({
  transcript: z.string().optional().default(""),
  extracted: z.record(z.string().nullable()).optional().default({})
});

export function sanitizeSpeech(data: unknown) {
  return RawSpeechSchema.parse(data);
}
