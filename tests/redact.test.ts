import { describe, it, expect } from "vitest";
import { redactPrivateNumbers, REDACTED } from "@/lib/redact";

describe("redactPrivateNumbers", () => {
  it("removes a CNIC with or without dashes", () => {
    expect(redactPrivateNumbers("mera cnic 35202-1234567-1 hai")).toBe(`mera cnic ${REDACTED} hai`);
    expect(redactPrivateNumbers("cnic 3520212345671")).toBe(`cnic ${REDACTED}`);
  });

  it("removes mobile numbers in common spellings", () => {
    expect(redactPrivateNumbers("call 0300-1234567")).toBe(`call ${REDACTED}`);
    expect(redactPrivateNumbers("call 03001234567")).toBe(`call ${REDACTED}`);
    expect(redactPrivateNumbers("call +92 300 1234567")).toBe(`call ${REDACTED}`);
    expect(redactPrivateNumbers("call 3001234567")).toBe(`call ${REDACTED}`);
  });

  it("removes Urdu-script digits too", () => {
    expect(redactPrivateNumbers("۳۵۲۰۲۱۲۳۴۵۶۷۱")).toBe(REDACTED);
  });

  it("leaves ordinary sentences, short numbers and dates alone", () => {
    const text = "Mera naam Ali Raza hai, meri umar 25 saal hai, main 12/04/1998 ko paida hua, house 12 street 4";
    expect(redactPrivateNumbers(text)).toBe(text);
  });
});
