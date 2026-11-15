import { describe, it, expect } from "vitest";
import { chooseSpeech, hasUrduScript, voiceQuality } from "@/lib/speech";

const URDU_Q = "آپ کا پورا نام کیا ہے؟";
const ROMAN_Q = "Aap ka poora naam kya hai?";

const voice = (lang: string, name = lang) => ({ lang, name });
const URDU = voice("ur-PK");
const HINDI = voice("hi-IN");
const EN_US = voice("en-US");
const EN_IN = voice("en-IN");

describe("hasUrduScript", () => {
  it("detects Urdu script and ignores Latin text", () => {
    expect(hasUrduScript(URDU_Q)).toBe(true);
    expect(hasUrduScript(ROMAN_Q)).toBe(false);
    expect(hasUrduScript("35202-1234567-1")).toBe(false);
  });
});

describe("chooseSpeech", () => {
  it("reads Urdu script with an Urdu voice when the device has one", () => {
    const c = chooseSpeech(URDU_Q, ROMAN_Q, [HINDI, EN_US, URDU]);
    expect(c).toMatchObject({ text: URDU_Q, voice: URDU, lang: "ur-PK", usedFallback: false });
  });

  it("accepts an underscore language tag from the system (ur_PK)", () => {
    const c = chooseSpeech(URDU_Q, undefined, [voice("ur_PK")]);
    expect(c?.voice?.lang).toBe("ur_PK");
  });

  it("does NOT pick a Hindi voice for Urdu script (it cannot read it): it reads the Roman Urdu with an English voice", () => {
    // This is the situation on a Windows PC that has a Hindi voice but no Urdu voice.
    const c = chooseSpeech(URDU_Q, ROMAN_Q, [HINDI, EN_US]);
    expect(c).toMatchObject({ text: ROMAN_Q, voice: EN_US, usedFallback: true });
    expect(c?.voice).not.toBe(HINDI);
  });

  it("prefers Indian English for the Roman Urdu fallback", () => {
    expect(chooseSpeech(URDU_Q, ROMAN_Q, [EN_US, EN_IN])?.voice).toBe(EN_IN);
  });

  it("can fall back to the English question", () => {
    const c = chooseSpeech(URDU_Q, "What is the full name?", [EN_US]);
    expect(c).toMatchObject({ text: "What is the full name?", voice: EN_US, usedFallback: true });
  });

  it("returns null when the device cannot read Urdu script and there is no readable fallback", () => {
    expect(chooseSpeech(URDU_Q, undefined, [HINDI, EN_US])).toBeNull();
    expect(chooseSpeech(URDU_Q, URDU_Q, [HINDI, EN_US])).toBeNull();
  });

  it("reads Latin text (names, numbers, Roman Urdu) with an English voice, even if an Urdu voice exists", () => {
    expect(chooseSpeech("35202-1234567-1", undefined, [URDU, EN_US])).toMatchObject({
      voice: EN_US,
      usedFallback: false,
    });
    expect(chooseSpeech(ROMAN_Q, undefined, [URDU, EN_IN])?.voice).toBe(EN_IN);
  });

  it("still tries when the device has not listed any voices yet", () => {
    expect(chooseSpeech(URDU_Q, undefined, [])).toMatchObject({ voice: undefined, lang: "ur-PK" });
    expect(chooseSpeech(ROMAN_Q, undefined, [])).toMatchObject({ voice: undefined, lang: "en-IN" });
  });

  it("returns null for empty text", () => {
    expect(chooseSpeech("   ", ROMAN_Q, [URDU])).toBeNull();
  });

  it("prefers the clearest (natural / online) voice for the same language", () => {
    const robotic = { lang: "ur-PK", name: "Microsoft Urdu", localService: true };
    const natural = { lang: "ur-PK", name: "Microsoft Uzma Online (Natural) - Urdu (Pakistan)", localService: false };
    expect(chooseSpeech(URDU_Q, ROMAN_Q, [robotic, natural])?.voice).toBe(natural);

    const enRobotic = { lang: "en-IN", name: "Microsoft Heera", localService: true };
    const enGoogle = { lang: "en-IN", name: "Google English (India)", localService: false };
    expect(chooseSpeech(URDU_Q, ROMAN_Q, [enRobotic, enGoogle])?.voice).toBe(enGoogle);
  });
});

describe("voiceQuality", () => {
  it("ranks natural / online voices above plain system voices", () => {
    expect(voiceQuality({ lang: "ur-PK", name: "Google اردو" })).toBeGreaterThan(voiceQuality({ lang: "ur-PK" }));
    expect(voiceQuality({ lang: "en-IN", localService: false })).toBeGreaterThan(
      voiceQuality({ lang: "en-IN", localService: true }),
    );
  });
});

describe("chooseSpeech for private text (a person's own answers)", () => {
  const online = { lang: "en-IN", name: "Google English (India)", localService: false };
  const local = { lang: "en-US", name: "Microsoft David", localService: true };

  it("never uses an online voice, even though online voices are preferred for questions", () => {
    expect(chooseSpeech("35202-1234567-1", undefined, [online, local], { private: true })?.voice).toBe(local);
    expect(chooseSpeech("35202-1234567-1", undefined, [online, local])?.voice).toBe(online);
  });

  it("reads nothing when the device has only online voices, or has not listed its voices yet", () => {
    expect(chooseSpeech("Ali Raza", undefined, [online], { private: true })).toBeNull();
    expect(chooseSpeech("Ali Raza", undefined, [], { private: true })).toBeNull();
    // A voice whose kind is unknown is treated as possibly online.
    expect(chooseSpeech("Ali Raza", undefined, [{ lang: "en-US" }], { private: true })).toBeNull();
  });
});
