import { describe, it, expect } from "vitest";
import {
  ProcessAnswerRequestSchema,
  NextQuestionRequestSchema,
  sanitizeFormSchema,
  sanitizeAnswer,
  sanitizeSpeech,
} from "@/lib/schemas";

describe("ProcessAnswerRequestSchema", () => {
  it("accepts a minimal valid request", () => {
    expect(ProcessAnswerRequestSchema.parse({ fieldId: "cnic", fieldType: "cnic", transcript: "میرا نمبر" })).toEqual({
      fieldId: "cnic",
      fieldType: "cnic",
      transcript: "میرا نمبر",
    });
  });

  it("accepts optional label and questionUrdu", () => {
    const req = ProcessAnswerRequestSchema.parse({
      fieldId: "cnic",
      fieldType: "cnic",
      transcript: "میرا نمبر",
      label: "CNIC",
      questionUrdu: "آپ کا کمرہ نمبر کیا ہے؟",
    });
    expect(req.label).toBe("CNIC");
    expect(req.questionUrdu).toBe("آپ کا کمرہ نمبر کیا ہے؟");
  });

  it("rejects unknown field types and empty transcripts", () => {
    expect(() => ProcessAnswerRequestSchema.parse({ fieldId: "cnic", fieldType: "nope", transcript: "x" })).toThrow();
    expect(() => ProcessAnswerRequestSchema.parse({ fieldId: "cnic", fieldType: "cnic", transcript: "" })).toThrow();
  });
});

describe("NextQuestionRequestSchema", () => {
  it("accepts fields plus nullable answers", () => {
    expect(
      NextQuestionRequestSchema.parse({ fields: [{ id: "a", label: "A" }], answers: { a: "x", b: null } }).answers,
    ).toEqual({ a: "x", b: null });
  });

  it("requires at least one field", () => {
    expect(() => NextQuestionRequestSchema.parse({ fields: [], answers: {} })).toThrow();
  });
});

describe("sanitizeFormSchema", () => {
  it("slugifies ids, falls back labels, dedupes, and defaults", () => {
    const s = sanitizeFormSchema({
      formTitle: "T",
      fields: [
        { id: "Full Name", label: "Full name", type: "text" },
        { id: "cnic0512", type: "cnic" },
        { id: "??cnic0512", label: "dup" },
        { id: "12345", type: "date" },
        { id: "", label: "empty" },
        { id: "SELECT one", type: "select" },
        { id: "WTF", type: "nonsense" },
      ],
    });

    expect(s.formTitle).toBe("T");
    expect(s.fields.map((f) => f.id)).toEqual(["fullName", "cnic0512", "selectOne", "wtf"]);

    const fullName = s.fields[0];
    expect(fullName.label).toBe("Full name");
    expect(fullName.required).toBe(false);

    const cnic = s.fields[1];
    expect(cnic.label).toBe("cnic0512");
    expect(cnic.required).toBe(false);

    expect(s.fields.find((f) => f.id === "wtf")!.type).toBe("unknown");
  });

  it("renormalizes mixed- and multi-word ids to lowercase humps", () => {
    const s = sanitizeFormSchema({
      fields: [
        { id: "fullName", type: "text" },
        { id: "CNIC number", type: "cnic" },
      ],
    });
    expect(s.fields.map((f) => f.id)).toEqual(["fullname", "cnicNumber"]);
  });

  it("defaults the title and tolerates missing fields", () => {
    expect(sanitizeFormSchema({}).formTitle).toBe("Detected Form");
    expect(sanitizeFormSchema({}).fields).toEqual([]);
  });

  it("rejects non-object input", () => {
    expect(() => sanitizeFormSchema("junk")).toThrow();
  });
});

describe("sanitizeAnswer", () => {
  it("keeps extracted fields and ignores unknown keys", () => {
    const a = sanitizeAnswer({ fieldId: "x", value: "abc", valid: true, junk: 1 }, "other");
    expect(a).toMatchObject({ fieldId: "x", value: "abc", valid: true, needsConfirmation: false, error: null });
  });

  it("defaults everything and falls back to the given fieldId", () => {
    const a = sanitizeAnswer({}, "cnic");
    expect(a).toEqual({ fieldId: "cnic", value: null, valid: false, needsConfirmation: false, error: null });
  });
});

describe("sanitizeSpeech", () => {
  it("defaults transcript and extracted, then passes valid data through", () => {
    expect(sanitizeSpeech({})).toEqual({ transcript: "", extracted: {} });
    expect(sanitizeSpeech({ transcript: "t", extracted: { a: "1" } })).toEqual({
      transcript: "t",
      extracted: { a: "1" },
    });
  });
});
