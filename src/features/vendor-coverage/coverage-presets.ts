import { formatCep, isValidCep, normalizeCep } from "@/features/revendedor/utils/revendedor-formatters";

export type CoverageRangeValue = {
  maxCep: string;
  minCep: string;
};

export type CoveragePreset = {
  id: string;
  isCustom?: boolean;
  label: string;
  ranges: CoverageRangeValue[];
  uf: string | null;
};

export type CoverageBlock = {
  presetId: string;
  ranges: CoverageRangeValue[];
};

export const CUSTOM_COVERAGE_PRESET_ID = "custom";

export const COVERAGE_TOOLTIP_TEXT =
  "Selecione uma regiao para preencher automaticamente o CEP minimo e maximo da cobertura. Caso precise atender uma area especifica, escolha a opcao de faixa personalizada.";

export const BRAZIL_COVERAGE_PRESETS: readonly CoveragePreset[] = [
  { id: "AC", label: "Acre", uf: "AC", ranges: [{ minCep: "69900-000", maxCep: "69999-999" }] },
  { id: "AL", label: "Alagoas", uf: "AL", ranges: [{ minCep: "57000-000", maxCep: "57999-999" }] },
  {
    id: "AM",
    label: "Amazonas",
    uf: "AM",
    ranges: [
      { minCep: "69000-000", maxCep: "69299-999" },
      { minCep: "69400-000", maxCep: "69899-999" },
    ],
  },
  { id: "AP", label: "Amapa", uf: "AP", ranges: [{ minCep: "68900-000", maxCep: "68999-999" }] },
  { id: "BA", label: "Bahia", uf: "BA", ranges: [{ minCep: "40000-000", maxCep: "48999-999" }] },
  { id: "CE", label: "Ceara", uf: "CE", ranges: [{ minCep: "60000-000", maxCep: "63999-999" }] },
  {
    id: "DF",
    label: "Distrito Federal / Brasilia",
    uf: "DF",
    ranges: [
      { minCep: "70000-000", maxCep: "72799-999" },
      { minCep: "73000-000", maxCep: "73699-999" },
    ],
  },
  { id: "ES", label: "Espirito Santo", uf: "ES", ranges: [{ minCep: "29000-000", maxCep: "29999-999" }] },
  {
    id: "GO",
    label: "Goias",
    uf: "GO",
    ranges: [
      { minCep: "72800-000", maxCep: "72999-999" },
      { minCep: "73700-000", maxCep: "76799-999" },
    ],
  },
  { id: "MA", label: "Maranhao", uf: "MA", ranges: [{ minCep: "65000-000", maxCep: "65999-999" }] },
  { id: "MG", label: "Minas Gerais", uf: "MG", ranges: [{ minCep: "30000-000", maxCep: "39999-999" }] },
  { id: "MS", label: "Mato Grosso do Sul", uf: "MS", ranges: [{ minCep: "79000-000", maxCep: "79999-999" }] },
  { id: "MT", label: "Mato Grosso", uf: "MT", ranges: [{ minCep: "78000-000", maxCep: "78899-999" }] },
  { id: "PA", label: "Para", uf: "PA", ranges: [{ minCep: "66000-000", maxCep: "68899-999" }] },
  { id: "PB", label: "Paraiba", uf: "PB", ranges: [{ minCep: "58000-000", maxCep: "58999-999" }] },
  { id: "PE", label: "Pernambuco", uf: "PE", ranges: [{ minCep: "50000-000", maxCep: "56999-999" }] },
  { id: "PI", label: "Piaui", uf: "PI", ranges: [{ minCep: "64000-000", maxCep: "64999-999" }] },
  { id: "PR", label: "Parana", uf: "PR", ranges: [{ minCep: "80000-000", maxCep: "87999-999" }] },
  { id: "RJ", label: "Rio de Janeiro", uf: "RJ", ranges: [{ minCep: "20000-000", maxCep: "28999-999" }] },
  { id: "RN", label: "Rio Grande do Norte", uf: "RN", ranges: [{ minCep: "59000-000", maxCep: "59999-999" }] },
  { id: "RO", label: "Rondonia", uf: "RO", ranges: [{ minCep: "76800-000", maxCep: "76999-999" }] },
  { id: "RR", label: "Roraima", uf: "RR", ranges: [{ minCep: "69300-000", maxCep: "69399-999" }] },
  { id: "RS", label: "Rio Grande do Sul", uf: "RS", ranges: [{ minCep: "90000-000", maxCep: "99999-999" }] },
  { id: "SC", label: "Santa Catarina", uf: "SC", ranges: [{ minCep: "88000-000", maxCep: "89999-999" }] },
  { id: "SE", label: "Sergipe", uf: "SE", ranges: [{ minCep: "49000-000", maxCep: "49999-999" }] },
  { id: "SP", label: "Sao Paulo", uf: "SP", ranges: [{ minCep: "01000-000", maxCep: "19999-999" }] },
  { id: "TO", label: "Tocantins", uf: "TO", ranges: [{ minCep: "77000-000", maxCep: "77999-999" }] },
  { id: CUSTOM_COVERAGE_PRESET_ID, label: "Faixa personalizada", uf: null, ranges: [], isCustom: true },
] as const;

export const COVERAGE_PRESET_OPTIONS = BRAZIL_COVERAGE_PRESETS.map((preset) => ({
  label: preset.label,
  value: preset.id,
}));

const PRESETS_BY_ID = new Map(BRAZIL_COVERAGE_PRESETS.map((preset) => [preset.id, preset]));
const NON_CUSTOM_PRESETS = BRAZIL_COVERAGE_PRESETS.filter((preset) => preset.isCustom !== true);
const MATCHABLE_PRESETS = [...NON_CUSTOM_PRESETS].sort((left, right) => right.ranges.length - left.ranges.length);

export function createEmptyCoverageRange(): CoverageRangeValue {
  return { minCep: "", maxCep: "" };
}

export function getCoveragePresetById(presetId: string): CoveragePreset | null {
  return PRESETS_BY_ID.get(presetId) ?? null;
}

export function normalizeCoverageRange(range?: Partial<CoverageRangeValue> | null): CoverageRangeValue {
  return {
    minCep: formatCep(String(range?.minCep ?? "")),
    maxCep: formatCep(String(range?.maxCep ?? "")),
  };
}

export function normalizeCoverageRanges(ranges?: Array<Partial<CoverageRangeValue> | null> | null) {
  return Array.isArray(ranges) ? ranges.map(normalizeCoverageRange) : [];
}

export function flattenCoverageBlocks(blocks: CoverageBlock[]) {
  return blocks.flatMap((block) => block.ranges.map(normalizeCoverageRange));
}

export function buildCoverageBlocksFromRanges(
  ranges: Array<Partial<CoverageRangeValue> | null> | null | undefined,
  mode: "multi" | "single" = "multi",
): CoverageBlock[] {
  const normalizedRanges = normalizeCoverageRanges(ranges);
  const nonEmptyRanges = normalizedRanges.filter((range) => range.minCep || range.maxCep);

  if (nonEmptyRanges.length === 0) {
    return [{ presetId: CUSTOM_COVERAGE_PRESET_ID, ranges: [createEmptyCoverageRange()] }];
  }

  if (mode === "single") {
    const preset = findCoveragePresetByRanges(nonEmptyRanges);
    if (preset) {
      return [{ presetId: preset.id, ranges: preset.ranges.map(normalizeCoverageRange) }];
    }

    return [{ presetId: CUSTOM_COVERAGE_PRESET_ID, ranges: [nonEmptyRanges[0]] }];
  }

  const blocks: CoverageBlock[] = [];
  let currentIndex = 0;

  while (currentIndex < normalizedRanges.length) {
    const currentRange = normalizedRanges[currentIndex];

    if (!currentRange.minCep && !currentRange.maxCep) {
      blocks.push({
        presetId: CUSTOM_COVERAGE_PRESET_ID,
        ranges: [createEmptyCoverageRange()],
      });
      currentIndex += 1;
      continue;
    }

    const matchedPreset = MATCHABLE_PRESETS.find((preset) =>
      matchesPresetSequence(normalizedRanges, currentIndex, preset.ranges),
    );

    if (matchedPreset) {
      blocks.push({
        presetId: matchedPreset.id,
        ranges: matchedPreset.ranges.map(normalizeCoverageRange),
      });
      currentIndex += matchedPreset.ranges.length;
      continue;
    }

    blocks.push({
      presetId: CUSTOM_COVERAGE_PRESET_ID,
      ranges: [currentRange],
    });
    currentIndex += 1;
  }

  return blocks;
}

export function findCoveragePresetByRanges(
  ranges: Array<Partial<CoverageRangeValue> | null> | null | undefined,
): CoveragePreset | null {
  const normalizedRanges = normalizeCoverageRanges(ranges);

  return (
    MATCHABLE_PRESETS.find((preset) => {
      if (preset.ranges.length !== normalizedRanges.length) {
        return false;
      }

      return matchesPresetSequence(normalizedRanges, 0, preset.ranges);
    }) ?? null
  );
}

export function validateCoverageRanges(
  ranges: Array<Partial<CoverageRangeValue> | null> | null | undefined,
  {
    requireAtLeastOne = true,
  }: {
    requireAtLeastOne?: boolean;
  } = {},
) {
  const normalizedRanges = normalizeCoverageRanges(ranges).filter(
    (range) => range.minCep || range.maxCep,
  );

  if (requireAtLeastOne && normalizedRanges.length === 0) {
    return "Informe ao menos uma faixa de CEP.";
  }

  for (const [index, range] of normalizedRanges.entries()) {
    if (!isValidCep(range.minCep) || !isValidCep(range.maxCep)) {
      return `Informe CEP inicial e final validos na faixa ${index + 1}.`;
    }

    if (Number(normalizeCep(range.minCep)) > Number(normalizeCep(range.maxCep))) {
      return `O CEP final precisa ser maior ou igual ao inicial na faixa ${index + 1}.`;
    }
  }

  return null;
}

export function getLegacyCoverageRange(
  ranges: Array<Partial<CoverageRangeValue> | null> | null | undefined,
): CoverageRangeValue {
  const normalizedRanges = normalizeCoverageRanges(ranges);

  return normalizedRanges[0] ?? createEmptyCoverageRange();
}

export function formatCoverageRangesSummary(
  ranges: Array<Partial<CoverageRangeValue> | null> | null | undefined,
) {
  const normalizedRanges = normalizeCoverageRanges(ranges).filter(
    (range) => range.minCep || range.maxCep,
  );

  if (normalizedRanges.length === 0) {
    return "-";
  }

  return normalizedRanges
    .map((range) => `${range.minCep || "-"} a ${range.maxCep || "-"}`)
    .join(" | ");
}

function matchesPresetSequence(
  sourceRanges: CoverageRangeValue[],
  startIndex: number,
  presetRanges: CoverageRangeValue[],
) {
  if (sourceRanges.length < startIndex + presetRanges.length) {
    return false;
  }

  return presetRanges.every((presetRange, rangeIndex) => {
    const sourceRange = sourceRanges[startIndex + rangeIndex];

    return (
      normalizeCep(sourceRange.minCep) === normalizeCep(presetRange.minCep) &&
      normalizeCep(sourceRange.maxCep) === normalizeCep(presetRange.maxCep)
    );
  });
}
