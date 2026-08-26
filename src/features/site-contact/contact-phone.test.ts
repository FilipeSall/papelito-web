import { describe, expect, it } from "vitest";

import { DEFAULT_CONTACT_PHONE, contactPhoneHref } from "./contact-phone";

describe("contactPhoneHref", () => {
  it("keeps the international code of an E.164 value", () => {
    expect(contactPhoneHref("+556198364920")).toBe("tel:+556198364920");
  });

  it("normalizes a legacy masked value", () => {
    expect(contactPhoneHref("+55 61 9836-4920")).toBe("tel:+556198364920");
  });

  it("assumes Brazil for a legacy value without the international code", () => {
    expect(contactPhoneHref("(61) 9836-4920")).toBe("tel:+556198364920");
  });

  it("keeps a foreign number intact", () => {
    expect(contactPhoneHref("+351912345678")).toBe("tel:+351912345678");
  });

  it("returns an empty href for an empty phone", () => {
    expect(contactPhoneHref("")).toBe("");
  });

  it("ships a default already in E.164", () => {
    expect(contactPhoneHref(DEFAULT_CONTACT_PHONE)).toBe(`tel:${DEFAULT_CONTACT_PHONE}`);
  });

  it("normalizes other Brazilian area codes", () => {
    expect(contactPhoneHref("+5511987654321")).toBe("tel:+5511987654321");
    expect(contactPhoneHref("(11) 98765-4321")).toBe("tel:+5511987654321");
    expect(contactPhoneHref("5511987654321")).toBe("tel:+5511987654321");
    expect(contactPhoneHref("+55 21 2222-3333")).toBe("tel:+552122223333");
  });

  it("keeps other foreign numbers intact", () => {
    expect(contactPhoneHref("+1 415 555-0132")).toBe("tel:+14155550132");
    expect(contactPhoneHref("+34 612 34 56 78")).toBe("tel:+34612345678");
    expect(contactPhoneHref("+81 90 1234-5678")).toBe("tel:+819012345678");
  });

  it("returns an empty href for a blank phone", () => {
    expect(contactPhoneHref("   ")).toBe("");
  });
});
