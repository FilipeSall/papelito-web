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

  it("applies the mask of other Brazilian area codes", () => {
    expect(formatNationalPhone("11987654321", "BR")).toBe("(11) 98765-4321");
    expect(formatNationalPhone("2122223333", "BR")).toBe("(21) 2222-3333");
    expect(formatNationalPhone("4832221111", "BR")).toBe("(48) 3222-1111");
  });

  it("applies the national grouping of other countries", () => {
    expect(formatNationalPhone("4155550132", "US")).toBe("(415) 555-0132");
    expect(formatNationalPhone("612345678", "ES")).toBe("612 34 56 78");
    expect(formatNationalPhone("1123456789", "AR")).toBe("11 2345-6789");
    expect(formatNationalPhone("3123456789", "IT")).toBe("312 345 6789");
  });

  it("keeps digits unmasked where the national format depends on a trunk prefix", () => {
    expect(formatNationalPhone("612345678", "FR")).toBe("612345678");
    expect(formatNationalPhone("15112345678", "DE")).toBe("15112345678");
    expect(formatNationalPhone("9012345678", "JP")).toBe("9012345678");
  });

  it("still normalizes to E.164 for those countries", () => {
    expect(toE164("612345678", "FR")).toBe("+33612345678");
    expect(toE164("15112345678", "DE")).toBe("+4915112345678");
    expect(toE164("9012345678", "JP")).toBe("+819012345678");
    expect(toE164("1123456789", "AR")).toBe("+541123456789");
    expect(toE164("3123456789", "IT")).toBe("+393123456789");
  });

  it("tells apart countries that share the +1 calling code", () => {
    expect(parsePhoneValue("+14155550132")).toEqual({
      country: "US",
      nationalNumber: "4155550132",
    });
    expect(parsePhoneValue("+14165550123")).toEqual({
      country: "CA",
      nationalNumber: "4165550123",
    });
  });

  it("reads back E.164 values of other countries", () => {
    expect(parsePhoneValue("+5511987654321")).toEqual({
      country: "BR",
      nationalNumber: "11987654321",
    });
    expect(parsePhoneValue("+34612345678")).toEqual({ country: "ES", nationalNumber: "612345678" });
    expect(parsePhoneValue("+819012345678")).toEqual({
      country: "JP",
      nationalNumber: "9012345678",
    });
  });

  it("reads legacy Brazilian values of other area codes", () => {
    expect(parsePhoneValue("(11) 98765-4321")).toEqual({
      country: "BR",
      nationalNumber: "11987654321",
    });
    expect(parsePhoneValue("+55 (11) 98765-4321")).toEqual({
      country: "BR",
      nationalNumber: "11987654321",
    });
    expect(parsePhoneValue("552122223333")).toEqual({
      country: "BR",
      nationalNumber: "2122223333",
    });
  });

  it("discounts the calling code length from the E.164 ceiling", () => {
    expect(limitNationalDigits("1".repeat(30), "US")).toHaveLength(14);
    expect(limitNationalDigits("1".repeat(30), "PT")).toHaveLength(12);
  });

  it("validates numbers of other countries against their own rules", () => {
    expect(isValidPhone("11987654321", "BR")).toBe(true);
    expect(isValidPhone("4155550132", "US")).toBe(true);
    expect(isValidPhone("912345678", "PT")).toBe(true);
    expect(isValidPhone("202", "US")).toBe(false);
    expect(isValidPhone("61999999999", "PT")).toBe(false);
  });
});
