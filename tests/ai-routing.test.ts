// Verifies the DATA_PATH compliance boundary: the sensitive path is Groq-only and never routes
// to Gemini/DeepSeek (text or audio), an unknown value fails loudly instead of falling back to
// the permissive path, and STT fails closed when no PII-safe provider is available
// (DECISIONS.md D9/D10).
import { describe, it, expect, afterEach } from "vitest";
import { getDataPath, assertProviderAllowed } from "@/lib/data-path";
import { getExtractionProvider, getSttProvider } from "@/lib/provider";

const originalPath = process.env.DATA_PATH;
const originalKey = process.env.GROQ_API_KEY;
afterEach(() => {
  if (originalPath === undefined) delete process.env.DATA_PATH;
  else process.env.DATA_PATH = originalPath;
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
});

describe("getDataPath", () => {
  it("defaults to demo when DATA_PATH is unset", () => {
    delete process.env.DATA_PATH;
    expect(getDataPath()).toBe("demo");
  });

  it("recognizes the sensitive path", () => {
    process.env.DATA_PATH = "sensitive";
    expect(getDataPath()).toBe("sensitive");
  });

  it("accepts case and whitespace variations", () => {
    process.env.DATA_PATH = " Sensitive ";
    expect(getDataPath()).toBe("sensitive");
  });

  it("throws on an unknown value instead of falling back to demo", () => {
    process.env.DATA_PATH = "nonsense";
    expect(() => getDataPath()).toThrow(/Invalid DATA_PATH/);
  });
});

describe("assertProviderAllowed", () => {
  it("rejects gemini and deepseek on the sensitive path", () => {
    process.env.DATA_PATH = "sensitive";
    expect(() => assertProviderAllowed("gemini")).toThrow(/sensitive/);
    expect(() => assertProviderAllowed("deepseek")).toThrow(/sensitive/);
  });

  it("allows groq on the sensitive path", () => {
    process.env.DATA_PATH = "sensitive";
    expect(() => assertProviderAllowed("groq")).not.toThrow();
  });

  it("allows any provider on the demo path", () => {
    process.env.DATA_PATH = "demo";
    expect(() => assertProviderAllowed("gemini")).not.toThrow();
    expect(() => assertProviderAllowed("deepseek")).not.toThrow();
  });
});

describe("provider routers", () => {
  it("routes extraction to groq on the sensitive path", () => {
    process.env.DATA_PATH = "sensitive";
    expect(getExtractionProvider().name).toBe("groq");
  });

  it("routes audio STT to groq on the sensitive path", () => {
    process.env.DATA_PATH = "sensitive";
    process.env.GROQ_API_KEY = "test-key";
    expect(getSttProvider().name).toBe("groq");
  });

  it("fails closed for STT on the sensitive path with no groq key", () => {
    process.env.DATA_PATH = "sensitive";
    delete process.env.GROQ_API_KEY;
    expect(() => getSttProvider()).toThrow(/sensitive/);
  });

  it("keeps gemini/deepseek for extraction on the demo path", () => {
    process.env.DATA_PATH = "demo";
    expect(getExtractionProvider().name).toMatch(/gemini|deepseek/);
  });

  it("falls back to gemini STT on the demo path with no groq key", () => {
    process.env.DATA_PATH = "demo";
    delete process.env.GROQ_API_KEY;
    expect(getSttProvider().name).toBe("gemini");
  });
});
