// Verifies the Groq client wire format (Whisper STT + chat JSON extraction) without network
// access, and that it fails loudly when the key is missing or the API errors. Live mode is
// assumed: vitest does not load .env, so AI_MODE is unset at import time.
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { transcribeAudio, extractSpeech, extractAnswer, STT_MODEL, CHAT_MODEL } from "@/lib/groq";

const originalKey = process.env.GROQ_API_KEY;

beforeEach(() => {
  process.env.GROQ_API_KEY = "test-key";
});

afterEach(() => {
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
  vi.unstubAllGlobals();
});

const okJson = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) }) as Response;

describe("transcribeAudio", () => {
  it("posts a multipart Whisper request and returns the transcript", async () => {
    const fetchMock = vi.fn(async () => okJson({ text: "  Mera naam Ali Raza hai.  " }));
    vi.stubGlobal("fetch", fetchMock);

    const text = await transcribeAudio("audio/webm", Buffer.from("audio-bytes"));
    expect(text).toBe("Mera naam Ali Raza hai.");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/audio/transcriptions");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");

    const form = init.body as FormData;
    expect(form.get("model")).toBe(STT_MODEL);
    expect(form.get("language")).toBe("ur");
    expect(form.get("response_format")).toBe("json");
  });

  it("throws when GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(transcribeAudio("audio/webm", Buffer.from("x"))).rejects.toThrow(/GROQ_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on an HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 429, text: async () => "rate limited" }) as Response),
    );
    await expect(transcribeAudio("audio/webm", Buffer.from("x"))).rejects.toThrow(/429/);
  });
});

describe("extractSpeech", () => {
  it("requests a JSON object from the chat model and sanitizes the result", async () => {
    const fetchMock = vi.fn(async () =>
      okJson({ choices: [{ message: { content: '{"transcript":"hi","extracted":{"fullName":"Ali Raza"}}' } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await extractSpeech("Mera naam Ali Raza hai", "Citizen Form", ["fullName"]);
    expect(result.extracted.fullName).toBe("Ali Raza");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe(CHAT_MODEL);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.temperature).toBe(0);
  });

  it("throws when the model returns an empty choice", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okJson({ choices: [] })),
    );
    await expect(extractSpeech("x", "Form", ["fullName"])).rejects.toThrow(/empty response/);
  });
});

describe("extractAnswer", () => {
  it("returns the sanitized value and confirmation flag", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        okJson({ choices: [{ message: { content: '{"value":"Ali Raza","needsConfirmation":false}' } }] }),
      ),
    );
    const result = await extractAnswer("fullName", "text", "Full Name", "Aap ka naam?", "Ali Raza");
    expect(result).toEqual({ value: "Ali Raza", needsConfirmation: false });
  });
});
