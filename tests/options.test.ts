import { describe, it, expect } from "vitest";
import { matchOption, normalizeText } from "@/lib/options";

const GENDER = ["Male", "Female", "Transgender"];
const MARITAL = ["Single", "Married", "Widowed", "Divorced"];
const YES_NO = ["Yes", "No"];

describe("normalizeText", () => {
  it("lower-cases, removes punctuation and extra spaces", () => {
    expect(normalizeText("  Shadi-Shuda!! ")).toBe("shadi shuda");
  });
});

describe("matchOption", () => {
  it("matches the option itself in any case", () => {
    expect(matchOption("MALE", GENDER)).toBe("Male");
    expect(matchOption("divorced", MARITAL)).toBe("Divorced");
  });

  it("does not confuse male with female", () => {
    expect(matchOption("female", GENDER)).toBe("Female");
    expect(matchOption("I am female", GENDER)).toBe("Female");
    expect(matchOption("male", GENDER)).toBe("Male");
  });

  it("understands Roman Urdu and Urdu script", () => {
    expect(matchOption("mard", GENDER)).toBe("Male");
    expect(matchOption("meri jins aurat hai", GENDER)).toBe("Female");
    expect(matchOption("لڑکی", GENDER)).toBe("Female");
    expect(matchOption("shadi shuda", MARITAL)).toBe("Married");
    expect(matchOption("شادی شدہ", MARITAL)).toBe("Married");
    expect(matchOption("bewa", MARITAL)).toBe("Widowed");
  });

  it("tells single from married even when the sentence contains both words", () => {
    expect(matchOption("unmarried", MARITAL)).toBe("Single");
    expect(matchOption("not married", MARITAL)).toBe("Single");
    expect(matchOption("ghair shadi shuda", MARITAL)).toBe("Single");
  });

  it("handles yes and no", () => {
    expect(matchOption("haan", YES_NO)).toBe("Yes");
    expect(matchOption("ji nahi", YES_NO)).toBe("No");
    expect(matchOption("نہیں", YES_NO)).toBe("No");
  });

  it("returns null when it is unclear or unknown", () => {
    expect(matchOption("", GENDER)).toBeNull();
    expect(matchOption("hmm", GENDER)).toBeNull();
    expect(matchOption("male and female", GENDER)).toBeNull();
  });

  it("returns the option exactly as written in the options list", () => {
    expect(matchOption("hospital", ["Hospital", "Home"])).toBe("Hospital");
    expect(matchOption("ghar", ["Hospital", "Home"])).toBe("Home");
  });

  it("understands the marriage form's marital status wording", () => {
    const bride = ["Virgin", "Widow", "Divorced"];
    expect(matchOption("virgin", bride)).toBe("Virgin");
    expect(matchOption("unmarried", bride)).toBe("Virgin");
    expect(matchOption("kunwari", bride)).toBe("Virgin");
    expect(matchOption("bewa", bride)).toBe("Widow");
    expect(matchOption("talaq yafta", ["Virgin", "Widower", "Divorced"])).toBe("Divorced");
    expect(matchOption("rand", ["Virgin", "Widower", "Divorced"])).toBe("Widower");
  });

  it("understands relatives", () => {
    const kin = ["Father", "Mother", "Sister", "Brother", "Son", "Daughter"];
    expect(matchOption("mere abu", kin)).toBe("Father");
    expect(matchOption("ammi", kin)).toBe("Mother");
    expect(matchOption("bhai", kin)).toBe("Brother");
    expect(matchOption("beti", kin)).toBe("Daughter");
    expect(matchOption("بہن", kin)).toBe("Sister");
  });
});
