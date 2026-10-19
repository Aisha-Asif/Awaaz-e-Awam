// Verifies the DATA_PATH compliance boundary: the sensitive path never routes to Gemini/DeepSeek,
// and the router fails closed until a PII-safe provider is configured (DECISIONS.md D9/D10).
import { describe, it, expect, afterEach } from "vitest";
import { getDataPath, assertProviderAllowed } from "@/lib/data-path";
import { extractSpeech } from "@/lib/ai";

const original = process.env.DATA_PATH;
afterEach(() => {
  if (original === undefined) delete process.env.DATA_PATH;
  else process.env.DATA_PATH = original;
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

  it("treats unknown values as demo", () => {
    process.env.DATA_PATH = "nonsense";
    expect(getDataPath()).toBe("demo");
  });
});

describe("assertProviderAllowed", () => {
  it("rejects gemini and deepseek on the sensitive path", () => {
    process.env.DATA_PATH = "sensitive";
    expect(() => assertProviderAllowed("gemini")).toThrow(/sensitive/);
    expect(() => assertProviderAllowed("deepseek")).toThrow(/sensitive/);
  });

  it("allows them on the demo path", () => {
    process.env.DATA_PATH = "demo";
    expect(() => assertProviderAllowed("gemini")).not.toThrow();
    expect(() => assertProviderAllowed("deepseek")).not.toThrow();
  });
});

describe("provider router", () => {
  it("refuses to serve a request on the sensitive path", () => {
    process.env.DATA_PATH = "sensitive";
    expect(() => extractSpeech("میرا نام علی ہے", "Citizen", ["fullName"])).toThrow(/sensitive/);
  });
});
