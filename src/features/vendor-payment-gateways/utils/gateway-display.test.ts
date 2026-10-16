import { describe, expect, it } from "vitest";

import type { GatewayStatus, VendorPaymentSummary } from "../types/payment-gateways";
import {
  formatCnaeCode,
  formatGatewayTimestamp,
  gatewayTone,
  identityStatusLabel,
  isMercadoPagoConnected,
  oauthReturnBanner,
  paymentRoutes,
  pendingFieldLabel,
  selectedGatewayReady,
  vendorPaymentSignal,
} from "./gateway-display";

function gateway(overrides: Partial<GatewayStatus> = {}): GatewayStatus {
  return {
    provider: "mercadopago",
    state: "ready",
    connectionStatus: "connected",
    kycStatus: "",
    restrictionCode: "",
    healthStatus: "ok",
    canReceive: true,
    reasonCodes: [],
    pendingFields: [],
    cnaeCodes: [],
    lastCheckedAt: "",
    lastSuccessAt: "",
    configurationVersion: "1",
    ...overrides,
  };
}

function summary(gateways: GatewayStatus[], overrides: Partial<VendorPaymentSummary> = {}): VendorPaymentSummary {
  return {
    mode: "gateways",
    gateways,
    preference: { preferredProvider: "mercadopago", version: 3, explicit: false },
    mercadopagoAccount: null,
    ...overrides,
  };
}

describe("gatewayTone", () => {
  it("só chama de apto o gateway que o backend diz que recebe", () => {
    expect(gatewayTone(gateway())).toBe("ready");
    expect(gatewayTone(gateway({ state: "degraded" }))).toBe("ready");
    expect(gatewayTone(gateway({ state: "verification_pending", canReceive: false }))).toBe("pending");
    expect(gatewayTone(gateway({ state: "ready", canReceive: false }))).toBe("pending");
  });

  it("separa bloqueio de pendência e cala sem leitura", () => {
    expect(gatewayTone(gateway({ provider: "pagarme", state: "blocked_cnae", canReceive: false }))).toBe("blocked");
    expect(gatewayTone(gateway({ state: "unavailable", canReceive: false }))).toBe("blocked");
    expect(gatewayTone(null)).toBe("unknown");
  });
});

describe("formatCnaeCode", () => {
  it("aplica a máscara oficial em código de sete dígitos e preserva o resto", () => {
    expect(formatCnaeCode("4729601")).toBe("4729-6/01");
    expect(formatCnaeCode("47")).toBe("47");
  });
});

describe("formatGatewayTimestamp", () => {
  it("formata no fuso de São Paulo e devolve vazio sem data", () => {
    expect(formatGatewayTimestamp("2026-10-16T13:30:00Z")).toMatch(/16\/10\/2026.*10:30/);
    expect(formatGatewayTimestamp("")).toBe("");
    expect(formatGatewayTimestamp("não é data")).toBe("");
  });
});

describe("pendingFieldLabel", () => {
  it("usa o rótulo do cadastro e nunca mostra a chave crua", () => {
    expect(pendingFieldLabel("partner.document")).toMatch(/CPF/);
    expect(pendingFieldLabel("campo.interno.xyz")).not.toContain("campo.interno");
  });
});

describe("paymentRoutes", () => {
  function route(routes: ReturnType<typeof paymentRoutes>, provider: string) {
    const found = routes.find((item) => item.provider === provider);
    if (!found) throw new Error(`rota ${provider} ausente`);
    return found;
  }

  it("só o gateway escolhido recebe; o outro fica fora do checkout", () => {
    const routes = paymentRoutes(summary([gateway(), gateway({ provider: "pagarme" })]));

    expect(route(routes, "mercadopago")).toMatchObject({ selected: true, role: "Recebe os pedidos", roleTone: "positive" });
    expect(route(routes, "pagarme")).toMatchObject({ selected: false, selectable: true, role: "Fora do checkout", roleTone: "neutral" });
  });

  it("gateway inapto não pode ser escolhido e explica o motivo", () => {
    const routes = paymentRoutes(
      summary([gateway(), gateway({ provider: "pagarme", state: "blocked_cnae", canReceive: false, reasonCodes: ["cnae_restricted"] })]),
    );

    expect(route(routes, "pagarme")).toMatchObject({ selectable: false, hint: "Pagar.me indisponível para este CNAE" });
  });

  it("escolha que ficou inapta continua marcada e tira a loja do checkout", () => {
    const routes = paymentRoutes(
      summary([gateway({ state: "connection_pending", canReceive: false, reasonCodes: ["reauthorization_required"] }), gateway({ provider: "pagarme" })], {
        preference: { preferredProvider: "mercadopago", version: 3, explicit: true },
      }),
    );
    const mercadopago = route(routes, "mercadopago");

    expect(mercadopago).toMatchObject({ selected: true, statusTone: "attention", roleTone: "attention" });
    expect(mercadopago.hint).toMatch(/Conecte de novo/);
  });

  it("modo suspenso não deixa escolher nada", () => {
    const routes = paymentRoutes(summary([gateway(), gateway({ provider: "pagarme" })], { mode: "suspended" }));

    expect(routes.every((item) => !item.selectable)).toBe(true);
  });

  it("gateway ausente da resposta não vira selecionável", () => {
    const routes = paymentRoutes(summary([]));

    expect(route(routes, "mercadopago").selectable).toBe(false);
    expect(route(routes, "mercadopago").hint).not.toBe("");
  });
});

describe("selectedGatewayReady e isMercadoPagoConnected", () => {
  it("lê aptidão só do gateway escolhido", () => {
    expect(selectedGatewayReady(summary([gateway({ canReceive: false, state: "kyc_pending" }), gateway({ provider: "pagarme" })]))).toBe(false);
    expect(
      selectedGatewayReady(
        summary([gateway({ canReceive: false, state: "kyc_pending" }), gateway({ provider: "pagarme" })], {
          preference: { preferredProvider: "pagarme", version: 1, explicit: true },
        }),
      ),
    ).toBe(true);
    expect(selectedGatewayReady(null)).toBe(false);
  });

  it("conta como conectada só a conta ativa", () => {
    const account = { accountId: 99, collectorId: "99", identityStatus: "pending", status: "active", tokenExpiresAt: "", connectedAt: "" };

    expect(isMercadoPagoConnected(summary([], { mercadopagoAccount: account }))).toBe(true);
    expect(isMercadoPagoConnected(summary([], { mercadopagoAccount: { ...account, status: "disconnected" } }))).toBe(false);
    expect(isMercadoPagoConnected(summary([]))).toBe(false);
  });
});

describe("oauthReturnBanner", () => {
  it("confirma a conexão sem prometer aprovação", () => {
    const banner = oauthReturnBanner("connected");

    expect(banner?.tone).toBe("success");
    expect(`${banner?.title} ${banner?.message}`).not.toMatch(/aprovad|pronto para receber/i);
  });

  it("traduz o motivo do erro pelo catálogo e trata recusa e sessão", () => {
    expect(oauthReturnBanner("error", "papelito_payment_account_collector_in_use")?.message).toMatch(/outra loja/);
    expect(oauthReturnBanner("error", "codigo_estranho")?.message).not.toContain("codigo_estranho");
    expect(oauthReturnBanner("denied")?.tone).toBe("info");
    expect(oauthReturnBanner("session_required")?.tone).toBe("error");
  });

  it("ignora valor ausente ou desconhecido", () => {
    expect(oauthReturnBanner(undefined)).toBeNull();
    expect(oauthReturnBanner("qualquer")).toBeNull();
  });
});

describe("vendorPaymentSignal", () => {
  const activeRecipient = { loadFailed: false, status: "active" };

  it("no modo novo, apta só quando o gateway escolhido recebe", () => {
    expect(vendorPaymentSignal(summary([gateway()]), { loadFailed: false, status: "" })).toBe("apta a vender");
    expect(
      vendorPaymentSignal(summary([gateway({ canReceive: false, state: "kyc_pending" }), gateway({ provider: "pagarme" })]), activeRecipient),
    ).toBe("venda bloqueada");
  });

  it("modo suspenso bloqueia mesmo com gateway apto", () => {
    expect(vendorPaymentSignal(summary([gateway()], { mode: "suspended" }), activeRecipient)).toBe("venda bloqueada");
  });

  it("legado ou resumo ilegível mantém o sinal do recebedor", () => {
    expect(vendorPaymentSignal(summary([], { mode: "legacy" }), activeRecipient)).toBe("apta a vender");
    expect(vendorPaymentSignal(null, { loadFailed: false, status: "registration" })).toBe("venda bloqueada");
    expect(vendorPaymentSignal(null, { loadFailed: true, status: "" })).toBe("estado não lido");
  });
});

describe("identityStatusLabel", () => {
  it("só chama de conferida a titularidade verificada", () => {
    expect(identityStatusLabel("verified")).toBe("Titularidade conferida");
    expect(identityStatusLabel("mismatch")).toBe("Conta de outro titular");
    expect(identityStatusLabel("pending")).toBe("Aguardando conferência");
    expect(identityStatusLabel("")).toBe("Aguardando conferência");
  });
});
