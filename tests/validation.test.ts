import { describe, it, expect } from "vitest";
import { validateCNIC, validatePhone, validateDate, getFieldValidator, requiresConfirmation } from "@/lib/validation";

describe("validateCNIC", () => {
  it("accepts and normalizes a hyphenated CNIC to 13 digits", () => {
    const r = validateCNIC("42101-2345678-9");
    expect(r.valid).toBe(true);
    expect(r.normalized).toBe("4210123456789");
  });

  it("accepts a bare 13-digit CNIC", () => {
    expect(validateCNIC("4210123456789").valid).toBe(true);
  });

  it("rejects short, non-digit, and empty CNICs", () => {
    expect(validateCNIC("123456789").valid).toBe(false);
    expect(validateCNIC("abcdefghijklm").valid).toBe(false);
    expect(validateCNIC("").valid).toBe(false);
  });
});

describe("validatePhone", () => {
  it("accepts a plain 03xxxxxxxxx mobile", () => {
    const r = validatePhone("03001234567");
    expect(r.valid).toBe(true);
    expect(r.normalized).toBe("03001234567");
  });

  it("normalizes 92 and 92-with-space prefixes to 03", () => {
    expect(validatePhone("92 300 1234567").normalized).toBe("03001234567");
    expect(validatePhone("923001234567").normalized).toBe("03001234567");
  });

  it("rejects short or malformed numbers", () => {
    expect(validatePhone("12345").valid).toBe(false);
    expect(validatePhone("0300123456").valid).toBe(false);
  });
});

describe("validateDate", () => {
  it("accepts DD/MM/YYYY and normalizes to YYYY-MM-DD", () => {
    const r = validateDate("31/12/2025");
    expect(r.valid).toBe(true);
    expect(r.normalized).toBe("2025-12-31");
  });

  it("rejects impossible months and out-of-range years", () => {
    expect(validateDate("31/13/2025").valid).toBe(false);
    expect(validateDate("01/01/1899").valid).toBe(false);
    expect(validateDate("01/01/2999").valid).toBe(false);
  });
});

describe("getFieldValidator", () => {
  it("maps field types to their validator", () => {
    expect(getFieldValidator("cnic")).toBe(validateCNIC);
    expect(getFieldValidator("phone")).toBe(validatePhone);
    expect(getFieldValidator("date")).toBe(validateDate);
    expect(getFieldValidator("text")("abc").valid).toBe(getFieldValidator("unknown")("abc").valid);
    expect(getFieldValidator("text")("").valid).toBe(getFieldValidator("unknown")("").valid);
  });

  it("default validator requires non-empty input", () => {
    const v = getFieldValidator("text");
    expect(v("").valid).toBe(false);
    expect(v("abc").valid).toBe(true);
  });
});

describe("requiresConfirmation", () => {
  it("confirms cnic/phone/date, nothing else", () => {
    expect(requiresConfirmation("cnic")).toBe(true);
    expect(requiresConfirmation("phone")).toBe(true);
    expect(requiresConfirmation("date")).toBe(true);
    expect(requiresConfirmation("text")).toBe(false);
    expect(requiresConfirmation("select")).toBe(false);
  });
});
