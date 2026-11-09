import { describe, it, expect } from "vitest";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import nadraAttester from "@/lib/templates/nadra-attester-smartid.json";
import { defaultInputMode, defaultPrintFormat } from "@/lib/field-model";

const CELL_PAD = 6;

describe("buildTemplate", () => {
  it("compiles every raw field into the schema", () => {
    expect(TEMPLATES).toHaveLength(1);
    expect(TEMPLATES[0].schema.fields).toHaveLength(nadraAttester.fields.length);
  });

  it("turns a left-labeled cell into a normalized write area", () => {
    const raw = nadraAttester.fields.find((f) => f.id === "fullName")!;
    const w = TEMPLATES[0].schema.fields.find((f) => f.id === "fullName")!;

    expect(w.required).toBe(true);
    expect(w.type).toBe("text");
    expect(w.label).toBe("Full name");
    expect(w.boundingBox!.x).toBeCloseTo((raw.cell.x + raw.labelWidth) / nadraAttester.imageWidth, 10);
    expect(w.boundingBox!.y).toBeCloseTo((raw.cell.y + 3) / nadraAttester.imageHeight, 10);
    expect(w.boundingBox!.width).toBeCloseTo((raw.cell.w - raw.labelWidth - CELL_PAD) / nadraAttester.imageWidth, 10);
    expect(w.boundingBox!.height).toBeCloseTo((raw.cell.h - 6) / nadraAttester.imageHeight, 10);
  });

  it("gives every field a type-derived inputMode and printFormat", () => {
    for (const f of TEMPLATES[0].schema.fields) {
      expect(f.inputMode).toBe(defaultInputMode(f.type));
      expect(f.printFormat).toBe(defaultPrintFormat(f.type));
    }
    const cnic = TEMPLATES[0].schema.fields.find((f) => f.type === "cnic")!;
    expect(cnic.inputMode).toBe("type");
  });

  it("has unique field ids and a label on every field", () => {
    const ids = TEMPLATES[0].schema.fields.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of TEMPLATES[0].schema.fields) expect(f.label.trim()).not.toBe("");
  });

  it("labels every field in English and Urdu, with a spoken question", () => {
    for (const f of TEMPLATES[0].schema.fields) {
      expect(f.label.trim(), f.id).not.toBe("");
      expect(f.labelUr?.trim(), f.id).toBeTruthy();
      expect(f.questionUrdu.trim(), f.id).not.toBe("");
      // Urdu labels must be written in Urdu script, not Latin letters.
      expect(f.labelUr, f.id).toMatch(/[؀-ۿ]/);
    }
  });

  it("types every private-number field as typed-only and every choice field as a choice", () => {
    for (const f of TEMPLATES[0].schema.fields) {
      if (["cnic", "phone", "date"].includes(f.type)) expect(f.inputMode, f.id).toBe("type");
      if (f.type === "select") expect(f.inputMode, f.id).toBe("choice");
    }
  });

  it("names a section for every field", () => {
    for (const f of TEMPLATES[0].schema.fields) expect(f.section, f.id).toBeTruthy();
  });

  it("does not let two write areas overlap", () => {
    const fields = TEMPLATES[0].schema.fields;
    for (let i = 0; i < fields.length; i++) {
      for (let j = i + 1; j < fields.length; j++) {
        const a = fields[i].boundingBox!;
        const b = fields[j].boundingBox!;
        const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        expect(overlap, `${fields[i].id} overlaps ${fields[j].id}`).toBe(false);
      }
    }
  });

  it("keeps every write area inside the page", () => {
    for (const box of TEMPLATES[0].schema.fields.map((f) => f.boundingBox!)) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1);
      expect(box.y + box.height).toBeLessThanOrEqual(1);
    }
  });
});

describe("getTemplate", () => {
  it("resolves by id and returns undefined for unknown ids", () => {
    expect(getTemplate("nadra-attester-smartid")).toBe(TEMPLATES[0]);
    expect(getTemplate("nope")).toBeUndefined();
  });
});
