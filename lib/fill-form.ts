// Client-side canvas rendering of a filled form: printed-style value formatting, fitted
// handwriting-ish ink, templates as PNG or PDF, and browser download.
import type { BoundingBox, FormField, FormFieldType, FormTemplate, PrintFormat } from "@/lib/types";
import { defaultPrintFormat } from "@/lib/field-model";
import { SKIP_SENTINEL } from "@/lib/schemas";

const INK = "#10162b";
const FONT_FAMILY = `"Work Sans", Arial, sans-serif`;
const MAX_FONT = 26; // px at template resolution; boxes are ~25px tall
const MIN_FONT = 11;

// What goes on paper differs from what we store: CNIC is kept as 13 digits,
// dates as YYYY-MM-DD, but the form expects the familiar printed style.
export function formatForPaper(type: string, value: string, printFormat?: PrintFormat): string {
  const v = value.trim();
  // An explicit format wins; otherwise derive it from the field type (same rules as before).
  const format = printFormat ?? defaultPrintFormat(type as FormFieldType);
  if (format === "cnic-dashes" && /^\d{13}$/.test(v)) return `${v.slice(0, 5)}-${v.slice(5, 12)}-${v.slice(12)}`;
  if (format === "date-dmy") {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  return v;
}

// One thing to draw on the form: a piece of text in a box, or a tick in a box.
export type DrawOp =
  { kind: "text"; box: BoundingBox; text: string; align: "left" | "center" } | { kind: "tick"; box: BoundingBox };

// Decides what to draw for one field. A choice printed as tick boxes gets a tick in the box of the chosen option; any
// other answer is written (in paper style) into the field's write area and into every extra area (a detail that the
// form prints twice). Unanswered and skipped fields draw nothing.
export function planFieldDrawing(field: FormField, value: string | null | undefined): DrawOp[] {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw === SKIP_SENTINEL) return [];

  if (field.ticks) {
    const options = Object.keys(field.ticks);
    const chosen = options.find((o) => o === raw) ?? options.find((o) => o.toLowerCase() === raw.toLowerCase());
    if (chosen) return [{ kind: "tick", box: field.ticks[chosen] }];
  }

  const text = formatForPaper(field.type, raw, field.printFormat);
  const boxes = [field.boundingBox, ...(field.extraBoxes ?? [])].filter((b): b is BoundingBox => !!b);
  return boxes.map((box) => ({ kind: "text" as const, box, text, align: field.align ?? "left" }));
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
function drawFitted(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  align: "left" | "center" = "left",
) {
  const setFont = (size: number) => (ctx.font = `500 ${size}px ${FONT_FAMILY}`);
  ctx.textAlign = align;
  const ax = align === "center" ? x + w / 2 : x;

  let size = Math.min(MAX_FONT, Math.floor(h * 0.85));
  setFont(size);
  while (size > MIN_FONT && ctx.measureText(text).width > w) setFont(--size);

  if (ctx.measureText(text).width <= w) {
    ctx.fillText(text, ax, y + h / 2);
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
  lines.slice(0, 3).forEach((line, i) => ctx.fillText(line, ax, top + i * lineH));
}

// Draws a check mark inside a box.
function drawTick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.14);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h * 0.55);
  ctx.lineTo(x + w * 0.42, y + h * 0.78);
  ctx.lineTo(x + w * 0.82, y + h * 0.22);
  ctx.stroke();
  ctx.restore();
}

// Draws the filled form onto the template canvas at render scale with fitted ink.
export async function renderFilledForm(
  template: FormTemplate,
  answers: Record<string, string | null | undefined>,
  opts: FillOptions = {},
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

  // Pixel rectangle of a normalized box.
  const px = (box: BoundingBox) => ({
    x: box.x * canvas.width,
    y: box.y * canvas.height,
    w: box.width * canvas.width,
    h: box.height * canvas.height,
  });

  for (const field of template.schema.fields) {
    if (opts.showBoxes) {
      // Alignment aid: red outlines for write areas, blue for tick boxes.
      ctx.lineWidth = 2;
      const outline = (box: BoundingBox, color: string) => {
        const r = px(box);
        ctx.strokeStyle = color;
        ctx.strokeRect(r.x, r.y, r.w, r.h);
      };
      for (const box of [field.boundingBox, ...(field.extraBoxes ?? [])]) {
        if (box) outline(box, "rgba(220, 38, 38, 0.8)");
      }
      for (const box of Object.values(field.ticks ?? {})) outline(box, "rgba(37, 99, 235, 0.8)");
    }

    for (const op of planFieldDrawing(field, answers[field.id])) {
      const r = px(op.box);
      if (op.kind === "tick") {
        drawTick(ctx, r.x, r.y, r.w, r.h);
      } else {
        ctx.fillStyle = INK;
        drawFitted(ctx, op.text, r.x + 2, r.y, r.w - 4, r.h, op.align);
      }
    }
  }

  return canvas;
}

// Encodes the canvas as a PNG blob.
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the PNG."))), "image/png"),
  );
}

// A4 paper in PDF points (1 point = 1/72 inch).
export const A4 = { width: 595.28, height: 841.89 };

// Where to put the form image on a PDF page: as large as fits inside the margin, keeping its proportions, centred.
export function pdfPlacement(
  image: { width: number; height: number },
  page: { width: number; height: number } = A4,
  margin = 24,
): { x: number; y: number; width: number; height: number } {
  const scale = Math.min((page.width - 2 * margin) / image.width, (page.height - 2 * margin) / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: (page.width - width) / 2, y: (page.height - height) / 2, width, height };
}

// Puts the filled form on a single A4 page (scaled to fit, centred) and returns the PDF bytes. The whole printed form is
// part of the image, so the PDF can be printed on plain paper.
export async function canvasToPdfBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  // Loaded on demand: pdf-lib is large and most users only need the preview.
  const { PDFDocument } = await import("pdf-lib");
  const png = await canvasToPngBlob(canvas);
  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(new Uint8Array(await png.arrayBuffer()));
  const place = pdfPlacement({ width: canvas.width, height: canvas.height });
  const page = pdf.addPage([A4.width, A4.height]);
  page.drawImage(image, place);
  return pdf.save();
}

// HTML for a page that holds only the filled form, set up to print on one A4 sheet.
export function printPageHtml(imageUrl: string, title: string): string {
  const safeTitle = title.replace(/[<>&"]/g, "");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>@page{size:A4 portrait;margin:10mm}html,body{margin:0;padding:0;background:#fff}img{display:block;margin:0 auto;max-width:100%;max-height:275mm}</style></head><body><img id="form" src="${imageUrl}" alt=""></body></html>`;
}

// Prints the filled form on its own, through a hidden frame, so none of the app's screen ends up on paper.
export async function printCanvas(canvas: HTMLCanvasElement, title: string): Promise<void> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    throw new Error("Could not prepare the page for printing.");
  }
  doc.open();
  doc.write(printPageHtml(canvas.toDataURL("image/png"), title));
  doc.close();

  // Wait for the image to be ready before opening the print dialog.
  const img = doc.getElementById("form") as HTMLImageElement | null;
  if (img && !img.complete) {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not prepare the page for printing."));
    });
  }

  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  // Keep the frame while the print dialog may still be open, then clean up.
  setTimeout(() => frame.remove(), 60_000);
}

// Triggers a browser download for a blob under the given filename.
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
