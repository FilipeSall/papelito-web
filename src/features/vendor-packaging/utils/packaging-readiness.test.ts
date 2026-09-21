import { describe, expect, it } from "vitest";

import type { VendorPackagingProfile } from "../types/vendor-packaging";
import {
  packagingSetupSteps,
  readPackagingReadiness,
  type PackagingBoxesPolicy,
} from "./packaging-readiness";

const REVIEW_DETAIL = "1 caixa ainda pede conferência.";
const DEFAULT_POLICY: PackagingBoxesPolicy = { minimum: 2, recommended: 3 };

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

function stateOf(
  items: VendorPackagingProfile[],
  id: string,
  policy: PackagingBoxesPolicy = DEFAULT_POLICY,
) {
  return packagingSetupSteps(items, policy).find((step) => step.id === id)?.state;
}

function confirmed(count: number) {
  return Array.from({ length: count }, (_, index) => profile({ id: index + 1, version: 2 }));
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

  it("conta tara ausente sem cobrar conferência de medida", () => {
    const readiness = readPackagingReadiness([
      profile({ source: "custom", tareWeightG: 0, version: 2 }),
    ]);

    expect(readiness.missingTareCount).toBe(1);
    expect(readiness.unconfirmedCount).toBe(0);
  });

  it("não conta tara de caixa inativa", () => {
    expect(readPackagingReadiness([profile({ active: false, tareWeightG: 0 })]).missingTareCount).toBe(
      0,
    );
  });
});

describe("packagingSetupSteps", () => {
  it("abre com o primeiro marco em curso quando não há caixa", () => {
    const steps = packagingSetupSteps([], DEFAULT_POLICY);

    expect(steps.map((step) => step.state)).toEqual(["current", "pending", "pending"]);
    expect(steps[0].detail).toBe("Nenhuma caixa ativa ainda.");
  });

  it("passa a cobrar a conferência assim que há caixa RPC nova", () => {
    const steps = packagingSetupSteps([profile()], DEFAULT_POLICY);

    expect(steps.map((step) => step.state)).toEqual(["done", "current", "pending"]);
    expect(steps[1].detail).toBe(REVIEW_DETAIL);
  });

  it("fecha o despacho ao atingir o mínimo, que é duas caixas por padrão", () => {
    expect(packagingSetupSteps(confirmed(2), DEFAULT_POLICY).map((step) => step.state)).toEqual([
      "done",
      "done",
      "done",
    ]);
  });

  it("no mínimo, recomenda o número maior sem reabrir o marco", () => {
    const steps = packagingSetupSteps(confirmed(2), DEFAULT_POLICY);

    expect(steps[2].state).toBe("done");
    expect(steps[2].detail).toBe("Mínimo atingido. Recomendamos 3 caixas para ter mais folga.");
  });

  it("a partir do recomendado a faixa para de sugerir", () => {
    expect(packagingSetupSteps(confirmed(3), DEFAULT_POLICY)[2].detail).toBe(
      "Caixas suficientes para as transportadoras cotarem.",
    );
  });

  it("abaixo do mínimo diz quantas faltam, concordando o plural", () => {
    expect(packagingSetupSteps(confirmed(1), DEFAULT_POLICY)[2].detail).toBe(
      "Falta 1 caixa para seus produtos voltarem à vitrine.",
    );
    expect(packagingSetupSteps(confirmed(1), { minimum: 4, recommended: 6 })[2].detail).toBe(
      "Faltam 3 caixas para seus produtos voltarem à vitrine.",
    );
  });

  it("subir o mínimo reabre o marco de despacho de quem já estava pronto", () => {
    expect(stateOf(confirmed(2), "despacho")).toBe("done");
    expect(stateOf(confirmed(2), "despacho", { minimum: 4, recommended: 5 })).toBe("current");
  });

  it("subir só o recomendado nunca reabre o marco", () => {
    expect(stateOf(confirmed(2), "despacho", { minimum: 2, recommended: 9 })).toBe("done");
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
