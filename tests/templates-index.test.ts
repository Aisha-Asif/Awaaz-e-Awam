import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { TEMPLATES, getTemplate, isSpeakable } from "@/lib/templates";
import nadraAttester from "@/lib/templates/nadra-attester-smartid.json";
import { defaultInputMode, defaultPrintFormat } from "@/lib/field-model";
import type { BoundingBox, FormTemplate } from "@/lib/types";

const CELL_PAD = 6;

// Every box of a field that ink or a tick is drawn into.
function boxesOf(t: FormTemplate) {
  const out: { id: string; kind: string; box: BoundingBox }[] = [];
  for (const f of t.schema.fields) {
    if (f.boundingBox) out.push({ id: f.id, kind: "area", box: f.boundingBox });
    (f.extraBoxes ?? []).forEach((box, i) => out.push({ id: f.id, kind: `mirror ${i + 1}`, box }));
    Object.entries(f.ticks ?? {}).forEach(([o, box]) => out.push({ id: f.id, kind: `tick ${o}`, box }));
  }
  return out;
}

// Width and height stored in a PNG file's header.
function pngSize(file: string): { width: number; height: number } {
  const buf = fs.readFileSync(path.join(process.cwd(), "public", file));
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("buildTemplate (NADRA attester form)", () => {
  const t = TEMPLATES[0];

  it("compiles every raw field into the schema", () => {
    expect(t.id).toBe("nadra-attester-smartid");
    expect(t.schema.fields).toHaveLength(nadraAttester.fields.length);
  });

  it("turns a left-labeled cell into a normalized write area", () => {
    const raw = nadraAttester.fields.find((f) => f.id === "fullName")!;
    const w = t.schema.fields.find((f) => f.id === "fullName")!;

    expect(w.required).toBe(true);
    expect(w.type).toBe("text");
    expect(w.label).toBe("Full name");
    expect(w.boundingBox!.x).toBeCloseTo((raw.cell.x + raw.labelWidth) / nadraAttester.imageWidth, 10);
    expect(w.boundingBox!.y).toBeCloseTo((raw.cell.y + 3) / nadraAttester.imageHeight, 10);
    expect(w.boundingBox!.width).toBeCloseTo((raw.cell.w - raw.labelWidth - CELL_PAD) / nadraAttester.imageWidth, 10);
    expect(w.boundingBox!.height).toBeCloseTo((raw.cell.h - 6) / nadraAttester.imageHeight, 10);
  });

  it("gives its choice fields options", () => {
    const choices = t.schema.fields.filter((f) => f.inputMode === "choice");
    expect(choices.map((f) => f.id)).toEqual(expect.arrayContaining(["gender", "maritalStatus", "twin"]));
  });
});

describe("the list of available forms", () => {
  it("contains the four forms with unique ids", () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual([
      "nadra-attester-smartid",
      "birth-registration",
      "citizen-confirmation",
      "marriage-registration",
    ]);
  });

  it("resolves by id and returns undefined for unknown ids", () => {
    expect(getTemplate("nadra-attester-smartid")).toBe(TEMPLATES[0]);
    expect(getTemplate("marriage-registration")?.title).toMatch(/Nikah/);
    expect(getTemplate("nope")).toBeUndefined();
  });
});

describe.each(TEMPLATES.map((t) => [t.id, t] as const))("template %s", (_id, t) => {
  it("has a title, a description and a list of areas the app leaves blank", () => {
    expect(t.title.trim()).not.toBe("");
    expect(t.description?.trim(), "description").toBeTruthy();
    expect(t.leaveBlank?.length, "leaveBlank").toBeGreaterThan(0);
  });

  it("points at a form image whose real size matches the template", () => {
    const size = pngSize(t.imageUrl);
    expect(size).toEqual({ width: t.imageWidth, height: t.imageHeight });
  });

  it("has unique field ids", () => {
    const ids = t.schema.fields.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every field a type-derived inputMode and printFormat", () => {
    for (const f of t.schema.fields) {
      expect(f.inputMode, f.id).toBe(defaultInputMode(f.type));
      expect(f.printFormat, f.id).toBe(defaultPrintFormat(f.type));
    }
  });

  it("labels every field in English and Urdu and has a spoken Urdu question", () => {
    for (const f of t.schema.fields) {
      expect(f.label.trim(), f.id).not.toBe("");
      expect(f.labelUr, f.id).toMatch(/[؀-ۿ]/);
      expect(f.questionUrdu, f.id).toMatch(/[؀-ۿ]/);
      expect(f.questionEnglish?.trim(), f.id).toBeTruthy();
    }
  });

  it("has a Roman Urdu question for every field, in Latin letters only, so it can be read aloud without an Urdu voice", () => {
    for (const f of t.schema.fields) {
      expect(f.questionRoman, f.id).toBeTruthy();
      expect(f.questionRoman, f.id).toMatch(/^[ -~]+$/);
      expect(f.questionRoman, f.id).toMatch(/[?.]$/);
    }
  });

  it("names a section for every field", () => {
    for (const f of t.schema.fields) expect(f.section, f.id).toBeTruthy();
  });

  it("types private numbers as typed-only and choices as choices with options", () => {
    for (const f of t.schema.fields) {
      if (["cnic", "phone", "date"].includes(f.type)) expect(f.inputMode, f.id).toBe("type");
      if (f.type === "select") {
        expect(f.inputMode, f.id).toBe("choice");
        expect(f.options?.length, f.id).toBeGreaterThan(0);
      }
    }
  });

  it("gives every field somewhere to write or tick", () => {
    for (const f of t.schema.fields) {
      expect(!!f.boundingBox || Object.keys(f.ticks ?? {}).length > 0, f.id).toBe(true);
    }
  });

  it("has a tick box for exactly each option of a tick field", () => {
    for (const f of t.schema.fields.filter((x) => x.ticks)) {
      expect(Object.keys(f.ticks!).sort(), f.id).toEqual([...(f.options ?? [])].sort());
    }
  });

  it("keeps every box inside the page", () => {
    for (const { id, kind, box } of boxesOf(t)) {
      const label = `${id} ${kind}`;
      expect(box.x, label).toBeGreaterThanOrEqual(0);
      expect(box.y, label).toBeGreaterThanOrEqual(0);
      expect(box.width, label).toBeGreaterThan(0);
      expect(box.height, label).toBeGreaterThan(0);
      expect(box.x + box.width, label).toBeLessThanOrEqual(1);
      expect(box.y + box.height, label).toBeLessThanOrEqual(1);
    }
  });

  it("does not let two boxes overlap", () => {
    const boxes = boxesOf(t);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].box;
        const b = boxes[j].box;
        const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        expect(overlap, `${boxes[i].id} ${boxes[i].kind} overlaps ${boxes[j].id} ${boxes[j].kind}`).toBe(false);
      }
    }
  });
});

describe("isSpeakable", () => {
  it("allows every field when a form names no speech sections", () => {
    const birth = getTemplate("birth-registration")!;
    expect(birth.schema.fields.every((f) => isSpeakable(birth, f))).toBe(true);
    expect(isSpeakable(undefined, birth.schema.fields[0])).toBe(true);
  });

  it("limits the NADRA attester form to the applicant's sections", () => {
    const nadra = getTemplate("nadra-attester-smartid")!;
    const speakable = nadra.schema.fields.filter((f) => isSpeakable(nadra, f)).map((f) => f.id);
    expect(speakable).toContain("fullName");
    expect(speakable).toContain("presentCity");
    expect(speakable).not.toContain("attesterName");
  });
});
