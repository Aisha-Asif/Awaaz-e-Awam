<div align="center">

<br/>

<!-- Logo / Wordmark -->
<h1>
  <span>Awaaz-e-Awam</span>
  &nbsp;·&nbsp;
  <span>آواز عوام</span>
</h1>

**Multi-Dialect Urdu Voice-to-Form Assistant**

*Your voice. Your forms.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)

<br/>

> Built for the **Bano Qabil Hackathon** — an initiative to make technology accessible to every Pakistani citizen, in their own language.

<br/>

---

</div>

## The Problem

Government and institutional forms in Pakistan are written in a vocabulary that most citizens do not use in everyday conversation.

A form says **"Father's Name"**. A citizen says **"mere abu ka naam Ahmed hai."**

That single mismatch — repeated across dozens of fields, across millions of citizens — locks out people who are perfectly capable of providing the information, but not fluent in the bureaucratic dialect required to fill the box.

Low-literacy citizens, elderly Pakistanis, rural communities, and anyone navigating a form in a second language face this wall every day. There is no system that meets them where they are — **speaking naturally, in Urdu, the way they actually talk.**

Awaaz-e-Awam is that system.

---

## The Solution

> *"Show me the form. Just talk to it."*

Awaaz-e-Awam turns any government form into a plain Urdu conversation. You do not need to understand the structure of the form, the vocabulary it uses, or even how to read it. You speak — and the form fills itself.

The application offers **two complete user flows:**

### 🎙 Mode A — Speak Naturally
Say everything at once, in a single natural utterance. The AI listens, understands your Urdu (or Roman Urdu, or a mix of both), maps your words to the correct form fields, and asks a single plain question for anything it did not catch.

```
"Mera naam Ali Raza hai. Mere walid ka naam Ahmed Raza hai. Main Lahore mein rehta hoon."

→  Full Name:    Ali Raza
→  Father's Name: Ahmed Raza
→  City:          Lahore
→  CNIC:          [will ask next]
```

### 📷 Mode B — Scan a Form
Photograph any paper form using your camera or upload an image. The AI reads the form, identifies every field, and then **interviews you** — one plain Urdu question at a time — until every required field is filled. It then shows you exactly where to write each answer on the physical paper.

```
📷  Upload form image
→   AI detects: Full Name, Father's Name, CNIC, DOB, Phone, City...
→   "Aap ka poora naam kya hai?"
→   User speaks → answer extracted, validated, confirmed
→   Next field → repeat
→   ✅  All fields complete. Copy answers. Write on form.
```

---

## Features

| Feature | Description |
|---------|-------------|
| 🎙 **Browser Audio Recording** | Live recording via `MediaRecorder` API with automatic audio-upload fallback if microphone permission is denied |
| 📷 **Form Image Scanning** | Camera capture or file upload; Gemini Vision reads any printed form and returns a typed field schema |
| 🗣️ **Multi-Dialect Urdu NLU** | Understands standard Urdu, Roman Urdu, and Urdu-English code-switching — the way Pakistanis actually speak |
| 🤖 **AI-Powered Urdu Interview** | Asks one plain Urdu question per missing field — never a wall of ten blanks at once |
| ✅ **Smart Deterministic Validation** | CNIC (13-digit normalization), Pakistani phone formats, and date parsing are handled by application code — not guessed by an LLM |
| 🔁 **Sensitive Field Confirmation** | CNIC, phone number, and date of birth are always read back to the user before being accepted |
| 🗺️ **Physical Form Guidance** | Validated answers are displayed beside the original scanned form image so the user knows exactly where to write |
| 📋 **Copy & JSON Export** | One-tap copy of all answers as plain text, or the raw structured JSON for downstream use |
| 🔊 **Text-to-Speech** | Questions are read aloud via Gemini TTS, with browser `SpeechSynthesis` as a fallback — the app works even if TTS is unavailable |
| 🔒 **Server-side API Security** | Gemini API key lives only in server-side Next.js routes — never exposed to the browser |

---

## Technology Stack

```
┌─────────────────────────────────────────────┐
│                   Frontend                  │
│      Next.js 14 · React · TypeScript        │
│      Tailwind CSS · Custom CSS Variables    │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│              Next.js API Routes             │
│  /api/scan-form      /api/process-speech    │
│  /api/process-answer /api/next-question     │
│  /api/generate-question                     │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│              AI Services  (lib/)            │
│   Form Vision Agent · Answer Extraction     │
│   Agent · Interview Logic · Validation      │
│   Zod Schemas · Custom CNIC/Phone/Date      │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│              Google Gemini API              │
│   Vision (form reading) · Language (NLU)   │
│   Generation (Urdu questions) · TTS        │
└─────────────────────────────────────────────┘
```

### Agent Architecture

The AI layer is split into two cleanly separated, independently testable agents:

**Form Vision Agent** — receives a form image, returns a typed `FormSchema` with field labels, IDs, types, required flags, and generated Urdu questions.

**Answer Extraction Agent** — receives a target field and a user transcript, returns a structured, validated answer with a `needsConfirmation` flag for sensitive fields.

Interview sequencing — which field to ask next, when the form is complete — is handled by **deterministic application logic**, not by an LLM. This keeps the flow predictable, fast, and testable.

---

## Project Structure

```
awaaz-e-awam/
├── app/
│   ├── api/
│   │   ├── next-question/     # Deterministic interview sequencing
│   │   ├── process-answer/    # Answer extraction via Gemini
│   │   ├── process-speech/    # Full utterance → structured fields
│   │   └── scan-form/         # Form image → FormSchema
│   ├── scan/                  # Scan Mode page
│   ├── speak/                 # Speak Mode page
│   ├── globals.css            # Design tokens & global styles
│   └── layout.tsx
│
├── components/
│   ├── AnswerCard.tsx          # Displays an extracted field value
│   ├── AnswerConfirmation.tsx  # Confirms extracted answer with user
│   ├── AnswerInput.tsx         # Text input fallback for voice
│   ├── AudioRecorder.tsx       # MediaRecorder + upload fallback
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── CompletionScreen.tsx    # Final answers + copy/export
│   ├── ConfirmationDialog.tsx  # "Kya yeh sahi hai?" modal
│   ├── ImageCapture.tsx        # Camera + file upload for forms
│   ├── Input.tsx
│   ├── InterviewHeader.tsx     # Form title + progress display
│   ├── Progress.tsx
│   ├── ProgressIndicator.tsx
│   ├── QuestionCard.tsx        # Renders the current Urdu question
│   ├── QuestionDisplay.tsx
│   ├── TTS.tsx                 # Text-to-speech (Gemini → browser fallback)
│   └── VoiceAnswerButton.tsx   # Push-to-record per-field button
│
└── lib/
    ├── types.ts                # Shared TypeScript types (FormField, FormSchema…)
    ├── gemini.ts               # Gemini API client
    ├── prompts.ts              # All AI prompt templates
    ├── validation.ts           # CNIC, phone, date validators
    └── schemas.ts              # Zod schemas
```

---

## API Contract

The frontend and backend communicate through a strict, documented API contract. Every endpoint accepts and returns typed JSON — the frontend never calls Gemini directly.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/scan-form` | `POST` | Image → `FormSchema` (field list with Urdu questions) |
| `/api/process-speech` | `POST` | Audio → transcript + extracted fields + missing field list |
| `/api/process-answer` | `POST` | Transcript → structured answer for a specific field |
| `/api/next-question` | `POST` | Current answers → next missing required field |
| `/api/generate-question` | `POST` | Field metadata → Urdu question string |

---

## Data Schema

The core citizen form schema supported out of the box:

```typescript
type CitizenForm = {
  fullName:    string | null;   // required
  fatherName:  string | null;   // required
  cnic:        string | null;   // required — validated to 13 digits
  dateOfBirth: string | null;   // required — normalized to YYYY-MM-DD
  phone:       string | null;   // required — normalized Pakistani format
  city:        string | null;   // required
  gender:      string | null;   // optional
  address:     string | null;   // optional
  district:    string | null;   // optional
};
```

CNIC normalization supports `35202-1234567-1` and `3520212345671`. Phone normalization supports `03001234567`, `+923001234567`, and `923001234567`.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/) API key (free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/afafshahid/Awaaz-e-Awam.git
cd Awaaz-e-Awam

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Gemini API key to .env.local:
# GEMINI_API_KEY=your_key_here

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Security note:** Never use `NEXT_PUBLIC_GEMINI_API_KEY`. The API key must only exist server-side. The `.env*` pattern is in `.gitignore` — do not commit it.

---

## Demo

### Demo A — Scan Mode

1. Open the app and select **Scan a Form**
2. Upload or photograph a form (use the included demo citizen form)
3. Watch Gemini identify all 9 fields automatically
4. Answer each question by speaking in Urdu — *"Mera naam Ali Raza hai"*
5. Confirm your CNIC when read back
6. See all answers laid out beside the original form, ready to copy

### Demo B — Speak Mode

1. Select **Speak Naturally**
2. Record a single utterance: *"Mera naam Ali Raza hai, mere walid ka naam Ahmed Raza hai, main Lahore mein rehta hoon"*
3. Watch the AI extract three fields simultaneously
4. Answer the remaining fields (CNIC, phone, DOB) one question at a time
5. Copy the completed form or export as JSON

---

## Design System

The visual design uses a warm, culturally rooted palette — grounded in ink and paper rather than the sterile blues of generic civic tech.

| Token | Value | Role |
|-------|-------|------|
| `--ink` | `#12302B` | Dark teal-green — primary dark background |
| `--paper` | `#FBF6EA` | Warm cream — primary light background |
| `--marigold` | `#E29A34` | Gold — primary accent, calls to action |
| `--rani` | `#B23A32` | Deep red — Speak Mode accent |
| `--jade` | `#4F8F6D` | Forest green — Scan Mode accent |

Typography pairs **Lora** (serif, headings) with **Work Sans** (sans-serif, body) and **Noto Nastaliq Urdu** for Urdu script — ensuring the language of the product matches the language of its users.

---

## Validation Rules

All validation is deterministic application code — no LLM is asked to guess whether an identifier has the correct format.

**CNIC** — accepts `XXXXX-XXXXXXX-X` and 13-digit raw. Normalized to 13 digits internally. Requires confirmation before acceptance.

**Phone** — accepts `03XXXXXXXXX`, `+92XXXXXXXXXX`, `92XXXXXXXXXX`. Normalized to `03XXXXXXXXX`. Requires confirmation.

**Date of Birth** — parses common Pakistani date formats. Normalizes to `YYYY-MM-DD`. Requires confirmation.

**Unknown answers** are never guessed — the field is set to `null` and the question is re-asked.

---

## Privacy

> This application is a demonstration. Please do not enter real CNIC numbers, phone numbers, or other personal identity information.

During the build phase:
- No audio is persisted to disk by default
- No user accounts or session storage are created
- No real government APIs are called
- Synthetic demo data is used throughout

---

## What's Next

The MVP demonstrates the core idea. Here is where it goes next:

**Near-term**
- Pre-loaded schemas for NADRA, FBR, and BISP forms — no scan required
- Sindhi and Punjabi language support
- Offline PWA mode for 2G/no-connectivity environments

**Mid-term**
- Reliable bounding-box field highlighting on scanned form images
- WhatsApp / SMS interface — deliver the interview through channels Pakistanis already use daily
- Session history so users can return to a partially completed form

**Long-term**
- Direct e-submission to government e-portals on the user's behalf
- Fine-tuned language model on regional Pakistani dialects
- Full accessibility layer — screen-reader optimised flow and braille-compatible output

---

## Contributors

Built during the **Bano Qabil Hackathon** build phase by:

<br/>

<table align="center">
  <tr>
    <td align="center">
      <b>Afaf Shahid</b><br/>
      <sub>AI/Backend · Gemini Integration · API Design · Validation</sub>
    </td>
    <td align="center">
      <b>Aisha Asif</b><br/>
      <sub>Frontend · UI/UX · Component Architecture · Voice I/O</sub>
    </td>
    <td align="center">
      <b>Taha Nauman</b><br/>
      <sub>Full-Stack · Interview Logic · Integration · Testing</sub>
    </td>
  </tr>
</table>

<br/>

---

## License

This project was built for the **Bano Qabil Hackathon**. All rights reserved by the contributors.

---

<div align="center">

<br/>

**Awaaz-e-Awam — آواز عوام**

*A person should be able to complete a difficult form by simply talking to it.*

*The technology exists to serve that experience.*

<br/>

</div>
