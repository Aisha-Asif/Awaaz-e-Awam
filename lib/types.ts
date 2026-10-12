export type FormFieldType =
  "text" | "number" | "date" | "cnic" | "phone" | "address" | "select" | "checkbox" | "unknown";

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  questionUrdu: string;
  questionEnglish?: string;
  // Normalized 0-1 on the form image. For a template this is the write area:
  // the empty part of the printed box, clear of the printed label.
  boundingBox?: BoundingBox;
  // Groups fields when one form covers several people or blocks (applicant, attester).
  section?: string;
};

export type FormSchema = {
  formTitle: string;
  fields: FormField[];
};

// A form we have already mapped and checked by hand: schema plus the page image
// the answers get drawn onto.
export type FormTemplate = {
  id: string;
  title: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  schema: FormSchema;
};

export type Answer = {
  fieldId: string;
  value: string | null;
};

export type ValidationError = {
  fieldId: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  missingFields: string[];
  invalidFields: ValidationError[];
};

export type ProcessAnswerResponse = {
  fieldId: string;
  value: string | null;
  valid: boolean;
  needsConfirmation: boolean;
  error: string | null;
};

export type NextQuestionResponse = {
  nextField: string | null;
  questionUrdu: string | null;
  complete: boolean;
};

export type ProcessSpeechResponse = {
  transcript: string;
  extracted: Record<string, string | null>;
  validation: ValidationResult;
  followUpQuestion: string | null;
};
