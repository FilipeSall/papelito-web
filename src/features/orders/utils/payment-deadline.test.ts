import { describe, expect, it } from "vitest";

import type { ProfileOrderPaymentInfo } from "../types/profile-order-detail";
import {
  formatPaymentDeadline,
  getPaymentExpiresAt,
  isPaymentExpired,
} from "./payment-deadline";

const NOW = Date.UTC(2026, 5, 11, 23, 0, 0); // 2026-06-11T23:00:00Z

function payment(overrides: Partial<ProfileOrderPaymentInfo>): ProfileOrderPaymentInfo {
  return { methodLabel: "Pix", maskedLabel: "", ...overrides };
}

describe("getPaymentExpiresAt", () => {
  it("prefers the PIX expiry", () => {
    expect(
      getPaymentExpiresAt(
        payment({ pix: { expiresAt: "2026-06-11T23:30:00Z" }, boleto: { expiresAt: "2026-06-12T00:00:00Z" } }),
      ),
    ).toBe("2026-06-11T23:30:00Z");
  });

  it("falls back to the boleto expiry when there is no PIX", () => {
    expect(getPaymentExpiresAt(payment({ boleto: { expiresAt: "2026-06-12T00:00:00Z" } }))).toBe(
      "2026-06-12T00:00:00Z",
    );
  });

  it("returns undefined when neither has an expiry", () => {
    expect(getPaymentExpiresAt(payment({}))).toBeUndefined();
  });
});

describe("isPaymentExpired", () => {
  it("is false for a future deadline", () => {
    expect(isPaymentExpired("2026-06-11T23:30:00Z", NOW)).toBe(false);
  });

  it("is true once the deadline has passed", () => {
    expect(isPaymentExpired("2026-06-11T22:00:00Z", NOW)).toBe(true);
  });

  it("never expires when the deadline is missing or invalid", () => {
    expect(isPaymentExpired(undefined, NOW)).toBe(false);
    expect(isPaymentExpired("not-a-date", NOW)).toBe(false);
  });
});

describe("formatPaymentDeadline", () => {
  it("reports no deadline when expiry is absent", () => {
    expect(formatPaymentDeadline(undefined, NOW)).toEqual({ label: "", expired: false, hasDeadline: false });
  });

  it("shows minutes remaining for a near-future PIX deadline", () => {
    const result = formatPaymentDeadline("2026-06-11T23:24:00Z", NOW); // +24min
    expect(result.expired).toBe(false);
    expect(result.hasDeadline).toBe(true);
    expect(result.label).toContain("Pague ate");
    expect(result.label).toContain("faltam 24 min");
  });

  it("shows days remaining for a boleto far in the future", () => {
    const result = formatPaymentDeadline("2026-06-14T23:00:00Z", NOW); // +3 days
    expect(result.expired).toBe(false);
    expect(result.label).toContain("faltam 3 dias");
  });

  it("marks an expired deadline", () => {
    expect(formatPaymentDeadline("2026-06-11T22:00:00Z", NOW)).toEqual({
      label: "Pagamento expirado",
      expired: true,
      hasDeadline: true,
    });
  });
});
