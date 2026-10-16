import { describe, expect, it } from "vitest";

import {
  parseFinancialProfile,
  parseGatewayStatus,
  parsePaymentContext,
  parseVendorPaymentSummary,
} from "./parse-payment-gateways";

const READY_MP = {
  provider: "mercadopago",
  state: "ready",
  connectionStatus: "connected",
  kycStatus: "not_exposed",
  restrictionCode: "",
  healthStatus: "ok",
  canReceive: true,
  reasonCodes: [],
  pendingFields: [],
  cnaeCodes: [],
  lastCheckedAt: "2026-10-16 10:00:00",
  lastSuccessAt: "2026-10-16 10:00:00",
  configurationVersion: "abc",
};

describe("parseGatewayStatus", () => {
  it("aceita o GatewayStatus do WordPress", () => {
    expect(parseGatewayStatus(READY_MP)).toMatchObject({ provider: "mercadopago", state: "ready", canReceive: true });
  });

  it("estado desconhecido nunca vira apto", () => {
    expect(parseGatewayStatus({ ...READY_MP, state: "approved_by_magic" })).toMatchObject({ state: "unavailable", canReceive: false });
  });

  it("canReceive só é verdadeiro com booleano true", () => {
    expect(parseGatewayStatus({ ...READY_MP, canReceive: "true" })?.canReceive).toBe(false);
  });

  it("provider desconhecido é descartado", () => {
    expect(parseGatewayStatus({ ...READY_MP, provider: "stripe" })).toBeNull();
  });

  it("preserva os códigos CNAE do bloqueio", () => {
    const blocked = parseGatewayStatus({
      ...READY_MP,
      provider: "pagarme",
      state: "blocked_cnae",
      canReceive: false,
      cnaeCodes: [{ code: "4729601", position: "primary", label: "Comércio varejista de produtos do fumo" }],
    });

    expect(blocked?.cnaeCodes).toEqual([{ code: "4729601", position: "primary", label: "Comércio varejista de produtos do fumo" }]);
  });
});

describe("parseVendorPaymentSummary", () => {
  it("lê modo, gateways e preferência", () => {
    const summary = parseVendorPaymentSummary({
      mode: "gateways",
      gateways: [READY_MP, { ...READY_MP, provider: "pagarme", state: "kyc_pending", canReceive: false }],
      preference: { preferredProvider: "mercadopago", version: 2, explicit: true },
      mercadopagoAccount: { collectorId: "900001", identityStatus: "verified", status: "active" },
    });

    expect(summary).toMatchObject({
      mode: "gateways",
      preference: { preferredProvider: "mercadopago", version: 2, explicit: true },
      mercadopagoAccount: { collectorId: "900001", identityStatus: "verified", status: "active" },
    });
    expect(summary?.gateways.map((gateway) => gateway.provider)).toEqual(["mercadopago", "pagarme"]);
  });

  it("resposta malformada é nula", () => {
    expect(parseVendorPaymentSummary({ gateways: "x" })).toBeNull();
    expect(parseVendorPaymentSummary(null)).toBeNull();
  });
});

describe("parsePaymentContext", () => {
  it("aceita redirect do Mercado Pago e direto da Pagar.me", () => {
    expect(parsePaymentContext({ provider: "mercadopago", flow: "redirect", configurationVersion: "v", fallbackReason: "" })).toEqual({
      provider: "mercadopago",
      flow: "redirect",
      configurationVersion: "v",
      fallbackReason: "",
    });
    expect(parsePaymentContext({ provider: "pagarme", flow: "direct", configurationVersion: "v", fallbackReason: "x" })?.flow).toBe("direct");
  });

  it("combinação incoerente é recusada", () => {
    expect(parsePaymentContext({ provider: "pagarme", flow: "redirect", configurationVersion: "v" })).toBeNull();
    expect(parsePaymentContext({ provider: "mercadopago", flow: "direct", configurationVersion: "v" })).toBeNull();
  });
});

describe("parseFinancialProfile", () => {
  it("lê versão, indicadores de CPF e pendências por gateway sem CPF em claro", () => {
    const profile = parseFinancialProfile({
      version: 3,
      cnpj: "11.222.333/0001-81",
      cnpjChanged: false,
      profile: {
        companyName: "Loja LTDA",
        managingPartners: [{ name: "Ana", hasDocument: true, documentLast4: "8909", hasBirthdate: true, document: "52998224725" }],
        bankAccount: { bankCode: "341" },
      },
      pending: { pagarme: { policy: "allowed", pendingFields: ["bankAccount.accountNumber"] }, mercadopago: { pendingFields: [] } },
    });

    expect(profile?.version).toBe(3);
    expect(profile?.cnpj).toBe("11.222.333/0001-81");
    expect(profile?.profile.managingPartners[0]).toMatchObject({ hasDocument: true, documentLast4: "8909", hasBirthdate: true });
    expect(JSON.stringify(profile)).not.toContain("52998224725");
    expect(profile?.pending.pagarme.pendingFields).toEqual(["bankAccount.accountNumber"]);
  });

  it("lê nome da mãe e autodeclaração do representante, que o formulário reenvia", () => {
    const profile = parseFinancialProfile({
      version: 1,
      profile: {
        managingPartners: [{ name: "Ana", motherName: "Maria", selfDeclaredLegalRepresentative: true, birthdate: "1990-01-01" }],
      },
    });

    expect(profile?.profile.managingPartners[0]).toMatchObject({ motherName: "Maria", selfDeclaredLegalRepresentative: true });
    expect(JSON.stringify(profile)).not.toContain("1990-01-01");
  });
});
