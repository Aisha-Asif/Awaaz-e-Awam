// Template registry: buildTemplate compiles a raw cell layout into fillable FormFields
// (normalized 0-1 coordinates); templates ship as JSON and are resolved by id.
import nadraAttester from "./nadra-attester-smartid.json";
import birthRegistration from "./birth-registration.json";
import citizenConfirmation from "./citizen-confirmation.json";
import marriageRegistration from "./marriage-registration.json";
import type { BoundingBox, FormField, FormFieldType, FormSchema, FormTemplate } from "@/lib/types";
import { defaultInputMode, defaultPrintFormat } from "@/lib/field-model";

// A rectangle in page pixels.
export type RawRect = { x: number; y: number; w: number; h: number };

// One field as written in a template JSON file. Everything about position is in page pixels.
export type RawField = {
  id: string;
  label: string;
  labelUr?: string;
  options?: string[];
  type: string;
  required: boolean;
  section?: string;
  // The whole printed cell. The write area is the cell minus the printed label (see buildTemplate).
  // Optional: a field printed only as tick boxes has no text area.
  cell?: RawRect;
  labelSide?: string;
  labelWidth?: number;
  // Extra write areas, already free of any label, that receive the same answer (e.g. an Urdu and an English block).
  mirrors?: RawRect[];
  // For choice fields printed as tick boxes: one box per option.
  ticks?: { option: string; box: RawRect }[];
  align?: "left" | "center";
  questionUrdu: string;
  questionRoman?: string;
  questionEnglish?: string;
};

export type RawTemplate = {
  id: string;
  title: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  description?: string;
  notes?: string[];
  leaveBlank?: string[];
  speechSections?: string[];
  fields: RawField[];
};

// Template JSON stores each field's whole printed cell in page pixels, plus which
// side the printed label sits on and how wide it is. The write area (where ink
// goes) is the cell minus the label, converted to 0-1 so it survives any scale.
const CELL_PAD = 6;

// Compiles one raw template JSON into a FormTemplate (write areas, normalized boxes).
export function buildTemplate(raw: RawTemplate): FormTemplate {
  const { imageWidth: W, imageHeight: H } = raw;
  const toBox = (r: RawRect): BoundingBox => ({ x: r.x / W, y: r.y / H, width: r.w / W, height: r.h / H });

  const fields: FormField[] = raw.fields.map((f) => {
    const type = f.type as FormFieldType;

    let boundingBox: BoundingBox | undefined;
    if (f.cell) {
      const { x, y, w, h } = f.cell;
      const labelWidth = f.labelWidth ?? 0;
      const left = f.labelSide === "left" ? x + labelWidth : x + CELL_PAD;
      const width = w - labelWidth - CELL_PAD;
      boundingBox = { x: left / W, y: (y + 3) / H, width: width / W, height: (h - 6) / H };
    }

    return {
      id: f.id,
      label: f.label,
      labelUr: f.labelUr,
      options: f.options,
      type,
      inputMode: defaultInputMode(type),
      printFormat: defaultPrintFormat(type),
      required: f.required,
      section: f.section,
      questionUrdu: f.questionUrdu,
      questionEnglish: f.questionEnglish,
      boundingBox,
      extraBoxes: f.mirrors?.map(toBox),
      ticks: f.ticks ? Object.fromEntries(f.ticks.map((t) => [t.option, toBox(t.box)])) : undefined,
      align: f.align,
    };
  });

  const schema: FormSchema = { formTitle: raw.title, fields };
  return {
    id: raw.id,
    title: raw.title,
    imageUrl: raw.imageUrl,
    imageWidth: W,
    imageHeight: H,
    description: raw.description,
    notes: raw.notes,
    leaveBlank: raw.leaveBlank,
    speechSections: raw.speechSections,
    schema,
  };
}

// Every form the app can fill in. The first one is the original NADRA attester form.
export const TEMPLATES: FormTemplate[] = [
  nadraAttester,
  birthRegistration,
  citizenConfirmation,
  marriageRegistration,
].map((raw) => buildTemplate(raw as unknown as RawTemplate));

// True when this field can be filled from a spoken description of the form. Forms that name speech sections only take
// speech for fields in those sections (the other sections are asked about in the interview).
export function isSpeakable(template: FormTemplate | undefined, field: FormField): boolean {
  const sections = template?.speechSections;
  if (!sections) return true;
  return !field.section || sections.some((s) => field.section?.startsWith(s));
}

// Resolves a template by id, if present.
export function getTemplate(id: string): FormTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
