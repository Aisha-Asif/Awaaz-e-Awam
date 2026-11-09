// The privacy rule at the API: CNIC, phone and date are validated by our own code and never sent to an AI provider.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/ai", () => ({
  extractAnswer: vi.fn(async () => ({ value: "Ali Raza", needsConfirmation: false })),
}));

import { POST } from "@/app/api/process-answer/route";
import { extractAnswer } from "@/lib/ai";

const call = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/process-answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => vi.mocked(extractAnswer).mockClear());

describe("POST /api/process-answer", () => {
  it("validates a typed CNIC locally, asks for confirmation, and never calls the AI", async () => {
    const res = await call({ fieldId: "cnic", fieldType: "cnic", transcript: "35202-1234567-1" });
    const data = await res.json();
    expect(data).toMatchObject({ value: "3520212345671", valid: true, needsConfirmation: true, error: null });
    expect(extractAnswer).not.toHaveBeenCalled();
  });

  it("rejects a bad CNIC without calling the AI", async () => {
    const data = await (await call({ fieldId: "cnic", fieldType: "cnic", transcript: "12345" })).json();
    expect(data.valid).toBe(false);
    expect(data.error).toMatch(/13 digits/);
    expect(extractAnswer).not.toHaveBeenCalled();
  });

  it("normalizes a typed phone number and a typed date locally", async () => {
    const phone = await (await call({ fieldId: "p", fieldType: "phone", transcript: "+92 300 1234567" })).json();
    expect(phone).toMatchObject({ value: "03001234567", valid: true, needsConfirmation: true });
    const date = await (await call({ fieldId: "d", fieldType: "date", transcript: "12/04/1998" })).json();
    expect(date).toMatchObject({ value: "1998-04-12", valid: true, needsConfirmation: true });
    expect(extractAnswer).not.toHaveBeenCalled();
  });

  it("does not let a spoken sentence stand in for a CNIC", async () => {
    const data = await (
      await call({ fieldId: "cnic", fieldType: "cnic", transcript: "mera cnic teen paanch do do hai" })
    ).json();
    expect(data.valid).toBe(false);
    expect(extractAnswer).not.toHaveBeenCalled();
  });

  it("still uses the AI for ordinary text fields", async () => {
    const data = await (
      await call({ fieldId: "fullName", fieldType: "text", transcript: "mera naam Ali Raza hai" })
    ).json();
    expect(data).toMatchObject({ value: "Ali Raza", valid: true, needsConfirmation: false });
    expect(extractAnswer).toHaveBeenCalledTimes(1);
  });
});
