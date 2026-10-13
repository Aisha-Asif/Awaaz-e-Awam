import { describe, it, expect } from "vitest";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import nadraAttester from "@/lib/templates/nadra-attester-smartid.json";

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
