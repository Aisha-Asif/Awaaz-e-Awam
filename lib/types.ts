// Shared domain types: form schema, templates, answer/validation records, and API response shapes.
export type FormFieldType =
  "text" | "number" | "date" | "cnic" | "phone" | "address" | "select" | "checkbox" | "unknown";

// How the interview collects a field: "type" = typed only (never spoken or sent to an AI; used for CNIC/phone/date),
// "voice-or-type" = spoken or typed free text, "choice" = pick from a short list (gender, marital status).
export type FieldInputMode = "type" | "voice-or-type" | "choice";

// How a stored value is written on the paper form.
export type PrintFormat = "cnic-dashes" | "date-dmy" | "plain";

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FormField = {
  id: string;
  label: string;
  // Urdu-script label for bilingual display (optional; falls back to `label`).
  labelUr?: string;
  type: FormFieldType;
  // Optional overrides; when omitted, defaultInputMode / defaultPrintFormat (lib/field-model.ts) derive them from `type`.
  inputMode?: FieldInputMode;
  printFormat?: PrintFormat;
  // Allowed values for a "choice" field (e.g. gender). A choice field without options falls back to voice-or-type.
  options?: string[];
  required: boolean;
  questionUrdu: string;
  questionEnglish?: string;
  // Normalized 0-1 on the form image. For a template this is the write area:
  // the empty part of the printed box, clear of the printed label.
  boundingBox?: BoundingBox;
  // Extra write areas that receive the same answer (a form that prints one detail in two places, e.g. in Urdu and in
  // English). Normalized 0-1 like boundingBox.
  extraBoxes?: BoundingBox[];
  // For a choice field printed as tick boxes: the box to tick for each option (option text -> normalized box).
  ticks?: Record<string, BoundingBox>;
  // Horizontal alignment of the written text inside its box (default left).
  align?: "left" | "center";
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
  // One or two sentences shown in the list of available forms.
  description?: string;
  // Things the user should know before filling the form (shown in the app, never printed on the form).
  notes?: string[];
  // Parts of the form the app never fills in (signatures, thumb impressions, stamps, office use). They stay blank on the
  // printout and are listed in the app so the user can complete them by hand.
  leaveBlank?: string[];
  // For a form with several people, the sections the speaker can describe in one go. Other sections are asked in the
  // interview. When omitted, every field can be spoken.
  speechSections?: string[];
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
