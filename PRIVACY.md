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
