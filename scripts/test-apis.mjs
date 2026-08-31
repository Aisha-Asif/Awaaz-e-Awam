// Backend self-test for Agent A (contract §12 / §21 scenarios A-E).
// Requires the Next.js dev server running on localhost:3000.
// Run backend in mock mode first (AI_MODE=mock in .env.local), then live.
//
//   node scripts/test-apis.mjs
//
// Exit code 0 = all pass.

const BASE = "http://localhost:3000";

let failures = 0;

function check(name, cond) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
  }
}

async function postJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

// Test A — scan an image and get fields back.
// Build a tiny valid PNG payload (1x1) so multipart upload works.
const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const pngBytes = Uint8Array.from(Buffer.from(PNG, "base64"));

async function testScanForm() {
  console.log("Test A: /api/scan-form");
  const fd = new FormData();
  fd.append("image", new Blob([pngBytes], { type: "image/png" }), "form.png");
  const res = await fetch(`${BASE}/api/scan-form`, { method: "POST", body: fd });
  const data = await res.json();
  check("returns 200", res.status === 200);
  check("has fields array", Array.isArray(data.fields) && data.fields.length >= 1);
  check("fields have ids", data.fields.every((f) => f.id));
  console.log(`  -> ${data.fields.length} fields, title="${data.formTitle}"`);
}

async function testProcessAnswer() {
  console.log("Test B: /api/process-answer");
  const { status, data } = await postJson("/api/process-answer", {
    fieldId: "fullName",
    fieldType: "text",
    transcript: "Mera naam Muhammad Ali hai."
  });
  check("returns 200", status === 200);
  check("has value", typeof data.value === "string");
  console.log(`  -> value="${data.value}" valid=${data.valid} confirm=${data.needsConfirmation}`);
}

async function testCNIC() {
  console.log("Test B (cnic): /api/process-answer");
  const { data } = await postJson("/api/process-answer", {
    fieldId: "cnic",
    fieldType: "cnic",
    transcript: "Mera CNIC 35202-1234567-1 hai."
  });
  check("cnic normalized to 13 digits", data.value === "3520212345671");
  check("cnic needs confirmation", data.needsConfirmation === true);
  console.log(`  -> value="${data.value}" valid=${data.valid} confirm=${data.needsConfirmation}`);
}

async function testInvalidCNIC() {
  console.log("Test B (invalid cnic): /api/process-answer");
  const { data } = await postJson("/api/process-answer", {
    fieldId: "cnic",
    fieldType: "cnic",
    transcript: "12345"
  });
  check("invalid cnic flagged", data.valid === false);
  check("has error message", typeof data.error === "string" && data.error.length > 0);
  console.log(`  -> value="${data.value}" valid=${data.valid} error="${data.error}"`);
}

async function testNextQuestion() {
  console.log("Test C: /api/next-question");
  const fields = [
    { id: "fullName", label: "Full Name", type: "text", required: true, questionUrdu: "q1" },
    { id: "fatherName", label: "Father", type: "text", required: true, questionUrdu: "q2" }
  ];
  const { data } = await postJson("/api/next-question", {
    fields,
    answers: { fullName: "Ali", fatherName: null }
  });
  check("picks next required field", data.nextField === "fatherName");
  check("complete is false", data.complete === false);
  console.log(`  -> nextField="${data.nextField}" complete=${data.complete}`);

  const done = await postJson("/api/next-question", {
    fields,
    answers: { fullName: "Ali", fatherName: "Ahmed" }
  });
  check("completes when all filled", done.data.complete === true);
  console.log(`  -> completed: complete=${done.data.complete}`);
}

async function testProcessSpeech() {
  console.log("Test D: /api/process-speech");
  const fd = new FormData();
  fd.append("transcript", "Mera naam Ali Raza hai. Mere walid ka naam Ahmed Raza hai. Main Lahore mein rehta hoon.");
  fd.append("formType", "citizen");
  const res = await fetch(`${BASE}/api/process-speech`, { method: "POST", body: fd });
  const data = await res.json();
  check("returns 200", res.status === 200);
  check("has transcript", typeof data.transcript === "string");
  check("has extracted object", data.extracted && typeof data.extracted === "object");
  check("has missingFields", Array.isArray(data.validation?.missingFields));
  console.log(`  -> extracted keys: ${Object.keys(data.extracted).filter((k) => data.extracted[k]).join(", ") || "none"}`);
}

async function main() {
  await testScanForm();
  await testProcessAnswer();
  await testCNIC();
  await testInvalidCNIC();
  await testNextQuestion();
  await testProcessSpeech();

  console.log("\n" + (failures === 0 ? "ALL TESTS PASSED" : `${failures} TEST(S) FAILED`));
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Test run error:", err.message);
  process.exit(1);
});
