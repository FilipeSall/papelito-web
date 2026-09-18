import { describe, expect, it } from "vitest";

import type { VendorPackagingProfile } from "../types/vendor-packaging";
import { packagingSetupSteps, readPackagingReadiness } from "./packaging-readiness";

const REVIEW_DETAIL = "1 caixa ainda pede conferência.";

function profile(overrides: Partial<VendorPackagingProfile> = {}): VendorPackagingProfile {
  return {
    active: true,
    code: "M12",
    createdAt: "",
    heightMm: 120,
    id: 1,
    label: "Caixa RPC M12",
    lengthMm: 240,
    maxPayloadG: 4000,
    source: "rpc",
    tareWeightG: 300,
    updatedAt: "",
    version: 1,
    widthMm: 160,
    ...overrides,
  };
}

function stateOf(items: VendorPackagingProfile[], id: string) {
  return packagingSetupSteps(items).find((step) => step.id === id)?.state;
}

describe("readPackagingReadiness", () => {
  it("separa ativas, inativas e medidas por conferir", () => {
    const readiness = readPackagingReadiness([
      profile({ id: 1 }),
      profile({ id: 2, source: "custom", version: 1 }),
      profile({ active: false, id: 3 }),
    ]);

    expect(readiness).toEqual({
      activeCount: 2,
      inactiveCount: 1,
      missingTareCount: 0,
      unconfirmedCount: 1,
    });
  });

  it("não cobra conferência de caixa RPC já editada", () => {
    expect(readPackagingReadiness([profile({ version: 2 })]).unconfirmedCount).toBe(0);
  });

  it("não cobra conferência de caixa própria", () => {
    expect(readPackagingReadiness([profile({ source: "custom" })]).unconfirmedCount).toBe(0);
  });

  it("cobra conferência de caixa ativa sem tara, qualquer que seja a origem", () => {
    const readiness = readPackagingReadiness([
      profile({ source: "custom", tareWeightG: 0, version: 2 }),
    ]);

    expect(readiness.missingTareCount).toBe(1);
    expect(readiness.unconfirmedCount).toBe(1);
  });

  it("não conta tara de caixa inativa", () => {
    expect(readPackagingReadiness([profile({ active: false, tareWeightG: 0 })]).missingTareCount).toBe(
      0,
    );
  });
});

describe("packagingSetupSteps", () => {
  it("abre com o primeiro marco em curso quando não há caixa", () => {
    const steps = packagingSetupSteps([]);

    expect(steps.map((step) => step.state)).toEqual(["current", "pending", "pending"]);
    expect(steps[0].detail).toBe("Nenhuma caixa ativa ainda.");
  });

  it("passa a cobrar a conferência assim que há caixa RPC nova", () => {
    const steps = packagingSetupSteps([profile()]);

    expect(steps.map((step) => step.state)).toEqual(["done", "current", "pending"]);
    expect(steps[1].detail).toBe(REVIEW_DETAIL);
  });

  it("fecha o despacho com três caixas ativas conferidas", () => {
    const items = [1, 2, 3].map((id) => profile({ id, version: 2 }));

    expect(packagingSetupSteps(items).map((step) => step.state)).toEqual([
      "done",
      "done",
      "done",
    ]);
  });

  it("mantém um marco concluído mesmo com o anterior pendente", () => {
    const items = [
      profile({ id: 1 }),
      profile({ code: "G12", id: 2, version: 2 }),
      profile({ code: "S08", id: 3, version: 2 }),
    ];

    expect(stateOf(items, "medidas")).toBe("current");
    expect(stateOf(items, "despacho")).toBe("done");
  });

  it("desativar a última caixa devolve a faixa ao começo", () => {
    expect(stateOf([profile({ active: false })], "modelos")).toBe("current");
  });
});
