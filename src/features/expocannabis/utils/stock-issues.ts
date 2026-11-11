/** Produto sem estoque suficiente, como o WordPress devolve em `papelito_event_out_of_stock`. */
export type StockIssue = { productId: number; available: number };

/**
 * Produtos do erro `papelito_event_out_of_stock`, descartando o que não tem a forma esperada.
 *
 * Vale para o erro da cotação (tela 03) e da criação do pedido (tela 04), que trazem o mesmo `data`.
 */
export function parseStockIssues(data: Record<string, unknown> | undefined): StockIssue[] {
  const products = Array.isArray(data?.products) ? data.products : [];
  return products.filter(
    (item): item is StockIssue =>
      typeof item === "object" && item !== null && typeof item.productId === "number" && typeof item.available === "number",
  );
}
