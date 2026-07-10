import type { ShippingQuoteOption, ShippingQuoteResult } from "../types/checkout";

type ShippingQuoteApiOption = {
  service?: unknown;
  code?: unknown;
  name?: unknown;
  price?: unknown;
  delivery_time?: unknown;
};

type ShippingQuoteApiResponse = {
  code?: unknown;
  message?: unknown;
  data?: unknown;
  origin_cep?: unknown;
  destination_cep?: unknown;
  vendor_id?: unknown;
  options?: unknown;
};

type ShippingQuoteApiErrorData = {
  correios_status?: unknown;
  correios_message?: unknown;
};

export type GetShippingQuoteInput = {
  vendorId: number;
  destinationCep: string;
  items: Array<{ productId: number; qty: number }>;
};

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value);
}

function mapOption(option: ShippingQuoteApiOption): ShippingQuoteOption | null {
  const price = toNumber(option.price);

  if (
    typeof option.service !== "string" ||
    typeof option.code !== "string" ||
    typeof option.name !== "string" ||
    !Number.isFinite(price)
  ) {
    return null;
  }

  const deliveryTime = toNumber(option.delivery_time);

  return {
    service: option.service,
    code: option.code,
    name: option.name,
    price,
    deliveryTime: Number.isFinite(deliveryTime) ? deliveryTime : null,
  };
}

function mapResponse(payload: ShippingQuoteApiResponse): ShippingQuoteResult {
  const options = Array.isArray(payload.options)
    ? payload.options
        .map((option) => mapOption(option as ShippingQuoteApiOption))
        .filter((option): option is ShippingQuoteOption => Boolean(option))
    : [];
  const vendorId = toNumber(payload.vendor_id);

  if (
    typeof payload.origin_cep !== "string" ||
    typeof payload.destination_cep !== "string" ||
    !Number.isFinite(vendorId) ||
    options.length === 0
  ) {
    throw new Error("Resposta de frete invalida.");
  }

  return {
    originCep: payload.origin_cep,
    destinationCep: payload.destination_cep,
    vendorId,
    options,
  };
}

function getApiErrorMessage(payload: ShippingQuoteApiResponse | null) {
  if (!payload || typeof payload.message !== "string") {
    return "Nao foi possivel cotar o frete.";
  }

  if (payload.code === "papelito_shipping_product_dimensions_missing") {
    return "Um produto do carrinho ainda nao tem peso e dimensoes cadastrados para cotar frete. Remova o item ou escolha outro produto.";
  }

  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as ShippingQuoteApiErrorData)
      : null;
  const correiosStatus =
    data && typeof data.correios_status === "number"
      ? data.correios_status
      : typeof data?.correios_status === "string"
        ? Number(data.correios_status)
        : null;
  const correiosMessage =
    data && typeof data.correios_message === "string"
      ? data.correios_message.trim()
      : "";

  if (correiosMessage) {
    return Number.isFinite(correiosStatus)
      ? `${payload.message} (${correiosStatus}: ${correiosMessage})`
      : `${payload.message} (${correiosMessage})`;
  }

  return payload.message;
}

export async function getShippingQuote(
  input: GetShippingQuoteInput,
): Promise<ShippingQuoteResult> {
  const response = await fetch("/api/checkout/shipping-quote", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vendor_id: input.vendorId,
      destination_cep: input.destinationCep,
      items: input.items.map((item) => ({
        product_id: item.productId,
        qty: item.qty,
      })),
    }),
  });

  const payload = (await response.json().catch(() => null)) as ShippingQuoteApiResponse | null;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload));
  }

  if (!payload) {
    throw new Error("Nao foi possivel cotar o frete.");
  }

  return mapResponse(payload);
}
