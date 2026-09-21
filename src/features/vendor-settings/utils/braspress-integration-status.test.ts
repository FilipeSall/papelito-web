import { describe, expect, it } from "vitest";

import type { VendorBraspressIntegration } from "../types/vendor-braspress";

import { braspressIntegrationState } from "./braspress-integration-status";

const BASE: VendorBraspressIntegration = {
  provider: "braspress",
  enabled: true,
  status: "active",
  configurationVersion: 3,
  configured: true,
  credentialsConfigured: true,
  loadFailed: false,
  config: { senderCnpj: "12345678000195", originCep: "01310930" },
};

function state(patch: Partial<VendorBraspressIntegration>) {
  return braspressIntegrationState({ ...BASE, ...patch });
}

describe("braspressIntegrationState", () => {
  it("não chama de ativa uma integração que o vendor desligou", () => {
    const desligada = state({ enabled: false, status: "active" });

    expect(desligada.label).toBe("Desabilitada");
    expect(desligada.description).toMatch(/não é oferecida no checkout/i);
  });

  it("mostra a credencial recusada mesmo com a integração desligada", () => {
    expect(state({ enabled: false, status: "invalid_credentials" }).label).toBe(
      "Credenciais inválidas",
    );
    expect(state({ enabled: false, status: "provider_blocked" }).label).toBe(
      "Conta bloqueada na Braspress",
    );
  });

  it("diz que só substituir usuário e senha sai de credenciais inválidas", () => {
    expect(state({ status: "invalid_credentials" }).description).toMatch(
      /substituir.*usuário e.*senha/i,
    );
  });

  it("não culpa a credencial quando quem recusou foi a Braspress", () => {
    const bloqueada = state({ status: "provider_blocked" });

    expect(bloqueada.description).toMatch(/credencial está correta/i);
    expect(bloqueada.description).not.toMatch(/inválid/i);
  });

  it("avisa que pronta vira ativa sozinha, sem aprovação manual", () => {
    const pronta = state({ status: "ready" });

    expect(pronta.label).toMatch(/pronta/i);
    expect(pronta.description).toMatch(/primeira cotação/i);
    expect(pronta.description).toMatch(/sem validação manual/i);
  });

  it("não promete que ativa basta para aparecer no checkout", () => {
    const ativa = state({ status: "active" });

    expect(ativa.label).toBe("Ativa");
    expect(ativa.description).toMatch(/cobertura/i);
    expect(ativa.description).toMatch(/embalagem/i);
  });

  it("diz o que falta quando nada foi configurado", () => {
    const vazia = state({
      status: "unconfigured",
      enabled: false,
      configured: false,
      credentialsConfigured: false,
    });

    expect(vazia.label).toBe("Não configurada");
    expect(vazia.description).toMatch(/usuário, senha e.*CEP de origem/i);
  });

  it("trata a leitura falha como estado desconhecido, não como não configurada", () => {
    const ilegivel = state({ loadFailed: true });

    expect(ilegivel.label).toBe("Estado não lido");
    expect(ilegivel.description).toMatch(/recarregue/i);
  });
});
