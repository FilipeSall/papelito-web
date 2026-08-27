import { describe, expect, it } from "vitest";

import {
  CUSTOM_COVERAGE_PRESET_ID,
  EMPTY_COVERAGE_PRESET_ID,
  buildCoverageBlocksFromRanges,
  findCoveragePresetByRanges,
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
});
