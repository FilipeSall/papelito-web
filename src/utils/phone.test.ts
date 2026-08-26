import { describe, expect, it } from "vitest";

import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  findPhoneCountry,
  formatNationalPhone,
  isValidPhone,
  limitNationalDigits,
  parsePhoneValue,
  toE164,
} from "./phone";

describe("phone", () => {
  it("applies the Brazilian mobile mask over raw digits", () => {
    expect(formatNationalPhone("61999999999", "BR")).toBe("(61) 99999-9999");
  });

  it("applies the Brazilian landline mask", () => {
    expect(formatNationalPhone("6133334444", "BR")).toBe("(61) 3333-4444");
  });

  it("masks progressively while typing", () => {
    expect(formatNationalPhone("6", "BR")).toBe("6");
    expect(formatNationalPhone("619", "BR")).toBe("(61) 9");
    expect(formatNationalPhone("619999", "BR")).toBe("(61) 9999");
  });

  it("ignores formatting characters typed by the user", () => {
    expect(formatNationalPhone("(61) 99999-9999", "BR")).toBe("(61) 99999-9999");
  });

  it("uses the mask of the selected country", () => {
    expect(formatNationalPhone("2025550143", "US")).toBe("(202) 555-0143");
    expect(formatNationalPhone("912345678", "PT")).toBe("912 345 678");
  });

  it("normalizes to E.164 without formatting characters", () => {
    expect(toE164("(61) 99999-9999", "BR")).toBe("+5561999999999");
    expect(toE164("202 555 0143", "US")).toBe("+12025550143");
    expect(toE164("912345678", "PT")).toBe("+351912345678");
    expect(toE164("", "BR")).toBe("");
  });

  it("reads back an E.164 value into country and national number", () => {
    expect(parsePhoneValue("+5561999999999")).toEqual({
      country: "BR",
      nationalNumber: "61999999999",
    });
    expect(parsePhoneValue("+351912345678")).toEqual({
      country: "PT",
      nationalNumber: "912345678",
    });
  });

  it("reads legacy masked and digit-only values as Brazilian numbers", () => {
    expect(parsePhoneValue("+55 61 9836-4920")).toEqual({
      country: "BR",
      nationalNumber: "6198364920",
    });
    expect(parsePhoneValue("(61) 99999-9999")).toEqual({
      country: "BR",
      nationalNumber: "61999999999",
    });
    expect(parsePhoneValue("556198364920")).toEqual({
      country: "BR",
      nationalNumber: "6198364920",
    });
  });

  it("falls back to Brazil for empty or unparseable values", () => {
    expect(parsePhoneValue("")).toEqual({ country: DEFAULT_PHONE_COUNTRY, nationalNumber: "" });
    expect(parsePhoneValue("   ")).toEqual({ country: DEFAULT_PHONE_COUNTRY, nationalNumber: "" });
  });

  it("survives a save-and-edit round trip without double masking or lost digits", () => {
    const typed = "61999999999";
    const stored = toE164(typed, "BR");
    const reopened = parsePhoneValue(stored);

    expect(stored).toBe("+5561999999999");
    expect(formatNationalPhone(reopened.nationalNumber, reopened.country)).toBe("(61) 99999-9999");
    expect(toE164(formatNationalPhone(reopened.nationalNumber, reopened.country), reopened.country)).toBe(
      stored,
    );
  });

  it("caps the national digits at the E.164 ceiling", () => {
    expect(limitNationalDigits("1".repeat(30), "BR")).toHaveLength(13);
  });

  it("validates numbers against the selected country", () => {
    expect(isValidPhone("61999999999", "BR")).toBe(true);
    expect(isValidPhone("123", "BR")).toBe(false);
    expect(isValidPhone("", "BR")).toBe(false);
  });

  it("lists Brazil first with flag and calling code", () => {
    expect(PHONE_COUNTRIES[0]).toMatchObject({ code: "BR", callingCode: "55", flag: "🇧🇷" });
    expect(PHONE_COUNTRIES.length).toBeGreaterThan(200);
  });

  it("falls back to Brazil for unknown country codes", () => {
    expect(findPhoneCountry("ZZ").code).toBe("BR");
    expect(findPhoneCountry(undefined).code).toBe("BR");
  });
});
