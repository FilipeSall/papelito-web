import { describe, expect, it } from "vitest";

import { ADMIN_DICHAVADOR_ID, ADMIN_PITEIRA_ID, adminPricesSnapshot } from "../test/admin-prices-fixtures";
import {
  buildPublishPayload,
  draftChangeCount,
  draftFromSnapshot,
  draftKitUnitCents,
  invalidPriceIds,
  parseKitPctOff,
  parseMoneyInput,
} from "./admin-prices-draft";

describe("parseMoneyInput", () => {
  it.each([
    ["89,90", 8990],
    ["89.90", 8990],
    ["89", 8900],
    ["1.234,56", 123456],
    ["1.234", 123400],
    ["R$ 59,9", 5990],
  ])("lê %s como %i centavos", (raw, cents) => {
    expect(parseMoneyInput(raw)).toEqual({ kind: "valid", cents });
  });

  it("trata campo vazio como preço do site", () => {
    expect(parseMoneyInput("  ")).toEqual({ kind: "empty" });
  });

  it.each(["abc", "0", "0,00", "12,345", "100000,01", "-5"])("recusa %s", (raw) => {
    expect(parseMoneyInput(raw)).toEqual({ kind: "invalid" });
  });
});

describe("parseKitPctOff", () => {
  it("aceita inteiro de 0 a 50", () => {
    expect(parseKitPctOff("0")).toBe(0);
    expect(parseKitPctOff("50")).toBe(50);
  });

  it.each(["51", "12,5", "", "-1"])("recusa %s", (raw) => {
    expect(parseKitPctOff(raw)).toBeNull();
  });
});

describe("rascunho de preços do estande", () => {
  it("começa igual ao publicado, sem alterações", () => {
    const snapshot = adminPricesSnapshot();
    const draft = draftFromSnapshot(snapshot);

    expect(draft.prices[ADMIN_DICHAVADOR_ID]).toBe("89,00");
    expect(draft.prices[ADMIN_PITEIRA_ID]).toBe("");
    expect(draftChangeCount(snapshot, draft)).toBe(0);
  });

  it("conta preço novo, preço removido e desconto do kit", () => {
    const snapshot = adminPricesSnapshot();
    const base = draftFromSnapshot(snapshot);
    const draft = {
      prices: { ...base.prices, [ADMIN_PITEIRA_ID]: "59,90", [ADMIN_DICHAVADOR_ID]: "" },
      kitPctOff: "20",
    };

    expect(draftChangeCount(snapshot, draft)).toBe(3);
  });

  it("não conta preço igual ao do site como preço próprio", () => {
    const snapshot = adminPricesSnapshot();
    const draft = { ...draftFromSnapshot(snapshot) };
    draft.prices = { ...draft.prices, [ADMIN_PITEIRA_ID]: "64,37" };

    expect(draftChangeCount(snapshot, draft)).toBe(0);
    expect(buildPublishPayload(snapshot, draft)?.prices).toEqual({ [String(ADMIN_DICHAVADOR_ID)]: 8900 });
  });

  it("calcula o kit com o preço do estande e o desconto do rascunho, como o WordPress", () => {
    const snapshot = adminPricesSnapshot();
    const base = draftFromSnapshot(snapshot);

    expect(draftKitUnitCents(snapshot, base)).toBe(65595);
    expect(draftKitUnitCents(snapshot, { prices: { ...base.prices, 11792: "150,00" }, kitPctOff: "20" })).toBe(59320);
  });

  it("devolve kit nulo quando o desconto é inválido ou falta produto", () => {
    const snapshot = adminPricesSnapshot();
    const draft = draftFromSnapshot(snapshot);

    expect(draftKitUnitCents(snapshot, { ...draft, kitPctOff: "70" })).toBeNull();
    expect(draftKitUnitCents(adminPricesSnapshot({ products: snapshot.products.slice(1) }), draft)).toBeNull();
  });

  it("monta a publicação com todos os preços próprios e a versão aberta", () => {
    const snapshot = adminPricesSnapshot();
    const base = draftFromSnapshot(snapshot);
    const draft = { prices: { ...base.prices, [ADMIN_PITEIRA_ID]: "59,90" }, kitPctOff: "15" };

    expect(buildPublishPayload(snapshot, draft)).toEqual({
      version: 3,
      prices: { [String(ADMIN_PITEIRA_ID)]: 5990, [String(ADMIN_DICHAVADOR_ID)]: 8900 },
      kitPctOff: 15,
    });
  });

  it("bloqueia a publicação com campo inválido", () => {
    const snapshot = adminPricesSnapshot();
    const base = draftFromSnapshot(snapshot);
    const draft = { prices: { ...base.prices, [ADMIN_PITEIRA_ID]: "abc" }, kitPctOff: "15" };

    expect(invalidPriceIds(snapshot, draft)).toEqual([ADMIN_PITEIRA_ID]);
    expect(buildPublishPayload(snapshot, draft)).toBeNull();
  });
});
