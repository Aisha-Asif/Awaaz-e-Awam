# Decisions Log

Locked decisions for Awaaz-e-Awam (Urdu voice-to-form). Each entry: the choice,
why, and what would make us revisit it. See `ROADMAP.md` for the phased plan.

## Product & scope

| #   | Decision                                                                                   | Rationale                                                                 | Revisit if                                                    |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| D1  | Keep Next.js; no DB, no auth, no microservices                                             | Hackathon-to-product scope, zero budget, single deployable                | Real user accounts or server-side persistence become required |
| D2  | Nov-15 submission = **Speak core loop only**                                               | Only demoable, low-risk scope fits the deadline                           | A scan demo is needed for the pitch                           |
| D3  | Speak is **template-first**: pick a ready-made form → speak → extraction fills it → export | Reuses the shipped `/fill` + `lib/templates` pipeline; concrete, demoable | Generic free-form capture becomes the primary flow            |
| D4  | Generic dynamic Speak form + `lib/concepts.ts` registry = **post-Nov 15**                  | Concept registry only needed once a target template is absent             | Template-first proves insufficient for the pitch              |
| D5  | Launch = **public web app processing real citizen PII**, region Pakistan/non-EEA           | Stated launch shape                                                       | Launch narrowed to demo/synthetic only                        |
| D6  | PWA/offline = **out of scope**                                                             | Not needed for the core loop                                              | Connectivity is the primary blocker for users                 |

## AI providers

| #   | Decision                                                                         | Rationale                                                           | Revisit if                                       |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| D7  | **Groq Whisper-large-v3 = primary STT** (Speak + Scan, shared `/api/transcribe`) | Strong Urdu/multi-dialect, fast, free tier                          | Urdu WER unacceptable vs alternatives            |
| D8  | **Gemini STT = fallback** (demote, do not remove)                                | Coverage when Groq is down or rate-limited                          | Groq proves reliable enough to drop the fallback |
| D9  | **Groq = the only LLM on the real-PII path**; Gemini = demo/synthetic only       | Gemini free tier trains on content + human review; terms forbid PII | Gemini offers a no-train, ZDR tier we can afford |
| D10 | Route via `DATA_PATH=sensitive\|demo` behind one `Provider` interface            | Single choke point for the compliance boundary                      | —                                                |
| D11 | **ElevenLabs rejected for STT**                                                  | ~30 min/mo free, no commercial license; parked for TTS only         | Budget exists for a paid STT license             |
| D12 | Eval bar: **WER < 30%, field F1 > 0.85**, validators pass                        | Objective quality gate before deadline                              | Bar proves unrepresentative of real usage        |

## Export & scan

| #   | Decision                                                                   | Rationale                                                             | Revisit if                                        |
| --- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| D13 | Export = **pdf-lib** (`lib/fill-form.ts`) with tweaks (font/DPI/page size) | Already installed and shipping; generates PDFs from the filled canvas | A vector/editable PDF is required                 |
| D14 | **pdf.js is NOT for export** — it renders/parses, cannot create PDFs       | Wrong tool for generation; belongs to Scan input                      | —                                                 |
| D15 | **Tesseract.js = Scan OCR**, post-Nov 15; image never leaves the browser   | On-device PII handling for forms (English/Latin)                      | OCR quality on Urdu/Arabic-script forms is needed |
| D16 | **pdf.js for digital PDFs** during Scan (rasterize → OCR), post-Nov 15     | Templates/digital forms need pages as images first                    | —                                                 |
| D17 | Speak → "map onto a chosen form" (scan history + scan-new) = backlog       | Natural extension of template-first; not on the deadline              | Pulled into scope if the pitch needs it           |

## Tooling & quality

| #   | Decision                                                                                               | Rationale                                                             | Revisit if                                          |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------- |
| D18 | Comments: file-header purpose + one-line JSDoc per function; `ponytail:` on simplifications            | Readable for judges/next devs without narrating obvious code          | —                                                   |
| D19 | Tests via **vitest** (+ `@vitest/coverage-v8`)                                                         | Recognizable stack; covers TS paths, JSON, later components           | Zero-dep `node:test` proves sufficient              |
| D20 | **CI on every push/PR** (check-mode: `typecheck` → `lint` → `format:check` → `test`)                   | A visible green check is the credibility signal, more than the runner | —                                                   |
| D24 | **Auto-format on commit**: husky + lint-staged run `eslint --fix` + `prettier --write` on staged files | gofmt -w behavior without the manual step                             | The hook's reformat churn outweighs the convenience |

## Channels (post-Nov 15)

| #   | Decision                                                                        | Rationale                                                                                         | Revisit if                                  |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| D21 | WhatsApp via **Meta Cloud API (direct)**, not a BSP                             | Zero budget; BSPs add markup. Inbound free; 1,000 free service msgs/number/month from Oct 1, 2026 | BSP DX becomes worth the cost               |
| D22 | WhatsApp session state in a **free-tier KV** (Upstash/Vercel), keyed by `wa_id` | Only justified exception to "no DB"; WhatsApp is stateless/multi-turn                             | A stateless encoding scheme proves workable |
| D23 | WhatsApp reply format = **undecided** (link vs PDF document)                    | Decide after Scan/export settle                                                                   | —                                           |

## Constraints

- **Zero budget** — free tiers only; flag any card-gated service.
- **No DB** except a free-tier KV for WhatsApp session state (D22).
- API keys **server-side only**; never committed.
- Test data **synthetic**; no real CNIC/phone in dev or demos.
- Keep both entry modes (Speak, Scan) working.

## Provider compliance notes (re-verify before launch, Oct 2026 data)

- **Gemini free tier:** content used to improve products; human reviewers may read it;
  terms forbid submitting PII; EEA/CH/UK paid-only; "not for consumer use."
- **Groq free tier:** no training unless permitted; Zero Data Retention available;
  30-day logs. Whisper 2,000 RPD; chat models ~1,000 RPD / 200k TPD each, org-wide.
- **ElevenLabs free:** 10k credits/mo; TTS 1 credit/char; STT 330 credits/min;
  no commercial use until Starter tier.
