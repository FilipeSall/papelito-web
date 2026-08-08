import { formatBRL } from "@/lib/format-currency";

export const FREE_SHIPPING_MINIMUM_TOKEN = "{minimo_frete_gratis}";

function toValidMinimumOrderCents(minimumOrderCents: number | null | undefined) {
  return typeof minimumOrderCents === "number" &&
    Number.isSafeInteger(minimumOrderCents) &&
    minimumOrderCents > 0
    ? minimumOrderCents
    : null;
}

export function formatFreeShippingCouponCopy(minimumOrderCents: number | null | undefined) {
  const validMinimumOrderCents = toValidMinimumOrderCents(minimumOrderCents);

  if (validMinimumOrderCents === null) {
    return "Com cupom";
  }

  return `A partir de ${formatBRL(validMinimumOrderCents / 100)} com cupom`;
}

/**
 * Resolve o token do mínimo em textos editáveis pelo administrador.
 * Devolve `null` quando o texto promete o mínimo e o valor configurado não está disponível,
 * deixando a política de degradação para cada superfície.
 */
export function resolveFreeShippingPlaceholder(
  text: string,
  minimumOrderCents: number | null | undefined,
): string | null {
  if (!text.includes(FREE_SHIPPING_MINIMUM_TOKEN)) {
    return text;
  }

  const validMinimumOrderCents = toValidMinimumOrderCents(minimumOrderCents);

  if (validMinimumOrderCents === null) {
    return null;
  }

  return text.replaceAll(
    FREE_SHIPPING_MINIMUM_TOKEN,
    formatBRL(validMinimumOrderCents / 100),
  );
}
