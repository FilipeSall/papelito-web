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
});
