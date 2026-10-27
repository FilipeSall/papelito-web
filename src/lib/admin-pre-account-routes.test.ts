import { describe, expect, it } from "vitest";

import {
  parsePreAccountApplicationId,
  preAccountApplicationBackHref,
  preAccountApplicationHref,
} from "./admin-pre-account-routes";

describe("admin-pre-account-routes", () => {
  it("aceita o id externo e o numérico", () => {
    expect(parsePreAccountApplicationId("pre:9")).toBe(9);
    expect(parsePreAccountApplicationId("9")).toBe(9);
    expect(parsePreAccountApplicationId(9)).toBe(9);
  });

  it("recusa id fora do formato", () => {
    expect(parsePreAccountApplicationId("pre:")).toBe(0);
    expect(parsePreAccountApplicationId("owner:9")).toBe(0);
    expect(parsePreAccountApplicationId("9abc")).toBe(0);
    expect(parsePreAccountApplicationId(undefined)).toBe(0);
  });

  it("monta a página da candidatura guardando a listagem de origem", () => {
    expect(preAccountApplicationHref("pre:9")).toBe("/admin/contas/candidatura/9");
    expect(preAccountApplicationHref("pre:9", "tab=analises")).toBe(
      "/admin/contas/candidatura/9?from=tab%3Danalises",
    );
  });

  it("volta sempre para a listagem de contas", () => {
    expect(preAccountApplicationBackHref(undefined)).toBe("/admin/contas");
    expect(preAccountApplicationBackHref("tab=analises")).toBe("/admin/contas?tab=analises");
    expect(preAccountApplicationBackHref("//evil.example")).toBe("/admin/contas?%2F%2Fevil.example=");
  });
});
