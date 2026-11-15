// Option matching: turns what a person said or typed ("mard", "female", "shadi shuda", "ہاں") into one of a choice
// field's options ("Male", "Female", "Married", "Yes"). Pure local logic: nothing is sent to an AI provider.

import { effectiveInputMode } from "@/lib/field-model";
import type { FormField } from "@/lib/types";

// Known synonyms per option, keyed by the option's normalized text. English, Roman Urdu and Urdu script.
const SYNONYMS: Record<string, string[]> = {
  male: ["m", "man", "boy", "mard", "ladka", "larka", "aadmi", "مرد", "لڑکا", "مذکر", "آدمی"],
  female: ["f", "woman", "girl", "aurat", "larki", "khatoon", "عورت", "لڑکی", "خاتون", "مونث"],
  transgender: ["khwaja sira", "khawaja sira", "khusra", "خواجہ سرا", "ٹرانسجینڈر"],
  single: [
    "unmarried",
    "not married",
    "kunwara",
    "kunwari",
    "ghair shadi shuda",
    "غیر شادی شدہ",
    "کنوارا",
    "کنواری",
    "سنگل",
  ],
  married: ["shadi shuda", "shaadi shuda", "شادی شدہ", "میرڈ"],
  widowed: ["widow", "widower", "bewa", "bewah", "رنڈوا", "بیوہ"],
  divorced: ["divorcee", "talaq yafta", "طلاق یافتہ", "طلاق"],
  // Marriage form wording: "virgin / widow / divorced".
  virgin: [
    "unmarried",
    "single",
    "not married",
    "kunwara",
    "kunwari",
    "ghair shadi shuda",
    "غیر شادی شدہ",
    "کنوارا",
    "کنواری",
    "سنگل",
  ],
  widow: ["widowed", "bewa", "bewah", "بیوہ"],
  widower: ["widowed", "randwa", "rand", "رنڈوا"],
  // Relatives (citizen confirmation, clause d).
  father: ["baap", "abu", "abbu", "walid", "والد", "ابو", "باپ"],
  mother: ["maa", "ammi", "walida", "والدہ", "امی", "ماں"],
  sister: ["behan", "bahen", "بہن"],
  brother: ["bhai", "بھائی"],
  son: ["beta", "بیٹا"],
  daughter: ["beti", "بیٹی"],
  yes: ["y", "haan", "han", "ji haan", "ji", "jee", "ہاں", "جی", "جی ہاں"],
  no: ["n", "nahi", "nahin", "nai", "ji nahi", "ji nahin", "نہیں", "نہ", "جی نہیں"],
  hospital: ["aspatal", "ہسپتال", "اسپتال"],
  home: ["ghar", "گھر"],
};

// Lower-cases, removes Urdu/Arabic diacritics, unifies look-alike letters, and turns punctuation into single spaces.
export function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

// True when `phrase` appears in `text` as whole words (so "male" does not match inside "female").
function containsPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

// Returns the option the text refers to, or null when it is unclear.
// A match made by a phrase that sits inside another option's longer matched phrase is ignored, so "not married" means
// Single and not Married. If two unrelated options still match ("male and female"), the answer is unclear.
export function matchOption(text: string, options: readonly string[]): string | null {
  const spoken = normalizeText(text);
  if (!spoken) return null;

  const hits: { option: string; phrase: string }[] = [];
  for (const option of options) {
    const key = normalizeText(option);
    for (const raw of [key, ...(SYNONYMS[key] ?? [])]) {
      const phrase = normalizeText(raw);
      if (phrase && containsPhrase(spoken, phrase)) hits.push({ option, phrase });
    }
  }

  const standing = hits.filter(
    (h) => !hits.some((o) => o.option !== h.option && o.phrase !== h.phrase && containsPhrase(o.phrase, h.phrase)),
  );
  const matched = Array.from(new Set(standing.map((h) => h.option)));
  return matched.length === 1 ? matched[0] : null;
}

// How each option is shown and spoken in Urdu (Urdu script + Roman Urdu), so a choice button can be recognised by
// someone who reads Urdu but not English, and the options can be read aloud after the question.
const LABELS: Record<string, { ur: string; roman: string }> = {
  male: { ur: "مرد", roman: "Mard" },
  female: { ur: "عورت", roman: "Aurat" },
  transgender: { ur: "خواجہ سرا", roman: "Khwaja sira" },
  single: { ur: "غیر شادی شدہ", roman: "Ghair shadi shuda" },
  married: { ur: "شادی شدہ", roman: "Shadi shuda" },
  widowed: { ur: "بیوہ / رنڈوا", roman: "Bewa ya randwa" },
  divorced: { ur: "طلاق یافتہ", roman: "Talaq yafta" },
  virgin: { ur: "کنواری", roman: "Kunwari" },
  widow: { ur: "بیوہ", roman: "Bewa" },
  widower: { ur: "رنڈوا", roman: "Randwa" },
  father: { ur: "والد", roman: "Walid" },
  mother: { ur: "والدہ", roman: "Walida" },
  sister: { ur: "بہن", roman: "Behan" },
  brother: { ur: "بھائی", roman: "Bhai" },
  son: { ur: "بیٹا", roman: "Beta" },
  daughter: { ur: "بیٹی", roman: "Beti" },
  yes: { ur: "ہاں", roman: "Haan" },
  no: { ur: "نہیں", roman: "Nahin" },
  hospital: { ur: "ہسپتال", roman: "Hospital" },
  home: { ur: "گھر", roman: "Ghar" },
};

// The Urdu and Roman Urdu name of an option, or undefined for an option without one.
export function optionLabel(option: string): { ur: string; roman: string } | undefined {
  return LABELS[normalizeText(option)];
}

// The options as one spoken sentence ("مرد، یا عورت"), Urdu script and Roman Urdu. Options without an Urdu name are
// said as written.
export function spokenOptions(options: readonly string[]): { ur: string; roman: string } {
  const labels = options.map((o) => optionLabel(o) ?? { ur: o, roman: o });
  return {
    ur: labels.map((l) => l.ur).join("، یا "),
    roman: labels.map((l) => l.roman).join(", ya "),
  };
}

// What the Listen button says for a question: the question, then, for a choice field, its options ("... مرد، یا عورت"),
// since not everyone can read the buttons. `text` is the Urdu question; `fallback` is the Roman Urdu (or English) one,
// read when the device has no Urdu voice.
export function questionSpeech(
  field: FormField | undefined,
  question: string | null,
): { text: string; fallback: string | undefined } {
  const text = field?.questionUrdu || question || field?.label || "";
  const fallback = field?.questionRoman ?? field?.questionEnglish;
  if (!field?.options?.length || effectiveInputMode(field) !== "choice") return { text, fallback };
  const choices = spokenOptions(field.options);
  return {
    text: text ? `${text} ${choices.ur}` : text,
    fallback: field.questionRoman ? `${field.questionRoman} ${choices.roman}` : fallback,
  };
}
