import type {
  VendorStockFilter,
  VendorStockSort,
  VendorStockType,
} from "@/features/vendor-stock/types/vendor-stock";

/**
 * Rótulos dos recortes de estoque, em um lugar só.
 *
 * O drawer, as fichas de filtro ativo e o resumo precisam dizer a mesma coisa sobre o mesmo
 * recorte; três listas separadas divergiriam na primeira renomeação.
 */
export const STOCK_FILTER_LABELS: Record<VendorStockFilter, string> = {
  all: "Todos",
  incomplete: "Dados incompletos",
  low_stock: "Estoque baixo",
  unconfigured: "Não configurado",
  with_stock: "Em estoque",
  zeroed_only: "Sem estoque",
};

export const STOCK_SORT_LABELS: Record<VendorStockSort, string> = {
  name_asc: "Nome (A-Z)",
  name_desc: "Nome (Z-A)",
  qty_asc: "Menor estoque",
  qty_desc: "Maior estoque",
  updated_desc: "Ajuste mais recente",
};

export const STOCK_TYPE_LABELS: Record<VendorStockType, string> = {
  kits: "Kits",
  products: "Produtos",
};
