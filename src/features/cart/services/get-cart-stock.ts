export interface CartStockItemInput {
  productId: number;
  vendorId: number;
}

export interface CartStockEntry {
  available: boolean;
  stockQty: number;
}

export type CartStockResult =
  | {
      status: "ok";
      products: Record<string, CartStockEntry>;
    }
  | {
      status: "unavailable";
      message: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseResult(value: unknown): CartStockResult | null {
  if (!isRecord(value)) return null;

  if (value.status === "unavailable" && typeof value.message === "string") {
    return { status: "unavailable", message: value.message };
  }

  if (value.status !== "ok" || !isRecord(value.products)) return null;

  const products: Record<string, CartStockEntry> = {};

  for (const [productId, entry] of Object.entries(value.products)) {
    if (!isRecord(entry)) return null;

    const stockQty = typeof entry.stockQty === "number" ? entry.stockQty : Number.NaN;
    if (!Number.isFinite(stockQty) || stockQty < 0) return null;

    products[productId] = {
      available: entry.available === true && stockQty > 0,
      stockQty: Math.floor(stockQty),
    };
  }

  return { status: "ok", products };
}

export async function getCartStock(
  items: CartStockItemInput[],
): Promise<CartStockResult> {
  try {
    const response = await fetch("/api/cart/stock", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });
    const result = parseResult(await response.json().catch(() => null));

    if (!response.ok || !result) {
      return {
        status: "unavailable",
        message: "Nao foi possivel validar o estoque agora. Tente novamente.",
      };
    }

    return result;
  } catch {
    return {
      status: "unavailable",
      message: "Nao foi possivel validar o estoque agora. Tente novamente.",
    };
  }
}
