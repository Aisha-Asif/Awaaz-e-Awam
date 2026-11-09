// Safety net: removes anything that looks like a CNIC or a Pakistani mobile number from free text before it is sent to
// an AI provider. The interview already collects those values by typing, so this only catches a number that slipped
// into a spoken answer. It cannot undo audio that was already transcribed; it limits what the text model sees.

// One digit in Western, Eastern Arabic or Persian/Urdu form. String.raw keeps the backslashes exactly as written.
const D = String.raw`[0-9٠-٩۰-۹]`;

// Any run of 11 or more digits, allowing single spaces or dashes between them (covers CNICs and 0300-style numbers).
const LONG_NUMBER = new RegExp(String.raw`\+?${D}(?:[\s-]?${D}){10,}`, "g");

// A mobile number written without the leading zero or with +92 / 92, e.g. 3001234567 or +92 300 1234567.
const MOBILE = new RegExp(String.raw`(?:\+?92[\s-]?)?3${D}{2}[\s-]?${D}{7}`, "g");

export const REDACTED = "[removed]";

// Returns the text with CNIC-like and phone-like numbers replaced by "[removed]".
export function redactPrivateNumbers(text: string): string {
  return text.replace(LONG_NUMBER, REDACTED).replace(MOBILE, REDACTED);
}
