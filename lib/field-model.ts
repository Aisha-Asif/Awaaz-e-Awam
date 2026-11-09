// Field model helpers: how each field type is collected (inputMode) and written on paper (printFormat).
// A field may override either explicitly; otherwise the default follows from its type, so CNIC / phone / date are
// always typed (never spoken or sent to an AI) unless a template deliberately says otherwise.
import type { FieldInputMode, FormField, FormFieldType, PrintFormat } from "@/lib/types";

// Types that must be typed: digit-heavy private values that never need an AI to parse.
const TYPED_ONLY_TYPES: readonly FormFieldType[] = ["cnic", "phone", "date"];

// Types picked from a short list instead of free text.
const CHOICE_TYPES: readonly FormFieldType[] = ["select", "checkbox"];

// Default way to collect a field of this type.
export function defaultInputMode(type: FormFieldType): FieldInputMode {
  if (TYPED_ONLY_TYPES.includes(type)) return "type";
  if (CHOICE_TYPES.includes(type)) return "choice";
  return "voice-or-type";
}

// Default way to write a field of this type on paper.
export function defaultPrintFormat(type: FormFieldType): PrintFormat {
  if (type === "cnic") return "cnic-dashes";
  if (type === "date") return "date-dmy";
  return "plain";
}

// The field's effective input mode: its own override, else the default for its type.
export function inputModeOf(field: Pick<FormField, "type" | "inputMode">): FieldInputMode {
  return field.inputMode ?? defaultInputMode(field.type);
}

// The field's effective print format: its own override, else the default for its type.
export function printFormatOf(field: Pick<FormField, "type" | "printFormat">): PrintFormat {
  return field.printFormat ?? defaultPrintFormat(field.type);
}

// The label to show in the given language, falling back to the English label when no Urdu label exists.
export function labelFor(field: Pick<FormField, "label" | "labelUr">, lang: "en" | "ur"): string {
  return lang === "ur" ? (field.labelUr ?? field.label) : field.label;
}
