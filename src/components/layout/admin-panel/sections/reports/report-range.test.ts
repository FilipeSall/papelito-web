import { describe, expect, it } from "vitest";

import { formatReportRange, presetOf, presetRange, rangeError, todayInSaoPaulo } from "./report-range";

const RANGE_TEST_TODAY = "2026-10-25";

describe("períodos da exportação", () => {
  it("usa o dia de São Paulo mesmo quando em UTC já virou o dia", () => {
    expect(todayInSaoPaulo(new Date("2026-10-26T01:30:00Z"))).toBe(RANGE_TEST_TODAY);
  });

  it("calcula os atalhos terminando hoje", () => {
    expect(presetRange("7d", RANGE_TEST_TODAY)).toEqual({ from: "2026-10-19", to: RANGE_TEST_TODAY });
    expect(presetRange("30d", RANGE_TEST_TODAY)).toEqual({ from: "2026-09-26", to: RANGE_TEST_TODAY });
    expect(presetRange("month", RANGE_TEST_TODAY)).toEqual({ from: "2026-10-01", to: RANGE_TEST_TODAY });
  });

  it("mês anterior respeita o último dia do mês, inclusive na virada do ano", () => {
    expect(presetRange("previous-month", RANGE_TEST_TODAY)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(presetRange("previous-month", "2027-01-10")).toEqual({ from: "2026-12-01", to: "2026-12-31" });
    expect(presetRange("previous-month", "2028-03-05")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });

  it("reconhece o atalho de um intervalo e cai em personalizado quando nenhum gera", () => {
    expect(presetOf({ from: "2026-10-01", to: RANGE_TEST_TODAY }, RANGE_TEST_TODAY)).toBe("month");
    expect(presetOf({ from: "2026-10-02", to: RANGE_TEST_TODAY }, RANGE_TEST_TODAY)).toBe("custom");
  });

  it("recusa intervalo invertido, incompleto ou no futuro", () => {
    expect(rangeError({ from: "2026-10-10", to: "2026-10-01" }, RANGE_TEST_TODAY)).toBe("A data inicial vem depois da final.");
    expect(rangeError({ from: "", to: RANGE_TEST_TODAY }, RANGE_TEST_TODAY)).toBe("Informe as duas datas.");
    expect(rangeError({ from: "2026-10-01", to: "2026-10-30" }, RANGE_TEST_TODAY)).toBe("A data final não pode passar de hoje.");
    expect(rangeError({ from: "2026-10-01", to: RANGE_TEST_TODAY }, RANGE_TEST_TODAY)).toBeNull();
  });

  it("formata por extenso", () => {
    expect(formatReportRange({ from: "2026-09-26", to: RANGE_TEST_TODAY })).toBe("26/09/2026 a 25/10/2026");
  });
});
