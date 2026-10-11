import type { FormTemplate } from "@/lib/types";

const INK = "#10162b";
const FONT_FAMILY = `"Work Sans", Arial, sans-serif`;
const MAX_FONT = 26; // px at template resolution; boxes are ~25px tall
const MIN_FONT = 11;

// What goes on paper differs from what we store: CNIC is kept as 13 digits,
// dates as YYYY-MM-DD, but the form expects the familiar printed style.
export function formatForPaper(type: string, value: string): string {
  const v = value.trim();
  if (type === "cnic" && /^\d{13}$/.test(v)) return `${v.slice(0, 5)}-${v.slice(5, 12)}-${v.slice(12)}`;
  if (type === "date") {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  return v;
}

export type FillOptions = {
  // Draw the write areas on top, for lining up a new template.
  showBoxes?: boolean;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the form image."));
    img.src = src;
  });
}

// Longest font size that fits the text on one line; wraps to two lines at the
// minimum size if it still does not fit, and shrinks past that only as a last resort.
function drawFitted(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number) {
  const setFont = (size: number) => (ctx.font = `500 ${size}px ${FONT_FAMILY}`);

  let size = Math.min(MAX_FONT, Math.floor(h * 0.85));
  setFont(size);
  while (size > MIN_FONT && ctx.measureText(text).width > w) setFont(--size);

  if (ctx.measureText(text).width <= w) {
    ctx.fillText(text, x, y + h / 2);
    return;
  }

  // Too long for one line even at MIN_FONT: wrap onto two lines inside the box.
  const words = text.split(/\s+/);
  const lines: string[] = [""];
  for (const word of words) {
    const cur = lines[lines.length - 1];
    const next = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(next).width <= w || !cur) lines[lines.length - 1] = next;
    else lines.push(word);
  }
  const lineH = size + 1;
  const top = y + h / 2 - ((lines.length - 1) * lineH) / 2;
  lines.slice(0, 3).forEach((line, i) => ctx.fillText(line, x, top + i * lineH));
}

export async function renderFilledForm(
  template: FormTemplate,
  answers: Record<string, string | null | undefined>,
  opts: FillOptions = {}
): Promise<HTMLCanvasElement> {
  try {
    await document.fonts.ready;
  } catch {
    // fonts are best-effort; the fallback stack still renders
  }

  const img = await loadImage(template.imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = template.imageWidth;
  canvas.height = template.imageHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  for (const field of template.schema.fields) {
    const box = field.boundingBox;
    if (!box) continue;
    const x = box.x * canvas.width;
    const y = box.y * canvas.height;
    const w = box.width * canvas.width;
    const h = box.height * canvas.height;

    if (opts.showBoxes) {
      ctx.strokeStyle = "rgba(220, 38, 38, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    }

    const raw = answers[field.id];
    if (!raw || !raw.trim()) continue;

    ctx.fillStyle = INK;
    drawFitted(ctx, formatForPaper(field.type, raw), x + 2, y, w - 4, h);
  }

  return canvas;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the PNG."))), "image/png")
  );
}

// The page keeps the original form's proportions (it is not exactly A4), so
// print it at "actual size" / 100% to keep the boxes aligned with the paper.
export async function canvasToPdfBytes(canvas: HTMLCanvasElement, widthPt = 566.88): Promise<Uint8Array> {
  // Loaded on demand: pdf-lib is large and most users only need the preview.
  const { PDFDocument } = await import("pdf-lib");
  const png = await canvasToPngBlob(canvas);
  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(new Uint8Array(await png.arrayBuffer()));
  const heightPt = (widthPt * canvas.height) / canvas.width;
  const page = pdf.addPage([widthPt, heightPt]);
  page.drawImage(image, { x: 0, y: 0, width: widthPt, height: heightPt });
  return pdf.save();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
