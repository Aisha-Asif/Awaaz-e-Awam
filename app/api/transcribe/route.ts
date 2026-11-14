// POST /api/transcribe: audio blob -> Urdu transcript via the STT provider.
import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the request." }, { status: 400 });
  }

  const audio = formData.get("audio");
  if (!audio || typeof audio === "string" || typeof audio.arrayBuffer !== "function") {
    return NextResponse.json({ error: "No audio was provided." }, { status: 400 });
  }

  try {
    const mimeType = (audio as File).type || "audio/webm";
    const buffer = Buffer.from(await audio.arrayBuffer());
    const transcript = await transcribeAudio(mimeType, buffer);
    return NextResponse.json({ transcript });
  } catch (err) {
    // Log the reason on the server only (the message never contains the user's answers).
    console.error("[transcribe]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not transcribe the audio. Please try again." }, { status: 500 });
  }
}
