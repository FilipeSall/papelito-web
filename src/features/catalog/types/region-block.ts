export type RegionBlockKind = "missing_cep" | "no_vendor" | "no_product_coverage";

export interface RegionBlock {
  kind: RegionBlockKind;
  message: string;
}

export const REGION_BLOCK_MESSAGES: Record<RegionBlockKind, string> = {
  missing_cep: "Cadastre um CEP para verificar os vendors da sua região.",
  no_vendor: "Nenhum vendor atende sua região no momento.",
  no_product_coverage: "Nenhum vendor atende sua região com este produto.",
};

export function createRegionBlock(kind: RegionBlockKind): RegionBlock {
  return { kind, message: REGION_BLOCK_MESSAGES[kind] };
}
