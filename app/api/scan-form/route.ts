import { NextRequest, NextResponse } from "next/server";
import { extractFormSchema } from "@/lib/ai";
import { MOCK_FORM_SCHEMA } from "@/lib/mock-data";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MiB

async function toBase64DataUrl(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  return `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded image." }, { status: 400 });
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "No image was provided." }, { status: 400 });
  }

  if (image.size === 0) {
    return NextResponse.json({ error: "The uploaded image is empty." }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "The image is too large." }, { status: 413 });
  }

  try {
    const dataUrl = await toBase64DataUrl(image);
    const schema = await extractFormSchema(dataUrl);

    // ponytail: if the model couldn't read the form (<2 fields), fall back to
    // the predefined demo schema so the demo never hard-fails (REQUIREMENTS §32).
    if (schema.fields.length < 2) {
      return NextResponse.json(MOCK_FORM_SCHEMA);
    }

    return NextResponse.json(schema);
  } catch (err) {
    console.error("scan-form error:", err);
    return NextResponse.json({ error: "Could not process form image." }, { status: 500 });
  }
}
