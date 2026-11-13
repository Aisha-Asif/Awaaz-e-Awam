// The privacy rules for the one-shot speech route: numbers are redacted before the AI sees them, typed-only fields are
// never asked of the AI, and anything the AI returns for them is ignored.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/ai", () => ({
  // A misbehaving AI that "finds" private values too.
  extractSpeech: vi.fn(async () => ({
    transcript: "mera cnic 3520212345671",
    extracted: { fullName: "Ali Raza", cnic: "3520212345671", phone: "03001234567", dateOfBirth: "1998-04-12" },
  })),
}));

import { POST } from "@/app/api/process-speech/route";
import { extractSpeech } from "@/lib/ai";

const call = (transcript: string, templateId?: string) => {
  const fd = new FormData();
  fd.append("transcript", transcript);
  if (templateId) fd.append("templateId", templateId);
  return POST(new NextRequest("http://localhost/api/process-speech", { method: "POST", body: fd }));
};

beforeEach(() => vi.mocked(extractSpeech).mockClear());

describe("POST /api/process-speech", () => {
  it("redacts CNIC and phone numbers before calling the AI", async () => {
    await call("mera naam Ali hai, cnic 35202-1234567-1, phone 0300-1234567");
    const sent = vi.mocked(extractSpeech).mock.calls[0][0];
    expect(sent).not.toMatch(/\d{5}-?\d{7}/);
    expect(sent).not.toMatch(/0300/);
    expect(sent).toContain("[removed]");
  });

  it("does not ask the AI for typed-only fields", async () => {
    await call("mera naam Ali hai");
    const ids = vi.mocked(extractSpeech).mock.calls[0][2];
    expect(ids).toContain("fullName");
    for (const typed of ["cnic", "phone", "dateOfBirth"]) expect(ids).not.toContain(typed);
  });

  it("ignores private values the AI returns anyway, and does not echo them in the transcript", async () => {
    const data = await (await call("mera naam Ali hai")).json();
    expect(data.extracted.fullName).toBe("Ali Raza");
    expect(data.extracted.cnic).toBeNull();
    expect(data.extracted.phone).toBeNull();
    expect(data.extracted.dateOfBirth).toBeNull();
    expect(data.transcript).not.toMatch(/3520212345671/);
    // Typed-only required fields are reported as missing so the interview asks for them.
    expect(data.validation.missingFields).toEqual(expect.arrayContaining(["cnic", "phone", "dateOfBirth"]));
  });

  it("asks the AI only about the applicant's sections on the NADRA attester form", async () => {
    await call("mera naam Ali hai", "nadra-attester-smartid");
    const ids = vi.mocked(extractSpeech).mock.calls[0][2];
    expect(ids).toContain("fullName");
    expect(ids).not.toContain("attesterName");
    expect(ids).not.toContain("dateOfBirth");
  });

  it("asks about every speakable field on forms that name no speech sections", async () => {
    await call("bachay ka naam Ali hai", "birth-registration");
    const ids = vi.mocked(extractSpeech).mock.calls[0][2];
    expect(ids).toEqual(
      expect.arrayContaining([
        "applicantName",
        "childName",
        "fatherName",
        "motherName",
        "gender",
        "placeOfBirth",
        "address",
      ]),
    );
    for (const typed of ["applicantCnic", "fatherCnic", "motherCnic", "dateOfBirth"]) expect(ids).not.toContain(typed);
  });

  it("reports the typed private numbers of a new form as missing so the interview asks for them", async () => {
    const data = await (await call("mera naam Ali hai", "citizen-confirmation")).json();
    expect(data.validation.missingFields).toEqual(
      expect.arrayContaining(["deponentCnic", "deponentContact", "witness1Cnic", "witness2Contact"]),
    );
    expect(data.extracted.deponentCnic).toBeNull();
  });

  it("rejects an unknown form id", async () => {
    const res = await call("hello", "no-such-form");
    expect(res.status).toBe(400);
  });

  it("keeps a choice answer only when it matches one of the field's options", async () => {
    vi.mocked(extractSpeech).mockResolvedValueOnce({
      transcript: "bachay ka naam Ali hai",
      extracted: { childName: "Ali", gender: "boy", placeOfBirth: "somewhere odd" },
    });
    const data = await (await call("bachay ka naam Ali hai", "birth-registration")).json();
    expect(data.extracted.childName).toBe("Ali");
    expect(data.extracted.gender).toBe("Male");
    expect(data.extracted.placeOfBirth).toBeNull();
  });
});
