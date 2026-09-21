import { describe, expect, it } from "vitest";

import type {
  VendorEligibility,
  VendorEligibilityRequirement,
  VendorRequirementId,
} from "../types/vendor-eligibility";
import { groupBlockingByNavHref, readVendorPendencies } from "./vendor-eligibility";

const BOXES_NAV_HREF = "/vendor/cubagem";
const SETTINGS_NAV_HREF = "/vendor/configuracoes";

function requirement(
  id: VendorRequirementId,
  overrides: Partial<VendorEligibilityRequirement> = {},
): VendorEligibilityRequirement {
  return {
    advisory: false,
    blocking: false,
    id,
    reason: "",
    satisfied: true,
    ...overrides,
  };
}

function eligibility(overrides: Partial<VendorEligibility> = {}): VendorEligibility {
  return {
    canSell: true,
    loadFailed: false,
    minimumBoxes: 2,
    recommendedBoxes: 3,
    requirements: [
      requirement("account"),
      requirement("pagarme"),
      requirement("boxes", { activeCount: 3 }),
    ],
    ...overrides,
  };
}

function boxesOnly(activeCount: number, overrides: Partial<VendorEligibilityRequirement>, config?: Partial<VendorEligibility>) {
  return eligibility({
    ...config,
    requirements: [requirement("boxes", { activeCount, ...overrides })],
  });
}

describe("readVendorPendencies", () => {
  it("não produz item quando todos os requisitos estão atendidos", () => {
    expect(readVendorPendencies(eligibility())).toEqual([]);
  });

  it("cala quando o veredito não pôde ser lido", () => {
    const unreadable = eligibility({
      loadFailed: true,
      requirements: [requirement("pagarme", { blocking: true, reason: "never_synced", satisfied: false })],
    });

    expect(readVendorPendencies(unreadable)).toEqual([]);
  });

  it("descreve as caixas abaixo do mínimo com a contagem e o que falta", () => {
    const [pending] = readVendorPendencies(
      boxesOnly(1, { blocking: true, reason: "below_minimum", satisfied: false }),
    );

    expect(pending.kind).toBe("blocking");
    expect(pending.navHref).toBe(BOXES_NAV_HREF);
    expect(pending.detail).toContain("1 de 2 caixas ativas");
    expect(pending.detail).toContain("mais 1 caixa");
  });

  it("trata o recomendado como recomendação, nunca como bloqueio", () => {
    const [pending] = readVendorPendencies(
      boxesOnly(2, { advisory: true, reason: "below_recommended" }),
    );

    expect(pending.kind).toBe("advisory");
    expect(pending.title).toBe("Recomendamos 3 caixas");
    expect(pending.detail).toContain("o mínimo exigido");
    expect(pending.detail).toContain("pelo menos 3");
  });

  it("acompanha o recomendado configurado", () => {
    const [pending] = readVendorPendencies(
      boxesOnly(2, { advisory: true, reason: "below_recommended" }, { recommendedBoxes: 6 }),
    );

    expect(pending.title).toBe("Recomendamos 6 caixas");
    expect(pending.kind).toBe("advisory");
  });

  it("mantém a falta de caixas visível como aviso quando o gate está desligado", () => {
    const [pending] = readVendorPendencies(
      boxesOnly(0, { advisory: true, blocking: false, reason: "below_minimum", satisfied: false }),
    );

    expect(pending.kind).toBe("advisory");
    expect(pending.title).toBe("Caixas abaixo do mínimo");
  });

  it("traduz cada motivo da Pagar.me", () => {
    const motivos = ["never_synced", "sync_error", "in_review", "kyc_required", "rejected", "unknown"];

    for (const reason of motivos) {
      const [pending] = readVendorPendencies(
        eligibility({
          requirements: [requirement("pagarme", { blocking: true, reason, satisfied: false })],
        }),
      );

      expect(pending.kind).toBe("blocking");
      expect(pending.navHref).toBe(SETTINGS_NAV_HREF);
      expect(pending.href).toBe("/vendor/configuracoes#pagamentos");
      expect(pending.title.length).toBeGreaterThan(0);
    }
  });

  it("trata a falha da última sincronização como aviso sobre recebedor ativo", () => {
    const [pending] = readVendorPendencies(
      eligibility({
        requirements: [requirement("pagarme", { advisory: true, reason: "last_sync_failed" })],
      }),
    );

    expect(pending.kind).toBe("advisory");
    expect(pending.detail).toContain("continua ativo");
  });

  it("descarta motivo que o painel não conhece em vez de exibir linha vazia", () => {
    const pendencies = readVendorPendencies(
      eligibility({
        requirements: [requirement("boxes", { activeCount: 1, blocking: true, reason: "marte", satisfied: false })],
      }),
    );

    expect(pendencies).toEqual([]);
  });

  it("lista os bloqueios antes das recomendações", () => {
    const pendencies = readVendorPendencies(
      eligibility({
        requirements: [
          requirement("boxes", { activeCount: 2, advisory: true, reason: "below_recommended" }),
          requirement("pagarme", { blocking: true, reason: "never_synced", satisfied: false }),
        ],
      }),
    );

    expect(pendencies.map((item) => item.kind)).toEqual(["blocking", "advisory"]);
  });
});

describe("groupBlockingByNavHref", () => {
  it("agrupa os bloqueios por item de navegação e ignora as recomendações", () => {
    const pendencies = readVendorPendencies(
      eligibility({
        requirements: [
          requirement("account", { blocking: true, reason: "suspended", satisfied: false }),
          requirement("pagarme", { blocking: true, reason: "rejected", satisfied: false }),
          requirement("boxes", { activeCount: 2, advisory: true, reason: "below_recommended" }),
        ],
      }),
    );
    const grouped = groupBlockingByNavHref(pendencies);

    expect(grouped.get(SETTINGS_NAV_HREF)).toHaveLength(2);
    expect(grouped.has(BOXES_NAV_HREF)).toBe(false);
  });
});
