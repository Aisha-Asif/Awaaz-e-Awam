import { describe, it, expect } from "vitest";
import { A4, formatForPaper, pdfPlacement, printPageHtml } from "@/lib/fill-form";

describe("formatForPaper", () => {
  it("hyphenates a 13-digit CNIC for printing", () => {
    expect(formatForPaper("cnic", "4210123456789")).toBe("42101-2345678-9");
  });

  it("passes a non-CNIC value through trimmed", () => {
    expect(formatForPaper("cnic", "n/a")).toBe("n/a");
    expect(formatForPaper("cnic", "  421012345678  ")).toBe("421012345678");
  });

  it("prints dates as DD/MM/YYYY", () => {
    expect(formatForPaper("date", "2025-12-31")).toBe("31/12/2025");
  });

  it("leaves non-ISO dates and free text trimmed", () => {
    expect(formatForPaper("date", "2025/12/31")).toBe("2025/12/31");
    expect(formatForPaper("text", "  Full name  ")).toBe("Full name");
  });

  it("honours an explicit printFormat over the field type", () => {
    expect(formatForPaper("text", "4210123456789", "cnic-dashes")).toBe("42101-2345678-9");
    expect(formatForPaper("cnic", "4210123456789", "plain")).toBe("4210123456789");
    expect(formatForPaper("text", "2025-12-31", "date-dmy")).toBe("31/12/2025");
  });
});

describe("pdfPlacement", () => {
  it("fits a taller-than-A4 form inside the margin, centred, keeping its proportions", () => {
    const image = { width: 1000, height: 1600 };
    const p = pdfPlacement(image, A4, 24);
    expect(p.width / p.height).toBeCloseTo(image.width / image.height, 6);
    expect(p.x).toBeGreaterThanOrEqual(24 - 1e-9);
    expect(p.y).toBeGreaterThanOrEqual(24 - 1e-9);
    expect(p.x + p.width).toBeLessThanOrEqual(A4.width - 24 + 1e-9);
    expect(p.y + p.height).toBeLessThanOrEqual(A4.height - 24 + 1e-9);
    expect(p.x).toBeCloseTo((A4.width - p.width) / 2, 6);
    expect(p.y).toBeCloseTo((A4.height - p.height) / 2, 6);
  });

  it("fits every available form on one A4 page", async () => {
    const { TEMPLATES } = await import("@/lib/templates");
    for (const t of TEMPLATES) {
      const p = pdfPlacement({ width: t.imageWidth, height: t.imageHeight });
      expect(p.width, t.id).toBeLessThanOrEqual(A4.width);
      expect(p.height, t.id).toBeLessThanOrEqual(A4.height);
      expect(p.width, t.id).toBeGreaterThan(A4.width * 0.6);
    }
  });
});

describe("printPageHtml", () => {
  it("holds only the form image and asks for one A4 sheet", () => {
    const html = printPageHtml("data:image/png;base64,AAAA", "Birth form");
    expect(html).toContain("size:A4 portrait");
    expect(html).toContain('<img id="form" src="data:image/png;base64,AAAA"');
    expect(html).toContain("<title>Birth form</title>");
    // Nothing else is printed: the body is just the image.
    expect(html.match(/<body>(.*)<\/body>/)?.[1]).toBe('<img id="form" src="data:image/png;base64,AAAA" alt="">');
  });

  it("removes characters that could break the page title", () => {
    expect(printPageHtml("x", 'A <b>"form"</b> & more')).toContain("<title>A bform/b  more</title>");
  });
});
