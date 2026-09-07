# Awaaz-e-Awam — API_CONTRACT.md

## Purpose

This document is the communication agreement between:

- **Agent A — AI/Backend**
- **Agent B — Frontend**

Both agents MUST follow this contract.

Do not change request or response structures without agreement between both team members.

---

# 1. General Rules

Base URL during local development:

```text
http://localhost:3000
```

Frontend calls:

```text
/api/...
```

Do not call Gemini directly from the browser.

The frontend communicates only with the Next.js backend API.

The backend communicates with Gemini.

---

# 2. Shared Data Types

Create/use:

```typescript
export type FormFieldType =
  | "text"
  | "number"
  | "date"
  | "cnic"
  | "phone"
  | "address"
  | "select"
  | "checkbox"
  | "unknown";

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  questionUrdu: string;
  questionEnglish?: string;
  boundingBox?: BoundingBox;
};

export type FormSchema = {
  formTitle: string;
  fields: FormField[];
};

export type Answer = {
  fieldId: string;
  value: string | null;
};

export type ValidationError = {
  fieldId: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  missingFields: string[];
  invalidFields: ValidationError[];
};

export type ProcessAnswerResponse = {
  fieldId: string;
  value: string | null;
  valid: boolean;
  needsConfirmation: boolean;
  error: string | null;
};

export type NextQuestionResponse = {
  nextField: string | null;
  questionUrdu: string | null;
  complete: boolean;
};
```

---

# 3. API #1 — Scan Form

## Endpoint

```text
POST /api/scan-form
```

## Purpose

Send a physical form image to the backend.

The backend sends the image to Gemini.

Gemini identifies the form fields.

---

## Request

Use:

```text
multipart/form-data
```

Field:

```text
image
```

Example frontend:

```typescript
const formData = new FormData();

formData.append("image", imageFile);

const response = await fetch("/api/scan-form", {
  method: "POST",
  body: formData
});
```

Do NOT manually set the `Content-Type` header for `FormData`.

---

## Successful Response

HTTP:

```text
200
```

JSON:

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
    },
    {
      "id": "cnic",
      "label": "CNIC",
      "type": "cnic",
      "required": true,
      "questionUrdu": "Aap ka CNIC number kya hai?"
    }
  ]
}
```

---

## Bounding Box

If reliable:

```json
{
  "boundingBox": {
    "x": 0.12,
    "y": 0.25,
    "width": 0.5,
    "height": 0.08
  }
}
```

Coordinates should preferably be normalized from `0` to `1`.

Example:

```text
x = 0.1
```

means 10% from the left.

If the location is not reliable:

```text
omit boundingBox
```

Never invent coordinates.

---

## Error Response

HTTP:

```text
400
```

or:

```text
500
```

JSON:

```json
{
  "error": "Could not process form image."
}
```

Do not expose Gemini API errors.

---

# 4. API #2 — Process Answer

## Endpoint

```text
POST /api/process-answer
```

## Purpose

Convert a user's natural-language answer into the value for a specific form field.

The frontend may send:

- transcript from speech recognition
- typed text

The backend uses Gemini to understand the answer.

---

## Request

```json
{
  "fieldId": "fullName",
  "fieldType": "text",
  "transcript": "Mera naam Muhammad Ali hai."
}
```

---

## Example CNIC Request

```json
{
  "fieldId": "cnic",
  "fieldType": "cnic",
  "transcript": "Mera CNIC 35202-1234567-1 hai."
}
```

---

## Successful Response

```json
{
  "fieldId": "fullName",
  "value": "Muhammad Ali",
  "valid": true,
  "needsConfirmation": false,
  "error": null
}
```

---

## CNIC Response

```json
{
  "fieldId": "cnic",
  "value": "3520212345671",
  "valid": true,
  "needsConfirmation": true,
  "error": null
}
```

The frontend must show confirmation when:

```text
needsConfirmation === true
```

---

## Invalid Response

Example:

```json
{
  "fieldId": "cnic",
  "value": "12345",
  "valid": false,
  "needsConfirmation": false,
  "error": "CNIC must contain 13 digits."
}
```

---

## Unknown Answer

If the AI cannot confidently extract a value:

```json
{
  "fieldId": "dateOfBirth",
  "value": null,
  "valid": false,
  "needsConfirmation": false,
  "error": "The date was unclear. Please provide the date again."
}
```

Never guess.

---

# 5. API #3 — Next Question

## Endpoint

```text
POST /api/next-question
```

## Purpose

Determine which field should be asked next.

This should primarily use deterministic application logic.

No Gemini call is required unless there is a specific reason.

---

## Request

```json
{
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
    },
    {
      "id": "cnic",
      "label": "CNIC",
      "type": "cnic",
      "required": true,
      "questionUrdu": "Aap ka CNIC number kya hai?"
    }
  ],
  "answers": {
    "fullName": "Muhammad Ali",
    "fatherName": null,
    "cnic": null
  }
}
```

---

## Response

```json
{
  "nextField": "fatherName",
  "questionUrdu": "Aap ke walid ka naam kya hai?",
  "complete": false
}
```

---

## Completed Response

```json
{
  "nextField": null,
  "questionUrdu": null,
  "complete": true
}
```

---

# 6. API #4 — Process Initial Speech

## Endpoint

```text
POST /api/process-speech
```

## Purpose

Speak Mode allows the user to speak several pieces of information at once.

The backend processes the audio and returns:

- transcript
- extracted fields
- validation
- missing fields

---

## Request

Use:

```text
multipart/form-data
```

Primary field:

```text
audio
```

Optional:

```text
formType
```

Fallback input (for browser-STT/testing paths):

```text
transcript
```

At least one of `audio` or `transcript` must be provided.

Example:

```text
audio = recording.webm
formType = citizen
```

---

## Successful Response

```json
{
  "transcript": "Mera naam Ali Raza hai. Mere walid ka naam Ahmed Raza hai. Main Lahore mein rehta hoon.",
  "extracted": {
    "fullName": "Ali Raza",
    "fatherName": "Ahmed Raza",
    "cnic": null,
    "dateOfBirth": null,
    "gender": null,
    "phone": null,
    "address": null,
    "city": "Lahore",
    "district": null
  },
  "validation": {
    "valid": false,
    "missingFields": [
      "cnic",
      "dateOfBirth",
      "phone"
    ],
    "invalidFields": []
  },
  "followUpQuestion": "Aap ka CNIC number kya hai?"
}
```

---

# 7. API #5 — Transcribe Audio

## Endpoint

```text
POST /api/transcribe
```

## Purpose

Transcribe uploaded audio and return a transcript string.

---

## Request

Use:

```text
multipart/form-data
```

Field:

```text
audio
```

---

## Successful Response

```json
{
  "transcript": "..."
}
```

---

## Error Response

```json
{
  "error": "Could not transcribe the audio. Please try again."
}
```

---

# 8. API #6 — Generate/Return Question

This endpoint is OPTIONAL.

Prefer generating `questionUrdu` during form scanning.

If needed:

```text
POST /api/generate-question
```

Request:

```json
{
  "fieldId": "fatherName",
  "label": "Father's Name",
  "type": "text"
}
```

Response:

```json
{
  "questionUrdu": "Aap ke walid ka naam kya hai?"
}
```

Do not use this endpoint if the same question already exists in `FormSchema`.

---

# 9. Frontend State Contract

The frontend should maintain something similar to:

```typescript
type InterviewState = {
  form: FormSchema;
  answers: Record<string, string | null>;
  currentFieldId: string | null;
  completed: boolean;
};
```

Example:

```json
{
  "form": {
    "formTitle": "Citizen Information Form",
    "fields": []
  },
  "answers": {
    "fullName": "Muhammad Ali",
    "fatherName": null,
    "cnic": null
  },
  "currentFieldId": "fatherName",
  "completed": false
}
```

---

# 10. API Call Sequence — Scan Mode

The frontend should perform:

```text
1. User selects image
       ↓
2. POST /api/scan-form
       ↓
3. Receive FormSchema
       ↓
4. Display detected fields
       ↓
5. POST /api/next-question
       ↓
6. Display questionUrdu
       ↓
7. User speaks/enters answer
       ↓
8. POST /api/process-answer
       ↓
9. Receive structured answer
       ↓
10. Save answer in frontend state
       ↓
11. POST /api/next-question
       ↓
12. Repeat
       ↓
13. complete = true
       ↓
14. Show final answers
```

---

# 11. API Call Sequence — Speak Mode

```text
1. User records audio
       ↓
2. POST /api/process-speech
       ↓
3. Receive transcript
       ↓
4. Receive extracted fields
       ↓
5. Display structured information
       ↓
6. Find missing fields
       ↓
7. POST /api/next-question
       ↓
8. Ask user for missing information
       ↓
9. POST /api/process-answer
       ↓
10. Save answer
       ↓
11. Repeat
       ↓
12. Completed
```

---

# 12. Frontend Mock Mode

Before backend integration, Agent B must be able to run the UI with mock data.

Example:

```typescript
const mockForm: FormSchema = {
  formTitle: "Citizen Information Form",
  fields: [
    {
      id: "fullName",
      label: "Full Name",
      type: "text",
      required: true,
      questionUrdu: "Aap ka poora naam kya hai?"
    },
    {
      id: "fatherName",
      label: "Father's Name",
      type: "text",
      required: true,
      questionUrdu: "Aap ke walid ka naam kya hai?"
    }
  ]
};
```

Mock mode must use the SAME data structures as the real API.

Do not create a second incompatible frontend data model.

---

# 13. Backend Mock Testing

Agent A must test APIs independently.

The backend should be testable without the frontend.

For example:

```text
POST /api/next-question
POST /api/process-answer
POST /api/scan-form
```

Use test files or curl/Postman.

---

# 14. Field ID Rules

Field IDs must be:

- lowercase
- camelCase
- stable
- unique

Examples:

```text
fullName
fatherName
cnic
dateOfBirth
gender
phone
address
city
district
```

Do NOT randomly generate field IDs.

Bad:

```text
field_829374
```

Good:

```text
fatherName
```

---

# 15. Field Type Rules

Use only:

```text
text
number
date
cnic
phone
address
select
checkbox
unknown
```

If unsure:

```text
unknown
```

Do not invent a type.

---

# 16. Completion Rules

A form is complete when all fields have been handled by the interview flow.

Current `/api/next-question` behavior:

- asks missing required fields first
- then asks missing optional fields
- returns `complete = true` only when no remaining unanswered fields are left

The endpoint treats a field as answered when:

```text
answers[field.id] is a truthy value
```

Frontend may still choose to skip optional fields by storing a non-empty sentinel.

Example:

```text
Required:
fullName ✓
fatherName ✓
cnic ✓
dateOfBirth ✓
phone ✓
city ✓

Optional:
gender null
address null
district null

Result (when optionals are also answered):
complete = true
```

---

# 17. Confirmation Rules

Frontend MUST show confirmation when:

```text
needsConfirmation === true
```

Minimum confirmation fields:

```text
cnic
phone
dateOfBirth
```

Example UI:

```text
I heard:

3520212345671

[ ✓ Correct ] [ ✎ Edit ]
```

The backend must never silently alter a confirmed user value.

---

# 18. Error Contract

Every endpoint should return predictable JSON.

Success:

```json
{
  "...": "..."
}
```

Error:

```json
{
  "error": "Human-readable error message"
}
```

Never return:

```text
raw Gemini stack trace
API key
internal secrets
```

---

# 19. HTTP Status Guidelines

Use:

```text
200
```

for successful requests.

Use:

```text
400
```

for invalid user input.

Use:

```text
413
```

for files that are too large, if implemented.

Use:

```text
500
```

for unexpected server errors.

The frontend must display a friendly message regardless of the raw server status.

---

# 20. Ownership

## Agent A owns

```text
app/api/
lib/gemini.ts
lib/prompts.ts
lib/validation.ts
lib/schemas.ts
```

## Agent B owns

```text
components/
app/page.tsx
app/speak/
app/scan/
```

## Shared

```text
lib/types.ts
API_CONTRACT.md
REQUIREMENTS.md
```

Both agents must avoid unnecessary edits to each other's files.

---

# 21. Contract Change Rule

If Agent A needs to change an API:

1. Stop.
2. Explain the proposed change.
3. Update API_CONTRACT.md.
4. Tell Agent B.
5. Agent B updates frontend.
6. Test both sides.

Do not silently change:

```text
field names
endpoint names
request structures
response structures
```

---

# 22. Final Integration Test

Before the hackathon demo, verify:

### Test A

```text
Scan image
→ /api/scan-form
→ fields returned
```

### Test B

```text
Answer question
→ /api/process-answer
→ value returned
```

### Test C

```text
Answers
→ /api/next-question
→ next field returned
```

### Test D

```text
Speak audio
→ /api/process-speech
→ transcript + extracted fields
```

### Test E

```text
All required fields complete
→ complete = true
```

If all five work, the two agents are successfully integrated.

---

# 23. Golden Rule

The frontend should never need to know how Gemini works.

The backend should never need to know how the frontend looks.

They communicate through this contract.

```text
FRONTEND
   │
   │ JSON / FormData
   ▼
API CONTRACT
   │
   ▼
BACKEND
   │
   ▼
GEMINI
```

If both agents follow this document, their work can be developed independently and merged safely.
