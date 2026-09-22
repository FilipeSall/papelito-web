import { describe, expect, it } from "vitest";

import { adminBraspressIntegrationState } from "./admin-braspress-integration-state";

type State = Parameters<typeof adminBraspressIntegrationState>[0];

function integration(overrides: Partial<State> = {}): State {
  return { enabled: true, loadFailed: false, status: "active", ...overrides };
}

describe("estado administrativo da integração Braspress", () => {
  it("avisa quando o estado não pôde ser lido", () => {
    expect(adminBraspressIntegrationState(integration({ loadFailed: true })).label).toBe(
      "Estado não lido",
    );
  });

  it("chama de não integrado o vendor que nunca configurou", () => {
    const state = adminBraspressIntegrationState(
      integration({ enabled: false, status: "unconfigured" }),
    );

    expect(state.label).toBe("Não integrado");
    expect(state.tone).toBe("neutral");
  });

  it("distingue desativado de não integrado", () => {
    const state = adminBraspressIntegrationState(integration({ enabled: false, status: "active" }));

    expect(state.label).toBe("Desativado");
    expect(state.description).toContain("continua guardada");
  });

  it("separa pronto para cotar de ativo", () => {
    expect(adminBraspressIntegrationState(integration({ status: "ready" })).label).toBe(
      "Integrado · pronto para cotar",
    );
    expect(adminBraspressIntegrationState(integration()).label).toBe("Integrado · ativo");
  });

  it("mostra credencial recusada mesmo com a integração desligada", () => {
    const state = adminBraspressIntegrationState(
      integration({ enabled: false, status: "invalid_credentials" }),
    );

    expect(state.label).toBe("Credenciais inválidas");
    expect(state.tone).toBe("attention");
  });

  it("mostra bloqueio da transportadora mesmo com a integração desligada", () => {
    const state = adminBraspressIntegrationState(
      integration({ enabled: false, status: "provider_blocked" }),
    );

    expect(state.label).toBe("Bloqueada na Braspress");
    expect(state.tone).toBe("attention");
  });
});
