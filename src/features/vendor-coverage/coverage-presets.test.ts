import { describe, expect, it } from "vitest";

import {
  COVERAGE_PRESET_OPTIONS,
  CUSTOM_COVERAGE_PRESET_ID,
  EMPTY_COVERAGE_PRESET_ID,
  REGION_COVERAGE_PRESET_OPTIONS,
  buildCoverageBlocksFromRanges,
  findCoveragePresetByRanges,
  isRegionCoveragePresetId,
  validateCoverageRanges,
} from "./coverage-presets";

describe("coverage-presets", () => {
  it("recognizes preset ranges with multiple internal faixas", () => {
    const preset = findCoveragePresetByRanges([
      { minCep: "70000-000", maxCep: "72799-999" },
      { minCep: "73000-000", maxCep: "73699-999" },
    ]);

    expect(preset?.id).toBe("DF");
  });

  it("groups saved ranges back into a preset block", () => {
    const blocks = buildCoverageBlocksFromRanges([
      { minCep: "70000-000", maxCep: "72799-999" },
      { minCep: "73000-000", maxCep: "73699-999" },
      { minCep: "01000-000", maxCep: "19999-999" },
    ]);

    expect(blocks).toMatchObject([
      { presetId: "DF" },
      { presetId: "SP" },
    ]);
  });

  it("keeps unknown ranges as custom blocks", () => {
    const blocks = buildCoverageBlocksFromRanges([{ minCep: "71500-000", maxCep: "71599-999" }]);

    expect(blocks).toMatchObject([{ presetId: CUSTOM_COVERAGE_PRESET_ID }]);
  });

  it("keeps an empty selection separate from a custom range", () => {
    expect(buildCoverageBlocksFromRanges([])).toEqual([
      { presetId: EMPTY_COVERAGE_PRESET_ID, ranges: [] },
    ]);
  });

  it("validates invalid custom ranges", () => {
    expect(
      validateCoverageRanges([{ minCep: "73000-000", maxCep: "70000-000" }]),
    ).toBe("O CEP final precisa ser maior ou igual ao inicial na faixa 1.");
  });

  it("expõe as regiões sem a opção de faixa personalizada", () => {
    expect(REGION_COVERAGE_PRESET_OPTIONS).toHaveLength(COVERAGE_PRESET_OPTIONS.length - 1);
    expect(REGION_COVERAGE_PRESET_OPTIONS.some((option) => option.value === CUSTOM_COVERAGE_PRESET_ID)).toBe(
      false,
    );
    expect(REGION_COVERAGE_PRESET_OPTIONS.map((option) => option.value)).toContain("SP");
  });

  it("distingue região de faixa personalizada e de id desconhecido", () => {
    expect(isRegionCoveragePresetId("DF")).toBe(true);
    expect(isRegionCoveragePresetId(CUSTOM_COVERAGE_PRESET_ID)).toBe(false);
    expect(isRegionCoveragePresetId(EMPTY_COVERAGE_PRESET_ID)).toBe(false);
  });
});
