import { describe, expect, it } from "vitest";

import { expoEventDays, expoEventPhase } from "./event-phase";

describe("expoEventPhase", () => {
  it("segue a janela de 20 a 22/11 no horário de Brasília", () => {
    expect(expoEventPhase(new Date("2026-11-19T23:59:59-03:00"))).toBe("upcoming");
    expect(expoEventPhase(new Date("2026-11-20T00:00:00-03:00"))).toBe("open");
    expect(expoEventPhase(new Date("2026-11-22T23:59:59-03:00"))).toBe("open");
  });

  it("some assim que o evento termina", () => {
    expect(expoEventPhase(new Date("2026-11-23T00:00:00-03:00"))).toBe("hidden");
  });
});

describe("expoEventDays", () => {
  it("formata início e fim em dd/mm", () => {
    expect(expoEventDays()).toEqual({ start: "20/11", end: "22/11" });
  });
});
