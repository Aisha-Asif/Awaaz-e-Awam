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

export type VoiceLike = { lang: string };

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

// Picks an English voice (Indian English first, since it suits Roman Urdu best).
function englishVoice<V extends VoiceLike>(voices: readonly V[]): V | undefined {
  return voices.find((v) => normalize(v.lang) === "en-in") ?? voices.find((v) => normalize(v.lang).startsWith("en"));
}

// Returns what to say and with which voice, or null when this device cannot read the text aloud.
export function chooseSpeech<V extends VoiceLike>(
  text: string,
  fallbackText: string | undefined,
  voices: readonly V[],
): SpeechChoice<V> | null {
  const main = text.trim();
  if (!main) return null;

  const english = (spoken: string, usedFallback: boolean): SpeechChoice<V> => {
    const voice = englishVoice(voices);
    return { text: spoken, voice, lang: voice?.lang ?? "en-IN", usedFallback };
  };

  // Latin letters, digits and punctuation: an English voice reads them.
  if (!hasUrduScript(main)) return english(main, false);

  // Urdu script and an Urdu voice: read it as written.
  const urdu = voices.find((v) => normalize(v.lang).startsWith("ur"));
  if (urdu) return { text: main, voice: urdu, lang: urdu.lang, usedFallback: false };

  // The device has not listed any voices yet, so we cannot tell: try the Urdu text and let the browser decide.
  if (voices.length === 0) return { text: main, voice: undefined, lang: "ur-PK", usedFallback: false };

  // Urdu script but no Urdu voice: read the Roman Urdu / English version, if there is one.
  const alt = fallbackText?.trim();
  if (alt && !hasUrduScript(alt)) return english(alt, true);

  return null;
}
