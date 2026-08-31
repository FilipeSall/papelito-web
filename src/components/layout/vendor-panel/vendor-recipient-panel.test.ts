import { describe, expect, it } from "vitest";

import type { VendorRecipient } from "@/features/vendor-recipient/types/vendor-recipient";

import {
  buildRecipientErrorFeedback,
  buildRecipientVerdict,
  formatRecipientSyncAt,
} from "./vendor-recipient-panel";

describe("formatRecipientSyncAt", () => {
  it("renders a UTC recipient timestamp with a readable Brazilian date", () => {
    expect(formatRecipientSyncAt("2026-08-31 18:59:47")).toContain("31 de agosto de 2026");
  });

  it("uses São Paulo time when a UTC timestamp crosses the date boundary", () => {
    expect(formatRecipientSyncAt("2026-09-01 01:30:00")).toContain("31 de agosto de 2026");
  });

  it("explains the Pagar.me authorization requirement without sending the vendor back to the form", () => {
    const feedback = buildRecipientErrorFeedback({
      code: "papelito_pagarme_bank_account_update_auth_required",
    });

    expect(feedback.title).toBe("Atualização bancária requer autorização");
    expect(feedback.actionLabel).toBe("Falar com o suporte da Papelito");
    expect(feedback.actionType).toBe("pagarme-bank-account-support");
  });
});

describe("buildRecipientVerdict", () => {
  function recipient(overrides: Partial<VendorRecipient> = {}): VendorRecipient {
    return {
      recipientId: "",
      status: "",
      lastSyncAt: "",
      kycUrl: "",
      lastError: "",
      lastErrorCode: "",
      loadFailed: false,
      ...overrides,
    };
  }

  it("declares the store able to sell only when the recipient is active", () => {
    const verdict = buildRecipientVerdict(recipient({ recipientId: "re_1", status: "active" }));

    expect(verdict.tone).toBe("apto");
    expect(verdict.headline).toBe("Sua loja pode receber pagamentos");
    expect(verdict.primaryAction).toBeNull();
  });

  it("never claims a verdict when the recipient state could not be read", () => {
    const verdict = buildRecipientVerdict(recipient({ loadFailed: true }));

    expect(verdict.tone).toBe("ilegivel");
    expect(verdict.headline).not.toContain("pode receber pagamentos");
    expect(verdict.primarySync).toEqual({ label: "Tentar de novo", refreshKyc: false });
  });

  it("sends a vendor with no recipient to the financial form", () => {
    const verdict = buildRecipientVerdict(recipient());

    expect(verdict.tone).toBe("andamento");
    expect(verdict.primaryAction?.label).toBe("Preencher dados financeiros");
    expect(verdict.primaryAction?.href).toContain("/vendor/onboarding");
  });

  it("opens the existing KYC link when the Pagar.me verification is pending", () => {
    const verdict = buildRecipientVerdict(
      recipient({ recipientId: "re_1", status: "affiliation", kycUrl: "https://kyc.example/1" }),
    );

    expect(verdict.primaryAction).toEqual({
      external: true,
      href: "https://kyc.example/1",
      label: "Abrir verificação (KYC)",
    });
  });

  it("offers to generate the KYC link when the vendor has none", () => {
    const verdict = buildRecipientVerdict(recipient({ recipientId: "re_1", status: "affiliation" }));

    expect(verdict.primaryAction).toBeNull();
    expect(verdict.primarySync).toEqual({ label: "Gerar link de KYC", refreshKyc: true });
  });

  it("routes a suspended recipient to Papelito instead of to the form", () => {
    const verdict = buildRecipientVerdict(recipient({ recipientId: "re_1", status: "suspended" }));

    expect(verdict.tone).toBe("impedido");
    expect(verdict.primaryAction?.href).toBe("/vendor/mensagens");
  });

  it("names an unknown Pagar.me status instead of guessing it is fine", () => {
    const verdict = buildRecipientVerdict(recipient({ recipientId: "re_1", status: "quarantined" }));

    expect(verdict.tone).toBe("andamento");
    expect(verdict.detail).toContain("quarantined");
    expect(verdict.primaryAction?.href).toBe("/vendor/mensagens");
  });
});
