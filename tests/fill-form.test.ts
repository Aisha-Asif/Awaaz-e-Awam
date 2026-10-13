import { describe, it, expect } from "vitest";
import { formatForPaper } from "@/lib/fill-form";

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
});
