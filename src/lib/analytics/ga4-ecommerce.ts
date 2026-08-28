export type Ga4Item = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity: number;
};

export type Ga4EcommerceEventName =
  | "view_item"
  | "add_to_cart"
  | "begin_checkout";

export const GA4_CURRENCY = "BRL";

export type Ga4ItemInput = {
  id: string | number;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
};

/**
 * Arredonda um valor monetário para as duas casas que o GA4 espera.
 *
 * Valor não finito vira `0` em vez de vazar `NaN` para o relatório: métrica ausente é visivelmente
 * errada, métrica `NaN` é descartada em silêncio pela coleta.
 */
export function toAmount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

/**
 * Converte o inteiro em centavos que o checkout trafega para o decimal em reais do GA4.
 *
 * O contrato de pricing e os totais do pedido são inteiros (`totalCents`, `itemsCents`). Enviar
 * esse inteiro direto multiplicaria o faturamento do relatório por cem.
 */
export function centsToAmount(cents: number): number {
  if (!Number.isFinite(cents)) {
    return 0;
  }

  return Math.round(cents) / 100;
}

export function toGa4Item(input: Ga4ItemInput): Ga4Item {
  const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
  const category = input.category?.trim();

  return {
    item_id: String(input.id),
    item_name: input.name,
    ...(category ? { item_category: category } : {}),
    price: toAmount(input.price),
    quantity,
  };
}

export function sumItemsValue(items: readonly Ga4Item[]): number {
  return toAmount(
    items.reduce((total, item) => total + item.price * item.quantity, 0),
  );
}
