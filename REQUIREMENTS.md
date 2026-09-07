# Awaaz-e-Awam — REQUIREMENTS.md

## 1. Project Name

**Awaaz-e-Awam — Multi-Dialect Urdu Voice-to-Form Assistant**

---

## 2. Hackathon Objective

Build a working one-day MVP that demonstrates one simple idea:

> **A person should not have to understand the structure or bureaucratic language of a form in order to complete it.**

Awaaz-e-Awam turns difficult forms into a conversational experience.

The user must have TWO ways to use the product:

### Mode A — Speak Naturally

The user speaks naturally in Urdu/Roman Urdu.

The AI understands the speech and converts the information into structured form fields.

### Mode B — Scan a Form

The user photographs or uploads a physical form.

AI reads the form, identifies its fields, and then interviews the user one field at a time in Urdu.

The user answers by voice or text.

The system validates the answers and shows the user exactly what information they need to write on the physical form.

---

# 3. Critical MVP Rule

This is a **one-day hackathon MVP** with:

- 2 team members
- zero budget
- AI coding agents
- Gemini API/free-tier access where available

Do not build production infrastructure.

Do not spend time on features that do not improve the core demonstration.

The priority is:

1. Speak → structured information
2. Scan → understand form
3. Form → Urdu questions
4. User → voice/text answers
5. Validation
6. Final answers
7. Physical form guidance
8. Visual polish

---

# 4. User Problem

Many forms use terms and structures that users do not naturally use in conversation.

For example, a form may say:

> Father's Name

The user may say:

> "Mere abu ka naam Ahmed hai."

The application must understand that:

```text
abu
walid
father
father's name
```

can refer to the same field.

The user should not need to know the exact wording used by the form.

---

# 5. Target Experience

The product should feel like:

> "Show me the form, then just talk to me."

Instead of making the user understand:

```text
Field 1
Field 2
Field 3
Field 4
```

the system should ask:

> "Aap ka poora naam kya hai?"

Then:

> "Aap ke walid ka naam kya hai?"

Then:

> "Aap ka CNIC number kya hai?"

The system should ask only for information that is missing.

---

# 6. Two Main User Flows

## FLOW A — Speak Naturally

```text
Home
  ↓
Speak Naturally
  ↓
Microphone / Audio Upload
  ↓
Speech Understanding
  ↓
Extract Form Information
  ↓
Validate
  ↓
Show Structured Form
  ↓
Ask For Missing Information
  ↓
User Answers
  ↓
Validate
  ↓
Completed Form
  ↓
Copy / JSON
```

---

## FLOW B — Scan a Physical Form

```text
Home
  ↓
Scan a Form
  ↓
Camera / Image Upload
  ↓
AI Reads Form
  ↓
Generate Form Schema
  ↓
Show Detected Fields
  ↓
Start Voice Interview
  ↓
Ask Urdu Question
  ↓
User Speaks / Types
  ↓
Extract Answer
  ↓
Validate
  ↓
Confirm Important Answers
  ↓
Ask Next Question
  ↓
All Required Fields Complete
  ↓
Show Final Answers
  ↓
Show Original Form
  ↓
Guide User Where To Write
  ↓
Copy Answers
```

---

# 7. Speak Mode Requirements

The user must be able to:

- record audio from browser
- stop recording
- upload an audio file as fallback
- see processing status
- see transcript/result
- see extracted fields
- edit extracted fields
- answer missing fields
- see validation errors
- copy completed information
- copy final JSON

The application must understand reasonable:

- Urdu
- Roman Urdu
- Urdu-English code switching
- informal Pakistani Urdu
- conversational phrasing

Example:

> "Mera naam Ali Raza hai, mere abu ka naam Ahmed Raza hai, main Lahore mein rehta hoon."

Should produce approximately:

```json
{
  "fullName": "Ali Raza",
  "fatherName": "Ahmed Raza",
  "city": "Lahore"
}
```

Unknown values must remain `null`.

---

# 8. Scan Mode Requirements

The user must be able to:

- upload an image of a form
- preferably capture an image using browser camera
- preview the image
- send the image for AI analysis
- see detected fields
- start an interview
- hear/read each question
- answer by voice
- optionally type an answer
- see the interpreted answer
- correct the answer
- continue to the next field
- see progress
- finish the form
- see all collected information
- copy all answers
- view the original form

---

# 9. Form Understanding

Gemini should analyze the uploaded form image.

The output must identify:

- form title if visible
- field label
- field ID
- field type
- whether required
- natural Urdu question
- optional approximate bounding box

Example:

```json
{
  "formTitle": "Citizen Information Form",
  "fields": [
    {
      "id": "fullName",
      "label": "Full Name",
      "type": "text",
      "required": true,
      "questionUrdu": "Aap ka poora naam kya hai?"
    },
    {
      "id": "fatherName",
      "label": "Father's Name",
      "type": "text",
      "required": true,
      "questionUrdu": "Aap ke walid ka naam kya hai?"
    }
  ]
}
```

Do not invent fields that are not visible.

---

# 10. Demo Form

For reliability, create a fictional demo form.

Use:

```text
---------------------------------------
        CITIZEN INFORMATION FORM
---------------------------------------

Full Name:
_______________________________________

Father's Name:
_______________________________________

CNIC:
_______________________________________

Date of Birth:
_______________________________________

Gender:
_______________________________________

Mobile Number:
_______________________________________

Address:
_______________________________________

City:
_______________________________________

District:
_______________________________________
```

Use synthetic information during the demo.

Do not require real government forms.

---

# 11. Standard Demo Schema

The initial demo should support:

```typescript
type CitizenForm = {
  fullName: string | null;
  fatherName: string | null;
  cnic: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
};
```

Required:

- fullName
- fatherName
- cnic
- dateOfBirth
- phone
- city

Optional:

- gender
- address
- district

---

# 12. Validation

Validation should be deterministic application code whenever possible.

Do not ask an LLM to decide whether a simple identifier has the correct syntax.

Use Zod and/or custom validators.

## CNIC

Support:

```text
35202-1234567-1
3520212345671
```

Normalize to 13 digits internally.

## Phone

Support common Pakistani formats such as:

```text
03001234567
+923001234567
923001234567
```

## Date

Normalize clear dates to:

```text
YYYY-MM-DD
```

Never invent ambiguous information.

---

# 13. Missing Fields

The system should determine the first missing required field.

Suggested order:

```text
fullName
fatherName
cnic
dateOfBirth
phone
city
address
```

Ask one question at a time.

Example:

```text
Information needed

Aap ka CNIC number kya hai?
```

Do not ask ten questions simultaneously.

---

# 14. Important Answer Confirmation

Require confirmation for potentially sensitive or error-prone fields:

- CNIC
- phone
- date of birth

Example:

```text
I heard:

3520212345671

Is this correct?

[ Yes ] [ Correct ]
```

The user must be able to edit the answer.

---

# 15. Voice Output

Questions must always be visible as text.

Voice output should be available.

Preferred order:

1. Gemini-supported TTS/voice capability if practical and available.
2. Browser SpeechSynthesis fallback.
3. Never block the entire MVP because TTS is unavailable.

The application must still work if voice playback fails.

---

# 16. Voice Input

Primary:

Browser `MediaRecorder`.

Fallback:

Audio upload.

The interface must show:

```text
Ready
Recording
Processing
Success
Error
```

Microphone permission errors must provide an upload fallback.

---

# 17. Physical Form Guidance

The physical paper form remains the user's actual document.

The application should show:

```text
Your information is ready.

Full Name:
Muhammad Ali

Father's Name:
Muhammad Ahmed

CNIC:
3520212345671

Date of Birth:
1998-03-12

Phone:
03001234567

City:
Lahore
```

Buttons:

```text
Copy All
Read Answers
Show Form
```

If reliable field coordinates are available, highlight the corresponding field on the scanned image.

If coordinates are unreliable, DO NOT show misleading highlights.

A clean field-by-field list is better.

---

# 18. AI Provider

Use **Google Gemini API** for the zero-budget MVP.

Gemini is responsible for AI tasks such as:

- understanding form images
- understanding natural language
- extracting structured information
- generating natural Urdu questions where necessary

The exact Gemini model name must be checked against currently available Google AI Studio/API models before implementation.

Do not assume an old model name is still available.

---

# 19. API Key Security

Use:

```env
GEMINI_API_KEY=your_key_here
```

The API key must only exist server-side.

Never use:

```env
NEXT_PUBLIC_GEMINI_API_KEY
```

Never put the key in frontend JavaScript.

Never commit `.env.local`.

`.gitignore` must include:

```text
.env*
```

---

# 20. Application Architecture

Use a single Next.js application.

Do NOT create microservices.

Recommended architecture:

```text
Frontend
   ↓
Next.js API routes
   ↓
AI services / validation
   ↓
Gemini
```

Logical agents can exist as modules, but they do not need to be separate deployed services.

---

# 21. Logical AI Agents

## Agent A — Form Vision Agent

Input:

```text
Form image
```

Output:

```text
FormSchema
```

Responsibilities:

- understand form
- identify fields
- classify field types
- generate Urdu questions
- optionally identify field coordinates

---

## Agent B — Answer Extraction Agent

Input:

```text
Target field
User transcript
```

Output:

```text
Structured answer
```

Responsibilities:

- understand natural Urdu
- understand Roman Urdu
- map answer to target field
- normalize safe formats
- flag answers requiring confirmation

---

## Interview Logic

Prefer deterministic code for:

- selecting the next missing field
- checking required fields
- tracking progress
- determining completion

Do not use an LLM for logic that can be reliably implemented in normal code.

---

# 22. AI Prompt Rules

Every extraction prompt must follow:

1. Never invent information.
2. Missing information must be `null`.
3. Only extract information explicitly stated.
4. Understand Urdu/Roman Urdu/code switching.
5. Map conversational words to form fields.
6. Normalize obvious formats.
7. Do not infer sensitive information.
8. Ask for clarification when necessary.
9. Return structured JSON.
10. Follow the provided schema exactly.

---

# 23. Error Handling

Handle:

### Microphone denied

```text
Microphone access is unavailable.

You can upload an audio file instead.
```

### Bad image

```text
We could not read this image.

Please take a clearer photo with the entire form visible.
```

### AI failure

```text
We could not process this response.

Please try again.
```

Never expose raw API errors or API keys.

### Invalid answer

Example:

```text
This does not look like a valid CNIC.

Please enter or say the 13-digit CNIC again.
```

---

# 24. Privacy

Display:

> Demo only. Please do not enter real sensitive identity information.

For the hackathon:

- use synthetic data
- do not persist audio by default
- do not store real CNICs
- do not build user accounts
- do not claim government security/compliance

---

# 25. Frontend Design

The UI should immediately communicate the two modes.

Home:

```text
Awaaz-e-Awam

Your voice. Your forms.

How would you like to begin?

[ 🎙 Speak Naturally ]

Speak your information in Urdu.

[ 📷 Scan a Form ]

Take a picture of your physical form.
```

Use a clean, modern, accessible design.

Large buttons.

Clear progress.

Minimal technical jargon.

---

# 26. Team Role Architecture (Role-Based Split)

This section defines role ownership boundaries for parallel work.

These roles can be fulfilled by two or more contributors.

## Role A — AI/Backend

Owns:

```text
lib/
app/api/
```

Responsibilities:

- Gemini integration
- form vision
- extraction
- validation
- interview logic
- API endpoints
- tests

Must NOT build the main frontend.

---

## Role B — Frontend

Owns:

```text
components/
app/page.tsx
app/speak/
app/scan/
```

Responsibilities:

- UI
- camera
- microphone
- audio upload
- form display
- questions
- voice playback
- progress
- answer confirmation
- final results
- copy buttons

Initially use mock data.

---

# 27. Shared Files

Both agents may use:

```text
lib/types.ts
API_CONTRACT.md
REQUIREMENTS.md
```

Do not change API contracts casually.

---

# 28. Git Strategy

Use one repository.

Branches:

```text
main

feature/ai-backend

feature/frontend
```

Neither developer should work directly on `main`.

Merge backend first.

Test.

Then merge frontend.

Test again.

---

# 29. Development Timeline

## Hour 0–1

Both:

- create project
- install dependencies
- read REQUIREMENTS.md
- read API_CONTRACT.md
- confirm Gemini access
- confirm app starts

---

## Hour 1–3

Role A:

- Gemini connection
- scan-form API
- form schema

Role B:

- home
- Speak screen
- Scan screen
- mock form data

---

## Hour 3–5

Role A:

- answer extraction
- validation
- missing-field logic

Role B:

- recorder
- upload
- interview UI
- answer display

---

## Hour 5–7

Role A:

- complete API contract
- integration testing

Role B:

- connect real APIs
- camera
- question flow
- progress

---

## Hour 7–9

Both:

- integrate
- test complete flows
- fix P0 bugs
- implement confirmation

---

## Hour 9–10

- physical form guidance
- copy functionality
- final JSON
- voice output fallback

---

## Hour 10–11

- deploy
- HTTPS microphone testing
- production environment
- end-to-end testing

---

## Hour 11–12

- rehearse demo
- prepare backup
- remove broken features
- polish UI

---

# 30. Demo Script

### Demo 1 — Scan

```text
Scan form
↓
AI identifies 9 fields
↓
Start interview
↓
"Aap ka poora naam kya hai?"
↓
User speaks
↓
Answer appears
↓
Next question
↓
CNIC confirmation
↓
Completed
↓
Show answers beside original form
```

### Demo 2 — Speak

```text
Speak Naturally
↓
User says:
"Mera naam Ali Raza hai..."
↓
AI extracts fields
↓
Form appears
↓
Missing fields identified
↓
User completes them
↓
Copy final JSON
```

---

# 31. Success Criteria

The MVP is complete when:

- [ ] Home screen has both modes.
- [ ] Speak Mode works end-to-end.
- [ ] Scan Mode works end-to-end.
- [ ] Gemini works.
- [ ] Gemini key is server-side.
- [ ] Urdu is reasonably understood.
- [ ] Roman Urdu is reasonably handled.
- [ ] Form image creates a schema.
- [ ] Urdu questions are generated/displayed.
- [ ] User can answer by voice.
- [ ] User can type if voice fails.
- [ ] Important fields can be confirmed/edited.
- [ ] Required fields are tracked.
- [ ] CNIC/phone/date are validated.
- [ ] Final answers are copyable.
- [ ] Original physical form can be viewed.
- [ ] No real government API is required.
- [ ] Five test scenarios work.
- [ ] Demo can be completed in approximately two minutes.

---

# 32. Fallback Strategy

If time is running out:

REMOVE:

- database
- authentication
- multiple government forms
- advanced bounding-box mapping
- dialect classification
- automatic writing on paper
- unnecessary agent frameworks

KEEP:

- Speak Mode
- Scan Mode
- Gemini
- form understanding
- Urdu interview
- voice input
- text input fallback
- validation
- answer confirmation
- final answers
- physical form display

If TTS fails:

Use browser SpeechSynthesis.

If microphone fails:

Use audio upload or text input.

If dynamic scanning fails:

Use the predefined fictional demo form.

If field highlighting fails:

Show a clear field-by-field answer list.

---

# 33. Final Principle

Build a small, reliable demonstration of this idea:

> **A person should be able to complete a difficult form by simply talking to it.**

The technology exists to serve that experience.

Do not build technology for its own sake.
