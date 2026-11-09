import { describe, it, expect } from "vitest";
import { buildResultSections, summarizeResults, resultsToText, resultsToJson } from "@/lib/results";
import { SKIP_SENTINEL } from "@/lib/schemas";
import { TEMPLATES } from "@/lib/templates";
import type { FormField } from "@/lib/types";

const fields: FormField[] = [
  {
    id: "name",
    label: "Full name",
    labelUr: "پورا نام",
    type: "text",
    required: true,
    questionUrdu: "q",
    section: "Applicant",
  },
  { id: "cnic", label: "CNIC", type: "cnic", required: true, questionUrdu: "q", section: "Applicant" },
  { id: "dob", label: "Date of birth", type: "date", required: false, questionUrdu: "q", section: "Applicant" },
  { id: "office", label: "Office", type: "text", required: true, questionUrdu: "q", section: "Attester" },
  { id: "note", label: "Note", type: "text", required: false, questionUrdu: "q" },
];

describe("buildResultSections", () => {
  const sections = buildResultSections(fields, {
    name: "Ali Raza",
    cnic: "3520212345671",
    dob: SKIP_SENTINEL,
    office: "   ",
  });

  it("groups fields by section in first-seen order, with a default section for the rest", () => {
    expect(sections.map((s) => s.name)).toEqual(["Applicant", "Attester", "Details"]);
    expect(sections[0].rows.map((r) => r.id)).toEqual(["name", "cnic", "dob"]);
  });

  it("marks answered, skipped and empty rows", () => {
    const status = Object.fromEntries(sections.flatMap((s) => s.rows).map((r) => [r.id, r.status]));
    expect(status).toEqual({ name: "answered", cnic: "answered", dob: "skipped", office: "empty", note: "empty" });
  });

  it("shows values the way the paper form expects but keeps the stored value too", () => {
    const cnic = sections[0].rows[1];
    expect(cnic.display).toBe("35202-1234567-1");
    expect(cnic.raw).toBe("3520212345671");
  });

  it("never leaks the skip sentinel as a value", () => {
    const dob = sections[0].rows[2];
    expect(dob.raw).toBeNull();
    expect(dob.display).toBeNull();
  });

  it("keeps the Urdu label when the field has one", () => {
    expect(sections[0].rows[0].labelUr).toBe("پورا نام");
  });
});

describe("summarizeResults", () => {
  it("counts answered rows and missing required rows", () => {
    const s = buildResultSections(fields, { name: "Ali", cnic: "3520212345671" });
    expect(summarizeResults(s)).toEqual({ total: 5, answered: 2, missingRequired: 1 });
  });
});

describe("resultsToText", () => {
  it("writes a heading per section and marks unanswered rows", () => {
    const text = resultsToText(buildResultSections(fields, { name: "Ali", cnic: "3520212345671", dob: SKIP_SENTINEL }));
    expect(text).toContain("Applicant\nFull name: Ali\nCNIC: 35202-1234567-1\nDate of birth: (skipped)");
    expect(text).toContain("Attester\nOffice: (not answered)");
  });
});

describe("resultsToJson", () => {
  it("includes only answered fields with their stored values", () => {
    const json = resultsToJson(buildResultSections(fields, { name: "Ali", cnic: "3520212345671", dob: SKIP_SENTINEL }));
    expect(json).toEqual({ name: "Ali", cnic: "3520212345671" });
  });
});

describe("with the real template", () => {
  it("lists every template field, so none is dropped from the final screen", () => {
    const template = TEMPLATES[0];
    const rows = buildResultSections(template.schema.fields, {}).flatMap((s) => s.rows);
    expect(rows).toHaveLength(template.schema.fields.length);
    expect(buildResultSections(template.schema.fields, {}).length).toBeGreaterThan(1);
  });
});
