// Speech choice: decides what to say, and with which voice, when a question or a value is read aloud. Pure logic so it can
// be tested without a browser.
//
// Why this exists: a voice can only read the script it was built for. A Hindi voice cannot read Urdu script, so picking
// "any Hindi voice" for an Urdu question makes the Listen button silent on devices (such as many Windows PCs) that have a
// Hindi voice but no Urdu one. Instead:
//   - Urdu script is read by an Urdu voice, if the device has one;
//   - otherwise the Roman Urdu (or English) version of the question is read by an English voice;
//   - text written in Latin letters (names, numbers, Roman Urdu) is read by an English voice;
//   - if nothing readable exists, there is no speech and the caller says so, instead of staying silent.

// name and localService are optional so plain { lang } objects still work (tests, older browsers).
export type VoiceLike = { lang: string; name?: string; localService?: boolean };

export type SpeechChoice<V extends VoiceLike> = {
  text: string;
  // undefined means "let the browser use its default voice for this language".
  voice: V | undefined;
  lang: string;
  // True when the question is read from its fallback version because the device cannot read the original.
  usedFallback: boolean;
};

const URDU_SCRIPT = /[؀-ۿ]/;

// True when the text contains Urdu / Arabic script.
export function hasUrduScript(text: string): boolean {
  return URDU_SCRIPT.test(text);
}

const normalize = (lang: string) => lang.replace("_", "-").toLowerCase();

// Neural / cloud voices ("Microsoft Uzma Online (Natural)", "Google ...") sound far clearer than the old robotic
// system voices, so among voices for the same language the best-sounding one is chosen.
const CLEAR_VOICE = /natural|neural|online|google|enhanced|premium/i;

// Higher is clearer. Exported for tests.
export function voiceQuality(v: VoiceLike): number {
  let score = 0;
  if (v.name && CLEAR_VOICE.test(v.name)) score += 2;
  if (v.localService === false) score += 1;
  return score;
}

// The clearest voice whose language matches, or undefined.
function bestVoice<V extends VoiceLike>(voices: readonly V[], matches: (lang: string) => boolean): V | undefined {
  let best: V | undefined;
  for (const v of voices) {
    if (!matches(normalize(v.lang))) continue;
    if (!best || voiceQuality(v) > voiceQuality(best)) best = v;
  }
  return best;
}

// Picks an English voice (Indian English first, since it suits Roman Urdu best).
function englishVoice<V extends VoiceLike>(voices: readonly V[]): V | undefined {
  return bestVoice(voices, (l) => l === "en-in") ?? bestVoice(voices, (l) => l.startsWith("en"));
}

export type SpeechOptions = {
  // The text is a person's own answer (name, CNIC, phone, address). Online voices ("Google ...", "... Online
  // (Natural)") send the text to Google's or Microsoft's servers to be spoken, so private text is read only by a voice
  // that runs on the device, and not read at all when there is none. Fixed question text does not need this.
  private?: boolean;
};

// Returns what to say and with which voice, or null when this device cannot read the text aloud.
export function chooseSpeech<V extends VoiceLike>(
  text: string,
  fallbackText: string | undefined,
  allVoices: readonly V[],
  options: SpeechOptions = {},
): SpeechChoice<V> | null {
  const main = text.trim();
  if (!main) return null;

  if (options.private) {
    // Only voices the browser says are on-device; an unlisted or default voice might be an online one.
    const local = allVoices.filter((v) => v.localService === true);
    if (local.length === 0) return null;
    const choice = chooseSpeech(main, fallbackText, local);
    return choice?.voice ? choice : null;
  }
  const voices = allVoices;

  const english = (spoken: string, usedFallback: boolean): SpeechChoice<V> => {
    const voice = englishVoice(voices);
    return { text: spoken, voice, lang: voice?.lang ?? "en-IN", usedFallback };
  };

  // Latin letters, digits and punctuation: an English voice reads them.
  if (!hasUrduScript(main)) return english(main, false);

  // Urdu script and an Urdu voice: read it as written.
  const urdu = bestVoice(voices, (l) => l.startsWith("ur"));
  if (urdu) return { text: main, voice: urdu, lang: urdu.lang, usedFallback: false };

  // The device has not listed any voices yet, so we cannot tell: try the Urdu text and let the browser decide.
  if (voices.length === 0) return { text: main, voice: undefined, lang: "ur-PK", usedFallback: false };

  // Urdu script but no Urdu voice: read the Roman Urdu / English version, if there is one.
  const alt = fallbackText?.trim();
  if (alt && !hasUrduScript(alt)) return english(alt, true);

  return null;
}
