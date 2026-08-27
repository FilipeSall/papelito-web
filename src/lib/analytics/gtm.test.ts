import { describe, expect, it } from "vitest";

import { resolveGtmContainerId } from "./gtm";

describe("resolveGtmContainerId", () => {
  it("aceita um container válido e normaliza espaços e caixa", () => {
    expect(resolveGtmContainerId("  gtm-tp7nrsbt ")).toBe("GTM-TP7NRSBT");
  });

  it("não carrega o GTM quando a variável não está definida", () => {
    expect(resolveGtmContainerId(undefined)).toBeUndefined();
    expect(resolveGtmContainerId("")).toBeUndefined();
    expect(resolveGtmContainerId("   ")).toBeUndefined();
  });

  it("recusa valor fora do formato de container", () => {
    expect(resolveGtmContainerId("G-M82VLH1QVR")).toBeUndefined();
    expect(resolveGtmContainerId("TP7NRSBT")).toBeUndefined();
    expect(resolveGtmContainerId("GTM-")).toBeUndefined();
  });
});
