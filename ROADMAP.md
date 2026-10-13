# Roadmap

Plan to move Awaaz-e-Awam from prototype to an incubation submission (Nov 15).
Decisions live in `DECISIONS.md`; this file is the sequenced work.

## Objective

Move Speak off the hardcoded `MOCK_FORM_SCHEMA` to **template-first**: pick a
ready-made form, speak, extraction fills it, export a filled PNG/PDF. Along the
way, clean up the codebase and add PII-safe, Groq-primary provider routing.

## Current state (baseline)

- `/fill` ships a working template → canvas-overlay → `pdf-lib` PNG/PDF pipeline
  (`app/fill/page.tsx`, `lib/fill-form.ts`, `components/FilledForm.tsx`).
- `lib/templates/` holds one hand-mapped template (NADRA Attester Smart ID, 23
  fields with boxes + Urdu/Roman/English questions).
- `/api/process-speech` accepts `templateId` and filters "Applicant" fields, but
  still defaults to `MOCK_FORM_SCHEMA` (`app/api/process-speech/route.ts:53`).
- STT is Gemini-only (`lib/gemini-stt.ts`); no Groq, no `Provider` interface.
- Known bugs and dead code listed under Phase 0.

## Phase 0 — Cleanup (precursor, before features)

- **Dead code:** `isMockMode`/`willUseRealApi` + unused `Api` types (`lib/api.ts`);
  `InterviewState`/`AppMode`/`RecordingState` (`lib/types.ts`);
  `StepProgress` (`components/Progress.tsx:57`); unused imports in both pages.
- **Tooling:** Prettier; ESLint `no-unused-vars: error`; consider
  `noUncheckedIndexedAccess`. **husky + lint-staged** auto-fix staged files on commit
  (`eslint --fix` + `prettier --write`); scripts: `format`, `format:check`, `test`,
  `test:watch`.
- **Bugs:**
  - `app/api/process-answer/route.ts:24` — drops field label/question.
  - `app/api/next-question/route.ts:22` — counts `__skip__` as answered.
  - `components/ImageCapture.tsx:331` — retake sets camera open without `startCamera()`.
- **Types:** `ProcessAnswerRequestSchema` (`lib/schemas.ts:26`), `sanitizeFormSchema`
  return type.
- **Accept:** `npm run typecheck` + `npm run lint` pass; `tests/test-apis.mjs` green.

## Phase 0.5 — Compliance

- `DATA_PATH=sensitive|demo` env; restricted production keys; `PRIVACY.md`; consent copy.
- **Accept:** sensitive path never reaches Gemini; keys server-side only.

## Phase 1 — Provider + Speak core (Nov-15 deliverable)

- **Provider layer:** `lib/groq.ts` + `Provider` interface
  (`transcribe` / `extract` / `extractSpeech`). Groq primary, Gemini fallback,
  routed by `DATA_PATH`.
- **Speak client:** template picker → pass `templateId` → render `FilledForm` with
  extracted answers → interview remaining fields (e.g. attester) using the
  template's `questionUrdu`. Server `templateId` support already exists.
- **Eval:** `scripts/eval.mjs` + fixtures; WER < 30%, field F1 > 0.85.
- **Accept:** speak → NADRA form → filled PNG/PDF, eval bar met.

## Phase 2 — Scan (post-Nov 15)

- Schema-driven scanning; **Tesseract.js** OCR on-device; **pdf.js** to rasterize
  digital PDFs. Image never leaves the browser.
- `app/api/scan-form/route.ts:40` — stop silently returning mock on the real path.

## Phase 3 — Post-Nov 15 extensions

- `/api/normalize` and optional Urdu ASR / TTS upgrades.

## Phase 4 — WhatsApp channel (post-Nov 15)

Deliver the same core loop over WhatsApp: citizen sends an Urdu voice note, the bot
transcribes (Groq Whisper), extracts, interviews, and returns a filled form.

- **Channel:** Meta **WhatsApp Cloud API (direct)** — Meta-hosted, no BSP markup.
  Inbound messages free; replies inside the 24h service window free up to
  **1,000/number/month** (from Oct 1, 2026), then billed. Consolidate replies.
- **Reuse:** Groq Whisper, `Provider` interface, extraction, `lib/templates`,
  `FilledForm`, validators.
- **New:** `/api/whatsapp/webhook` (GET verify + POST messages), media download
  (`media_id` → URL → Bearer download; OGG/OPUS, mono, ≤16MB), reply sender,
  template picker via WhatsApp interactive list.
- **Session state:** WhatsApp is stateless/multi-turn — per-conversation state
  (chosen template, fields answered) must live server-side keyed by `wa_id`. No-DB
  constraint → small KV (Upstash Redis / Vercel KV free tier). See `DECISIONS.md` D22.
- **Reply format:** undecided — short-lived link to a web page (reuses `/fill`) vs
  server-generated PDF document message. See open questions.
- **Lead time:** Meta business verification + display-name approval + a number not
  already on WhatsApp. Start early.
- **Watch-out:** message content transits Meta (and Groq) — needs a privacy review
  beyond the web-app `PRIVACY.md`.

## Refactor — comments, tests, CI (runs with Phase 0)

Fused into Phase 0; not a separate pass.

- **Comments:** a file-header block on every source file (`app/**`, `lib/**`,
  `components/**`, routes) stating the file's purpose; a one-line JSDoc above each
  function saying what it does; `// ponytail:` notes on deliberate simplifications.
  No narrating obvious code.
- **Tests (vitest):** add `vitest` + `@vitest/coverage-v8` (dev deps).
  - `tests/validation.test.ts` — CNIC/phone/date, the trust boundary; deepest coverage.
  - `tests/fill-form.test.ts` — `formatForPaper`.
  - `tests/templates-index.test.ts` — bounding-box math from the template JSON.
  - `tests/schemas.test.ts` — Zod validators.
  - Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`. Keep
    `tests/test-apis.mjs` as the server-backed e2e.
- **CI:** `.github/workflows/ci.yml` → `typecheck` → `lint` → `format:check` → `test`
  (check-mode, no auto-fix). Visible green check per push/PR is the credibility signal.
- **README:** CI status badge + short "Testing" note.
- **Accept:** `npm test` green in CI; key libs carry file + function comments.

## Backlog

- Generic dynamic Speak form + `lib/concepts.ts` concept registry (synonyms →
  canonical field id, type, validator, Urdu question) for when no template exists.
- Speak → "map onto a chosen form" from scan history + scan-new.

## Open questions

- Scan input type: paper photos only, digital PDFs only, or both?
- Whisper language hint / Roman-Urdu handling.
- Groq JSON-mode reliability for extraction.
- Who owns API-key provisioning and free-tier budget for the pilot?
- WhatsApp reply format: link to web form, or server-generated PDF document?
- WhatsApp session store: Upstash Redis vs Vercel KV (free tier)?
