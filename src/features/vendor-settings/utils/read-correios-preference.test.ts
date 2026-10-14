import { describe, expect, it } from "vitest";

import { readCorreiosPreference } from "./read-correios-preference";

describe("readCorreiosPreference", () => {
  it("lê o estado efetivo dos Correios devolvido pelo WordPress", () => {
    expect(readCorreiosPreference({ correios_enabled: false, correios_locked: false })).toEqual({
      enabled: false,
      locked: false,
    });
  });

  it.each([
    ["corpo nulo", null],
    ["campos ausentes", {}],
    ["valor textual", { correios_enabled: "false", correios_locked: false }],
    ["trava ausente", { correios_enabled: true }],
  ])("não inventa estado com %s", (_label, payload) => {
    expect(readCorreiosPreference(payload)).toBeNull();
  });
});
