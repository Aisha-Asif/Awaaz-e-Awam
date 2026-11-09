import { describe, it, expect } from "vitest";
import { defaultInputMode, defaultPrintFormat, inputModeOf, printFormatOf, labelFor } from "@/lib/field-model";

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
