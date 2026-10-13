// Template registry: buildTemplate compiles a raw cell layout into fillable FormFields
// (normalized 0-1 coordinates); templates ship as JSON and are resolved by id.
import nadraAttester from "./nadra-attester-smartid.json";
import type { FormField, FormSchema, FormTemplate } from "@/lib/types";

// Template JSON stores each field's whole printed cell in page pixels, plus which
// side the printed label sits on and how wide it is. The write area (where ink
// goes) is the cell minus the label, converted to 0-1 so it survives any scale.
type RawTemplate = typeof nadraAttester;

const CELL_PAD = 6;

// Compiles one raw template JSON into a FormTemplate (write areas, normalized boxes).
function buildTemplate(raw: RawTemplate): FormTemplate {
  const { imageWidth: W, imageHeight: H } = raw;

  const fields: FormField[] = raw.fields.map((f) => {
    const { x, y, w, h } = f.cell;
    const left = f.labelSide === "left" ? x + f.labelWidth : x + CELL_PAD;
    const width = w - f.labelWidth - CELL_PAD;
    return {
      id: f.id,
      label: f.label,
      type: f.type as FormField["type"],
      required: f.required,
      section: f.section,
      questionUrdu: f.questionUrdu,
      questionEnglish: f.questionEnglish,
      boundingBox: { x: left / W, y: (y + 3) / H, width: width / W, height: (h - 6) / H },
    };
  });

  const schema: FormSchema = { formTitle: raw.title, fields };
  return {
    id: raw.id,
    title: raw.title,
    imageUrl: raw.imageUrl,
    imageWidth: W,
    imageHeight: H,
    schema,
  };
}

export const TEMPLATES: FormTemplate[] = [buildTemplate(nadraAttester)];

// Resolves a template by id, if present.
export function getTemplate(id: string): FormTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
