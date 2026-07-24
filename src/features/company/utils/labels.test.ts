import { describe, expect, it } from "vitest";

import { blockMessageFor, roleLabel } from "./labels";

describe("blockMessageFor", () => {
  const base = {
    onboardingStatus: "complete" as const,
    companyStatus: "active",
    membershipStatus: "active" as const,
    canPurchase: true,
  };

  it("no bloqueio quando compra liberada e empresa completa", () => {
    expect(blockMessageFor(base)).toBeNull();
  });

  it("sem empresa → convida a cadastrar/entrar", () => {
    const msg = blockMessageFor({ ...base, onboardingStatus: "none" });
    expect(msg?.title).toMatch(/ainda não faz parte/i);
  });

  it("seleção obrigatória tem prioridade e bloqueia", () => {
    const msg = blockMessageFor({
      ...base,
      onboardingStatus: "company_selection_required",
      canPurchase: false,
    });
    expect(msg?.title).toMatch(/selecione a empresa ativa/i);
  });

  it("membership pendente → cadastro em análise", () => {
    const msg = blockMessageFor({
      ...base,
      onboardingStatus: "pending",
      membershipStatus: "pending_company_approval",
      canPurchase: false,
    });
    expect(msg?.title).toMatch(/em análise/i);
  });

  it("membro suspenso → acesso suspenso", () => {
    const msg = blockMessageFor({
      ...base,
      membershipStatus: "suspended",
      canPurchase: false,
    });
    expect(msg?.title).toMatch(/suspenso/i);
  });

  it("sem permissão de compra (papel viewer) → compra indisponível", () => {
    const msg = blockMessageFor({ ...base, canPurchase: false });
    expect(msg?.title).toMatch(/compra indisponível/i);
  });
});

describe("roleLabel", () => {
  it("traduz papéis", () => {
    expect(roleLabel("owner")).toBe("Titular");
    expect(roleLabel("admin")).toBe("Administrador");
    expect(roleLabel("buyer")).toBe("Comprador");
    expect(roleLabel("viewer")).toBe("Consulta");
    expect(roleLabel(null)).toBe("—");
  });
});
