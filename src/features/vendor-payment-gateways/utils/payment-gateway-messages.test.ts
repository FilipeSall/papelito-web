import { describe, expect, it } from "vitest";

import { gatewayErrorMessage, gatewayReasonLabel, gatewayStateLabel } from "./payment-gateway-messages";

describe("payment-gateway-messages", () => {
  it("restrição CNAE usa o texto fixo da spec", () => {
    expect(gatewayStateLabel("blocked_cnae")).toBe("Pagar.me indisponível para este CNAE");
    expect(gatewayErrorMessage("papelito_payment_gateway_blocked_cnae")).toBe("Pagar.me indisponível para este CNAE");
  });

  it("conexão OAuth sem verificação não é apresentada como aprovada", () => {
    expect(gatewayStateLabel("verification_pending")).not.toMatch(/aprovad|apta/i);
  });

  it("erros públicos têm mensagem própria e desconhecido cai no genérico", () => {
    for (const code of [
      "papelito_payment_gateway_not_eligible",
      "papelito_payment_preference_version_conflict",
      "papelito_financial_profile_version_conflict",
      "papelito_financial_profile_masked_value",
      "papelito_pagarme_cnae_verification_pending",
      "papelito_payment_attempt_reconciling",
      "papelito_payment_configuration_stale",
      "papelito_payment_vendor_suspended",
      "papelito_payment_no_gateway_available",
      "papelito_payment_gateways_disabled",
      "papelito_reauthentication_failed",
      "papelito_mercadopago_oauth_state_invalid",
      "papelito_financial_profile_invalid_document",
      "papelito_financial_profile_invalid_birthdate",
      "papelito_financial_profile_version_required",
      "papelito_financial_profile_encryption_failed",
      "papelito_payment_provider_unknown",
      "papelito_mercadopago_invalid_authorization_url",
    ]) {
      expect(gatewayErrorMessage(code)).not.toBe(gatewayErrorMessage("codigo_que_nao_existe"));
    }
  });

  it("motivo desconhecido não vaza código cru", () => {
    expect(gatewayReasonLabel("algo_interno_xyz")).toBe("Verifique o estado com o suporte da Papelito.");
    expect(gatewayReasonLabel("identity_verification_pending")).toMatch(/Papelito/);
  });
});
