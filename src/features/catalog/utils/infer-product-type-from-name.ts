import type { ProductTypeId } from "../types/products-catalog";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Infere o tipo de produto com base no nome original do item.
 */
export function inferProductTypeFromName(name: string): Exclude<ProductTypeId, "todos"> {
  const normalized = normalizeText(name);

  if (normalized.includes("seda")) {
    return "sedas";
  }
  if (normalized.includes("piteira")) {
    return "piteiras";
  }
  if (normalized.includes("filtro")) {
    return "filtros";
  }

  return "acessorios";
}
