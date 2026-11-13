import { describe, it, expect } from "vitest";
import {
  applyRect,
  clearField,
  exportCalibration,
  rectFromDrag,
  toImagePoint,
  validateCalibration,
  type Calibration,
  type CalibrationField,
} from "@/lib/calibrate";

const PAGE = { width: 1000, height: 2000 };

describe("toImagePoint", () => {
  it("scales a point on the displayed image to page pixels", () => {
    // The image is displayed at half size, 500x1000, starting at (10, 20).
    const shown = { left: 10, top: 20, width: 500, height: 1000 };
    expect(toImagePoint({ x: 260, y: 520 }, shown, PAGE)).toEqual({ x: 500, y: 1000 });
  });

  it("clamps points outside the image to the page edges", () => {
    const shown = { left: 0, top: 0, width: 500, height: 1000 };
    expect(toImagePoint({ x: -50, y: 5000 }, shown, PAGE)).toEqual({ x: 0, y: 2000 });
  });
});

describe("rectFromDrag", () => {
  it("gives the same rectangle whichever direction the drag went", () => {
    const expected = { x: 10, y: 20, w: 30, h: 40 };
    expect(rectFromDrag({ x: 10, y: 20 }, { x: 40, y: 60 })).toEqual(expected);
    expect(rectFromDrag({ x: 40, y: 60 }, { x: 10, y: 20 })).toEqual(expected);
    expect(rectFromDrag({ x: 40, y: 20 }, { x: 10, y: 60 })).toEqual(expected);
  });
});

const fields: CalibrationField[] = [
  { id: "name", label: "Name", required: true },
  { id: "vaccinated", label: "Vaccinated", options: ["Yes", "No"], required: false },
  { id: "note", label: "Note", required: false },
];

describe("applyRect / clearField", () => {
  it("stores area, mirror and tick rectangles without modifying the input", () => {
    const start: Calibration = {};
    const a = applyRect(start, { kind: "cell", fieldId: "name" }, { x: 1, y: 2, w: 30, h: 20 });
    const b = applyRect(a, { kind: "mirror", fieldId: "name" }, { x: 5, y: 6, w: 30, h: 20 });
    const c = applyRect(b, { kind: "tick", fieldId: "vaccinated", option: "Yes" }, { x: 9, y: 9, w: 12, h: 12 });
    expect(start).toEqual({});
    expect(c.name.cell).toEqual({ x: 1, y: 2, w: 30, h: 20 });
    expect(c.name.mirrors).toHaveLength(1);
    expect(c.vaccinated.ticks.Yes).toEqual({ x: 9, y: 9, w: 12, h: 12 });
  });

  it("replaces the area when drawn again but adds mirrors", () => {
    let c: Calibration = {};
    c = applyRect(c, { kind: "cell", fieldId: "name" }, { x: 1, y: 1, w: 20, h: 20 });
    c = applyRect(c, { kind: "cell", fieldId: "name" }, { x: 2, y: 2, w: 25, h: 25 });
    c = applyRect(c, { kind: "mirror", fieldId: "name" }, { x: 3, y: 3, w: 25, h: 25 });
    c = applyRect(c, { kind: "mirror", fieldId: "name" }, { x: 4, y: 4, w: 25, h: 25 });
    expect(c.name.cell).toEqual({ x: 2, y: 2, w: 25, h: 25 });
    expect(c.name.mirrors).toHaveLength(2);
  });

  it("clears a field", () => {
    const c = applyRect({}, { kind: "cell", fieldId: "name" }, { x: 1, y: 1, w: 20, h: 20 });
    expect(clearField(c, "name")).toEqual({});
  });
});

describe("exportCalibration", () => {
  it("exports only fields with boxes, in field order, with ticks in option order", () => {
    let c: Calibration = {};
    c = applyRect(c, { kind: "tick", fieldId: "vaccinated", option: "No" }, { x: 20, y: 9, w: 12, h: 12 });
    c = applyRect(c, { kind: "tick", fieldId: "vaccinated", option: "Yes" }, { x: 9, y: 9, w: 12, h: 12 });
    c = applyRect(c, { kind: "cell", fieldId: "name" }, { x: 1, y: 2, w: 30, h: 20 });
    expect(exportCalibration(c, fields)).toEqual([
      { id: "name", cell: { x: 1, y: 2, w: 30, h: 20 } },
      {
        id: "vaccinated",
        ticks: [
          { option: "Yes", box: { x: 9, y: 9, w: 12, h: 12 } },
          { option: "No", box: { x: 20, y: 9, w: 12, h: 12 } },
        ],
      },
    ]);
  });
});

describe("validateCalibration", () => {
  it("reports a required field with no box", () => {
    expect(validateCalibration({}, fields, PAGE)).toEqual(["name: required field has no box yet"]);
  });

  it("reports boxes that are too small or outside the page", () => {
    let c: Calibration = {};
    c = applyRect(c, { kind: "cell", fieldId: "name" }, { x: 1, y: 1, w: 3, h: 20 });
    c = applyRect(c, { kind: "mirror", fieldId: "name" }, { x: 990, y: 1, w: 50, h: 20 });
    const problems = validateCalibration(c, fields, PAGE);
    expect(problems.some((p) => p.includes("name area: box is too small"))).toBe(true);
    expect(problems.some((p) => p.includes("name mirror 1: box goes outside the page"))).toBe(true);
  });

  it("reports an option that has no tick box once some ticks are drawn", () => {
    let c: Calibration = applyRect({}, { kind: "cell", fieldId: "name" }, { x: 1, y: 1, w: 30, h: 20 });
    c = applyRect(c, { kind: "tick", fieldId: "vaccinated", option: "Yes" }, { x: 9, y: 9, w: 12, h: 12 });
    expect(validateCalibration(c, fields, PAGE)).toEqual(['vaccinated: option "No" has no tick box']);
  });

  it("returns no problems for a complete calibration", () => {
    let c: Calibration = applyRect({}, { kind: "cell", fieldId: "name" }, { x: 1, y: 1, w: 30, h: 20 });
    c = applyRect(c, { kind: "tick", fieldId: "vaccinated", option: "Yes" }, { x: 9, y: 9, w: 12, h: 12 });
    c = applyRect(c, { kind: "tick", fieldId: "vaccinated", option: "No" }, { x: 20, y: 9, w: 12, h: 12 });
    expect(validateCalibration(c, fields, PAGE)).toEqual([]);
  });
});
