// Checks that run against EVERY available form, so a new form cannot be added with a field that never prints, a choice
// that cannot be matched, or a fillable signature area.
import { describe, it, expect } from "vitest";
import { TEMPLATES } from "@/lib/templates";
import { planFieldDrawing } from "@/lib/fill-form";
import { buildResultSections, resultsToJson, summarizeResults } from "@/lib/results";
import { matchOption } from "@/lib/options";
import { getFieldValidator } from "@/lib/validation";
import type { FormField } from "@/lib/types";

// A plausible answer for a field, valid for its type.
function sampleAnswer(f: FormField): string {
  if (f.options?.length) return f.options[0];
  switch (f.type) {
    case "cnic":
      return "3520112345671";
    case "phone":
      return "03001234567";
    case "date":
      return "1998-04-12";
    case "number":
      return "28";
    default:
      return "Sample answer";
  }
}

describe.each(TEMPLATES.map((t) => [t.id, t] as const))("form %s: output", (_id, t) => {
  const fields = t.schema.fields;

  it("draws something for every field once it is answered", () => {
    for (const f of fields) {
      const ops = planFieldDrawing(f, sampleAnswer(f));
      expect(ops.length, f.id).toBeGreaterThan(0);
    }
  });

  it("writes a detail the form prints twice into every place", () => {
    for (const f of fields.filter((x) => x.extraBoxes?.length)) {
      const ops = planFieldDrawing(f, sampleAnswer(f));
      if (!f.ticks) expect(ops.length, f.id).toBe(1 + f.extraBoxes!.length);
    }
  });

  it("draws nothing for a field that is empty or skipped", () => {
    for (const f of fields) {
      expect(planFieldDrawing(f, ""), f.id).toEqual([]);
      expect(planFieldDrawing(f, null), f.id).toEqual([]);
    }
  });

  it("lists every field on the result screen, grouped by section", () => {
    const answers = Object.fromEntries(fields.map((f) => [f.id, sampleAnswer(f)]));
    const sections = buildResultSections(fields, answers);
    expect(summarizeResults(sections)).toEqual({ total: fields.length, answered: fields.length, missingRequired: 0 });
    expect(Object.keys(resultsToJson(sections)).sort()).toEqual(fields.map((f) => f.id).sort());
    expect(sections.length).toBeGreaterThan(1);
  });

  it("counts required fields that are still empty as missing", () => {
    const required = fields.filter((f) => f.required).length;
    expect(summarizeResults(buildResultSections(fields, {})).missingRequired).toBe(required);
  });

  it("can match every option of every choice field from what a person says", () => {
    for (const f of fields.filter((x) => x.options?.length)) {
      for (const option of f.options!) {
        expect(matchOption(option, f.options!), `${f.id}: ${option}`).toBe(option);
        expect(matchOption(option.toUpperCase(), f.options!), `${f.id}: ${option} (upper case)`).toBe(option);
      }
    }
  });

  it("accepts a valid sample for every typed private field with its own validator", () => {
    for (const f of fields.filter((x) => ["cnic", "phone", "date"].includes(x.type))) {
      const sample = f.type === "date" ? "12/04/1998" : sampleAnswer(f);
      expect(getFieldValidator(f.type)(sample).valid, f.id).toBe(true);
    }
  });

  it("never offers a signature, thumb, stamp or office-use area as a field", () => {
    for (const f of fields) {
      expect(`${f.id} ${f.label}`, f.id).not.toMatch(/signature|thumb|fingerprint|stamp|notary|office use|crms|cbrc/i);
    }
  });

  it("lists the blank areas it leaves for the person to complete", () => {
    for (const item of t.leaveBlank ?? []) expect(item.trim().length).toBeGreaterThan(3);
  });
});

describe("speech sections", () => {
  it("only name sections that exist on the form", () => {
    for (const t of TEMPLATES.filter((x) => x.speechSections)) {
      const sections = t.schema.fields.map((f) => f.section ?? "");
      for (const s of t.speechSections!) {
        expect(
          sections.some((name) => name.startsWith(s)),
          `${t.id}: ${s}`,
        ).toBe(true);
      }
    }
  });
});
