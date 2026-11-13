# Privacy & Data Handling

Awaaz-e-Awam is in active development. This document describes how audio, transcripts, and
form data are handled, and the compliance boundary the code enforces. It is the source of
truth for the in-app page at `/privacy`.

## Data path

The app reads `DATA_PATH` (see `.env.example`) and behaves differently per value:

- **`demo`** (default) — synthetic/sample data only. Text and vision may be sent to Gemini or
  DeepSeek. Never enter real CNIC, phone, or identity data in this mode.
- **`sensitive`** — real citizen data. The router (`lib/data-path.ts`, `lib/ai.ts`) **fails
  closed**: it refuses to send anything to Gemini/DeepSeek. Only PII-safe providers (Groq)
  are allowed once wired (WS1). Until then the sensitive path serves nothing at all.

## What leaves the device

- Speak/Scan record audio and send it, plus derived text, to the configured **server-side**
  provider for transcription/extraction. The app itself does not store the audio or image.
- Scanned-form history is kept in the browser's `localStorage` only (`app/scan/page.tsx`);
  once on-device OCR lands (Phase 2) the image never leaves the browser.

## Numbers you type (CNIC, phone, date)

CNIC numbers, phone numbers and dates are **typed**, never spoken. The interview shows a typed box with live checking and
no microphone for these fields. The server validates them with its own code (`/api/process-answer`) and does **not** send
them to any AI provider. In the one-shot Speak flow the AI is never asked for these fields, anything it returns for them
is ignored, and anything that looks like a CNIC or phone number is removed from the text before it reaches the AI
(`lib/redact.ts`). The redaction is a safety net: it cannot un-send audio that was already transcribed.

Choice questions (gender, marital status, yes/no) are matched to their options by local code (`lib/options.ts`).

## Filled forms

The finished form (the blank form image with the answers written on it) is drawn in the browser and saved or printed from
there (`lib/fill-form.ts`). It is **not uploaded**, and nothing is stored on the server. Signatures, thumb impressions,
stamps, notary areas and office-use boxes are never filled in; the app lists them on screen only.

One person fills one form. There are no accounts, and answers are not kept or reused between forms.

## Known gaps

- **Audio is not covered by the `DATA_PATH` guard.** Spoken answers are transcribed by Gemini speech-to-text
  (`/api/transcribe`, `/api/process-speech`), which the guard does not check. Do not use real data with spoken answers
  until the guard also covers speech-to-text and an approved provider exists for it.
- The `sensitive` path has no approved provider yet, so it refuses every AI call.

## Providers

- **Gemini free tier:** content may be used to improve products and reviewed by humans; its
  terms forbid submitting PII. Therefore demo-only.
- **Groq:** no training on data unless permitted, zero-data-retention available, ~30-day
  logs. Chosen as the only provider allowed on the sensitive path (DECISIONS.md D9).

## Keys

API keys are **server-side only**, never exposed to the browser and never committed. See
`.env.example`; real values live in `.env.local` (gitignored).

## Consent

Speak and Scan show a notice before any data is collected, linking to `/privacy`.

## Retention

Nothing is persisted server-side in the current build. The WhatsApp channel (Phase 4)
introduces provider/network transit and requires a separate privacy review.
