// ponytail: shared error classification for the two Gemini clients (text/vision
// in gemini.ts, STT in gemini-stt.ts). Both loop over models on retryable
// failures; keeping the rules here stops them drifting apart.

export const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

// ponytail: bare network rejections ("fetch failed" / resets) carry no HTTP
// status but are transient and worth failing over on. Genuine network outages
// just double latency on the fallback attempt — acceptable.
export function isNetworkError(err: unknown): boolean {
  const m = String((err as { message?: string })?.message ?? "");
  return /fetch failed|ECONNRESET|ETIMEDOUT|network|undici|socket/i.test(m);
}

// ponytail: the SDK surfaces errors as an ApiError; grab the HTTP status from
// .status/.code or fall back to the code embedded in the message body.
export function errorStatus(err: unknown): number | null {
  const e = err as { status?: number; code?: number | string; message?: string };
  const n = Number(e?.status ?? e?.code);
  if (Number.isInteger(n) && n > 0) return n;
  const m = String(e?.message ?? "");
  const hit = m.match(/"code"\s*:\s*(\d{3})/);
  return hit ? Number(hit[1]) : null;
}