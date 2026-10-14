import { describe, expect, it } from "vitest";

import { normalizeBraspressIntegration, readBraspressIntegration } from "./braspress-integration-payload";

describe("normalizeBraspressIntegration", () => {
  it("não promete cotação para um estado que o painel não conhece", () => {
    expect(normalizeBraspressIntegration({ enabled: true, status: "quarantined" }).status).toBe("unconfigured");
  });

  it("aceita o habilitado que o WordPress devolve como inteiro", () => {
    expect(normalizeBraspressIntegration({ enabled: 1, status: "active" }).enabled).toBe(true);
  });
});

describe("readBraspressIntegration", () => {
  it("recusa corpo sem a forma de integração", () => {
    expect(readBraspressIntegration({ enabled: true })).toBeNull();
    expect(readBraspressIntegration([])).toBeNull();
    expect(readBraspressIntegration(null)).toBeNull();
  });

  it("adota a integração normalizada como lida", () => {
    const integration = normalizeBraspressIntegration({ enabled: true, status: "provider_blocked", config: {} });

    expect(readBraspressIntegration(integration)).toMatchObject({ loadFailed: false, status: "provider_blocked" });
  });
});
