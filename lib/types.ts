export type FormFieldType =
  | "text"
  | "number"
  | "date"
  | "cnic"
  | "phone"
  | "address"
  | "select"
  | "checkbox"
  | "unknown";

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
  boundingBox?: BoundingBox;
};

export type FormSchema = {
  formTitle: string;
  fields: FormField[];
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

export type InterviewState = {
  form: FormSchema;
  answers: Record<string, string | null>;
  currentFieldId: string | null;
  completed: boolean;
};

export type AppMode = "home" | "speak" | "scan" | "interview" | "results";

export type RecordingState = "idle" | "recording" | "processing" | "success" | "error";