import type { CartItem, CartVendor } from "../types/cart";

export type ResolveCartVendorStatus =
  | "ok"
  | "missing_cep"
  | "unavailable"
  | "vendor_conflict";

export type ResolveCartVendorResult =
  | {
      status: "ok";
      vendor: CartVendor;
    }
  | {
      status: Exclude<ResolveCartVendorStatus, "ok">;
      message: string;
      href?: string;
    };

type ResolveCartVendorInput = {
  product: {
    id: string;
    quantity: number;
  };
  currentItems: CartItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mapVendor(value: unknown): CartVendor | null {
  if (!isRecord(value)) {
    return null;
  }

  const vendorId =
    typeof value.vendorId === "number" ? value.vendorId : Number(value.vendorId);
  const vendorName =
    typeof value.vendorName === "string" ? value.vendorName.trim() : "";

  if (!Number.isInteger(vendorId) || vendorId <= 0 || !vendorName) {
    return null;
  }

  return {
    vendorId,
    vendorName,
    city: typeof value.city === "string" ? value.city : undefined,
    state: typeof value.state === "string" ? value.state : undefined,
    distanceKm:
      typeof value.distanceKm === "number" && Number.isFinite(value.distanceKm)
        ? value.distanceKm
        : undefined,
    leadTimeDays:
      typeof value.leadTimeDays === "number" && Number.isFinite(value.leadTimeDays)
        ? value.leadTimeDays
        : undefined,
  };
}

function mapResult(payload: unknown): ResolveCartVendorResult {
  if (!isRecord(payload)) {
    return {
      status: "unavailable",
      message: "Não foi possível validar a disponibilidade por CEP agora.",
    };
  }

  if (payload.status === "ok") {
    const vendor = mapVendor(payload.vendor);

    if (vendor) {
      return { status: "ok", vendor };
    }
  }

  if (
    payload.status === "missing_cep" ||
    payload.status === "unavailable" ||
    payload.status === "vendor_conflict"
  ) {
    return {
      status: payload.status,
      message:
        typeof payload.message === "string"
          ? payload.message
          : "Não foi possível validar a disponibilidade por CEP agora.",
      href: typeof payload.href === "string" ? payload.href : undefined,
    };
  }

  return {
    status: "unavailable",
    message: "Não foi possível validar a disponibilidade por CEP agora.",
  };
}

export async function resolveCartVendor(
  input: ResolveCartVendorInput,
): Promise<ResolveCartVendorResult> {
  const response = await fetch("/api/cart/resolve-vendor", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product: input.product,
      currentItems: input.currentItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        vendorId: item.vendorId,
      })),
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  const result = mapResult(payload);

  if (response.status === 401) {
    return {
      status: "unavailable",
      message: "Entre na sua conta para adicionar produtos ao carrinho.",
    };
  }

  return result;
}
