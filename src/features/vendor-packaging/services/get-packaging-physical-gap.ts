import "server-only";

import { getVendorStock } from "@/features/vendor-stock/services/get-vendor-stock";

/** Produtos do vendor sem peso ou dimensão — os que nenhuma caixa resolve. */
export type PackagingPhysicalDataGap = {
  /** A consulta bateu no teto e o número real pode ser maior. */
  capped: boolean;
  count: number;
};

const PAGE_SIZE = 100;

/**
 * Conta os produtos do vendor que o cálculo de embalagem não consegue sequer considerar.
 *
 * O recorte `incomplete` do estoque traz todo tipo de pendência de cadastro — imagem, preço,
 * categoria —, e só peso e dimensão impedem o frete. Por isso a contagem é filtrada aqui em vez
 * de reaproveitar o `incomplete` do resumo, que responderia um número maior do que a verdade.
 *
 * @returns Contagem, marcada como `capped` quando o total passa da página consultada.
 */
export async function getPackagingPhysicalGap(): Promise<PackagingPhysicalDataGap> {
  const snapshot = await getVendorStock({
    category: null,
    collection: null,
    filter: "incomplete",
    page: 1,
    perPage: PAGE_SIZE,
    search: "",
    sort: "name_asc",
    tags: [],
    type: "products",
  });

  const count = snapshot.items.filter(
    (item) => item.missingFields.includes("weight") || item.missingFields.includes("dimensions"),
  ).length;

  return { capped: snapshot.total > snapshot.items.length, count };
}
