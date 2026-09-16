import type {
  ShippingProvider,
  ShippingQuoteOption,
  ShippingQuoteResult,
} from "../types/checkout";

type ShippingQuoteApiOption = {
  provider?: unknown;
  option_key?: unknown;
  service?: unknown;
  service_code?: unknown;
  code?: unknown;
  name?: unknown;
  price?: unknown;
  delivery_time?: unknown;
  fingerprint?: unknown;
  carrier_cost_cents?: unknown;
  customer_price_cents?: unknown;
  quoted_at?: unknown;
  expires_at?: unknown;
  external_quote_id?: unknown;
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

/** Carrinho e destino informados ao WordPress, que recalcula preço e elegibilidade. */
export type GetShippingQuoteInput = {
  vendorId: number;
  destinationCep: string;
  items: Array<{ productId: number; qty: number }>;
  couponCode?: string | null;
};

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function nonNegativeInteger(value: unknown): number | null {
  const numberValue = finiteNumber(value);
  return numberValue !== null && Number.isInteger(numberValue) && numberValue >= 0
    ? numberValue
    : null;
}

function nonNegativeNumber(value: unknown): number | null {
  const numberValue = finiteNumber(value);
  return numberValue !== null && numberValue >= 0 ? numberValue : null;
}

function canonicalServiceCode(option: ShippingQuoteApiOption): string | null {
  const code = option.service_code ?? option.code;
  if (typeof code !== "string" || !/^[a-z0-9_-]+$/.test(code)) {
    return null;
  }
  if (
    (option.service_code !== undefined && option.service_code !== code) ||
    (option.code !== undefined && option.code !== code)
  ) {
    return null;
  }
  return code;
}

function mapOption(option: ShippingQuoteApiOption): ShippingQuoteOption | null {
  let provider: ShippingProvider | null = null;
  if (option.provider === "correios" || option.provider === "braspress") {
    provider = option.provider;
  } else if (option.provider === undefined) {
    provider = "correios";
  }
  const serviceCode = canonicalServiceCode(option);
  const service = stringValue(option.service);
  const name = stringValue(option.name);
  const customerPriceCents = nonNegativeInteger(option.customer_price_cents);
  const decimalPrice = nonNegativeNumber(option.price);
  const price = customerPriceCents === null ? decimalPrice : customerPriceCents / 100;
  const expectedOptionKey = provider && serviceCode ? `${provider}:${serviceCode}` : null;
  const optionKey = stringValue(option.option_key);
  const isLegacyCorreios = option.provider === undefined;

  if (
    provider === null ||
    serviceCode === null ||
    expectedOptionKey === null ||
    service === null ||
    name === null ||
    price === null ||
    (option.customer_price_cents !== undefined && customerPriceCents === null) ||
    (option.carrier_cost_cents !== undefined && nonNegativeInteger(option.carrier_cost_cents) === null) ||
    (option.price !== undefined && decimalPrice === null) ||
    (!isLegacyCorreios && optionKey === null) ||
    (option.option_key !== undefined && option.option_key !== expectedOptionKey) ||
    (customerPriceCents !== null &&
      decimalPrice !== null &&
      Math.round(decimalPrice * 100) !== customerPriceCents)
  ) {
    return null;
  }

  const deliveryTime = nonNegativeInteger(option.delivery_time);
  if (option.delivery_time != null && deliveryTime === null) {
    return null;
  }

  return {
    provider,
    optionKey: expectedOptionKey,
    serviceCode,
    carrierCostCents: nonNegativeInteger(option.carrier_cost_cents) ?? undefined,
    fingerprint: stringValue(option.fingerprint) ?? undefined,
    customerPriceCents: customerPriceCents ?? undefined,
    quotedAt: stringValue(option.quoted_at),
    expiresAt: stringValue(option.expires_at),
    externalQuoteId: stringValue(option.external_quote_id),
    service,
    code: serviceCode,
    name,
    price,
    deliveryTime,
  };
}

function mapResponse(payload: ShippingQuoteApiResponse): ShippingQuoteResult {
  const options = Array.isArray(payload.options)
    ? payload.options
        .map((option) => mapOption(option as ShippingQuoteApiOption))
        .filter((option): option is ShippingQuoteOption => Boolean(option))
    : [];
  const vendorId = finiteNumber(payload.vendor_id);

  if (
    typeof payload.origin_cep !== "string" ||
    typeof payload.destination_cep !== "string" ||
    vendorId === null ||
    options.length === 0
  ) {
    throw new Error("Resposta de frete inválida.");
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
    return "Não foi possível cotar o frete.";
  }

  if (payload.code === "papelito_shipping_product_dimensions_missing") {
    return "Um produto do carrinho ainda não tem peso e dimensões cadastrados para cotar frete. Remova o item ou escolha outro produto.";
  }
  if (payload.code === "papelito_shipping_kit_package_not_supported") {
    return "Compre uma unidade do Kit por vez, sem produtos adicionais no carrinho, para cotar a embalagem corretamente.";
  }
  if (payload.code === "papelito_kit_package_dimensions_missing") {
    return "Este Kit ainda não tem as dimensões da embalagem final cadastradas.";
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

/** Obtém a cotação autoritativa e descarta opções que violam o contrato público de frete. */
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
      coupon_code: input.couponCode || undefined,
    }),
  });

  const payload = (await response.json().catch(() => null)) as ShippingQuoteApiResponse | null;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload));
  }

  if (!payload) {
    throw new Error("Não foi possível cotar o frete.");
  }

  return mapResponse(payload);
}
