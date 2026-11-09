import { describe, it, expect } from "vitest";
import {
  defaultInputMode,
  defaultPrintFormat,
  effectiveInputMode,
  inputModeOf,
  isTypedOnlyType,
  labelFor,
  printFormatOf,
} from "@/lib/field-model";

describe("defaultInputMode", () => {
  it("makes CNIC, phone and date typed-only", () => {
    expect(defaultInputMode("cnic")).toBe("type");
    expect(defaultInputMode("phone")).toBe("type");
    expect(defaultInputMode("date")).toBe("type");
  });

  it("uses a choice for select and checkbox", () => {
    expect(defaultInputMode("select")).toBe("choice");
    expect(defaultInputMode("checkbox")).toBe("choice");
  });

  it("allows voice or typing for free text", () => {
    for (const t of ["text", "address", "number", "unknown"] as const) {
      expect(defaultInputMode(t)).toBe("voice-or-type");
    }
  });
});

describe("defaultPrintFormat", () => {
  it("maps cnic and date to their printed styles, everything else to plain", () => {
    expect(defaultPrintFormat("cnic")).toBe("cnic-dashes");
    expect(defaultPrintFormat("date")).toBe("date-dmy");
    expect(defaultPrintFormat("phone")).toBe("plain");
    expect(defaultPrintFormat("text")).toBe("plain");
  });
});

describe("inputModeOf / printFormatOf", () => {
  it("prefers the field's own override", () => {
    expect(inputModeOf({ type: "cnic", inputMode: "voice-or-type" })).toBe("voice-or-type");
    expect(printFormatOf({ type: "cnic", printFormat: "plain" })).toBe("plain");
  });

  it("falls back to the type's default", () => {
    expect(inputModeOf({ type: "cnic" })).toBe("type");
    expect(printFormatOf({ type: "date" })).toBe("date-dmy");
  });
});

describe("labelFor", () => {
  it("returns the Urdu label when present and falls back to English", () => {
    expect(labelFor({ label: "Full name", labelUr: "پورا نام" }, "ur")).toBe("پورا نام");
    expect(labelFor({ label: "Full name" }, "ur")).toBe("Full name");
    expect(labelFor({ label: "Full name", labelUr: "پورا نام" }, "en")).toBe("Full name");
  });
});

describe("effectiveInputMode", () => {
  it("shows buttons for a select field that has options", () => {
    expect(effectiveInputMode({ type: "select", options: ["Male", "Female"] })).toBe("choice");
  });

  it("falls back to voice-or-type for a select field with no options, so it never dead-ends", () => {
    expect(effectiveInputMode({ type: "select" })).toBe("voice-or-type");
    expect(effectiveInputMode({ type: "select", options: [] })).toBe("voice-or-type");
  });

  it("keeps CNIC, phone and date typed-only", () => {
    expect(effectiveInputMode({ type: "cnic" })).toBe("type");
    expect(effectiveInputMode({ type: "phone", options: ["x"] })).toBe("type");
  });
});

describe("isTypedOnlyType", () => {
  it("is true only for cnic, phone and date", () => {
    expect(isTypedOnlyType("cnic")).toBe(true);
    expect(isTypedOnlyType("phone")).toBe(true);
    expect(isTypedOnlyType("date")).toBe(true);
    for (const t of ["text", "address", "select", "number", "unknown"] as const) {
      expect(isTypedOnlyType(t)).toBe(false);
    }
  });
});
