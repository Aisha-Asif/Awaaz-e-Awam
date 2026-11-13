// Tests for the extended template format: tick boxes, extra write areas for details a form prints twice, alignment,
// fields with no text area, and how the renderer decides what to draw.
import { describe, it, expect } from "vitest";
import { buildTemplate, type RawTemplate } from "@/lib/templates";
import { planFieldDrawing } from "@/lib/fill-form";
import { SKIP_SENTINEL } from "@/lib/schemas";

// A tiny 1000 x 2000 page so the expected fractions are easy to read.
const raw: RawTemplate = {
  id: "t",
  title: "Test form",
  imageUrl: "/x.png",
  imageWidth: 1000,
  imageHeight: 2000,
  fields: [
    {
      id: "name",
      label: "Name",
      type: "text",
      required: true,
      section: "A",
      cell: { x: 100, y: 200, w: 400, h: 50 },
      labelSide: "left",
      labelWidth: 100,
      mirrors: [{ x: 600, y: 200, w: 300, h: 44 }],
      align: "center",
      questionUrdu: "q",
      questionRoman: "Aap ka naam kya hai?",
    },
    {
      id: "vaccinated",
      label: "Vaccinated",
      type: "select",
      required: false,
      section: "A",
      options: ["Yes", "No"],
      ticks: [
        { option: "Yes", box: { x: 100, y: 1000, w: 20, h: 20 } },
        { option: "No", box: { x: 200, y: 1000, w: 20, h: 20 } },
      ],
      questionUrdu: "q",
    },
    {
      id: "blank",
      label: "Blank in a sentence",
      type: "text",
      required: true,
      section: "B",
      cell: { x: 50, y: 400, w: 300, h: 40 },
      labelWidth: 0,
      questionUrdu: "q",
    },
  ],
};

const template = buildTemplate(raw);
const by = (id: string) => template.schema.fields.find((f) => f.id === id)!;

describe("buildTemplate: extended format", () => {
  it("still turns a left-labelled cell into a normalized write area", () => {
    const b = by("name").boundingBox!;
    expect(b.x).toBeCloseTo(200 / 1000, 10);
    expect(b.y).toBeCloseTo(203 / 2000, 10);
    expect(b.width).toBeCloseTo((400 - 100 - 6) / 1000, 10);
    expect(b.height).toBeCloseTo(44 / 2000, 10);
  });

  it("treats a missing labelWidth as no printed label (an inline blank)", () => {
    const b = by("blank").boundingBox!;
    expect(b.x).toBeCloseTo(56 / 1000, 10);
    expect(b.width).toBeCloseTo((300 - 6) / 1000, 10);
  });

  it("converts mirror areas to normalized extra boxes without subtracting a label", () => {
    const [m] = by("name").extraBoxes!;
    expect(m).toEqual({ x: 0.6, y: 0.1, width: 0.3, height: 0.022 });
  });

  it("converts tick boxes per option and allows a field with no text area", () => {
    const v = by("vaccinated");
    expect(v.boundingBox).toBeUndefined();
    expect(Object.keys(v.ticks!)).toEqual(["Yes", "No"]);
    expect(v.ticks!.Yes).toEqual({ x: 0.1, y: 0.5, width: 0.02, height: 0.01 });
  });

  it("passes the Roman Urdu question through", () => {
    expect(by("name").questionRoman).toBe("Aap ka naam kya hai?");
    expect(by("blank").questionRoman).toBeUndefined();
  });

  it("passes alignment and options through", () => {
    expect(by("name").align).toBe("center");
    expect(by("vaccinated").options).toEqual(["Yes", "No"]);
  });

  it("derives the input mode from the type", () => {
    expect(by("vaccinated").inputMode).toBe("choice");
    expect(by("name").inputMode).toBe("voice-or-type");
  });
});

describe("planFieldDrawing", () => {
  it("writes the answer into the main area and every mirror, with the field's alignment", () => {
    const ops = planFieldDrawing(by("name"), "Ali Raza");
    expect(ops).toHaveLength(2);
    expect(ops.every((o) => o.kind === "text")).toBe(true);
    expect(ops[0]).toMatchObject({ text: "Ali Raza", align: "center" });
  });

  it("ticks the box of the chosen option and nothing else", () => {
    const ops = planFieldDrawing(by("vaccinated"), "No");
    expect(ops).toEqual([{ kind: "tick", box: by("vaccinated").ticks!.No }]);
  });

  it("matches the option ignoring case", () => {
    expect(planFieldDrawing(by("vaccinated"), "yes")).toEqual([{ kind: "tick", box: by("vaccinated").ticks!.Yes }]);
  });

  it("draws nothing for an unknown option on a tick-only field", () => {
    expect(planFieldDrawing(by("vaccinated"), "Maybe")).toEqual([]);
  });

  it("draws nothing for empty, whitespace, null, undefined or skipped answers", () => {
    for (const v of ["", "   ", null, undefined, SKIP_SENTINEL]) {
      expect(planFieldDrawing(by("name"), v)).toEqual([]);
    }
  });

  it("formats values the way the paper expects", () => {
    const cnic = { ...by("blank"), type: "cnic" as const, printFormat: "cnic-dashes" as const };
    const [op] = planFieldDrawing(cnic, "3520212345671");
    expect(op).toMatchObject({ kind: "text", text: "35202-1234567-1" });
  });
});
