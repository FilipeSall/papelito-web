import type { CheckoutShippingQuoteState, ShippingQuoteOption } from "../types/checkout";

/**
 * Diz se a opção ainda está dentro da validade que a transportadora carimbou.
 * Cotação sem `expiresAt` não vence no cliente; validade ilegível é tratada como
 * vencida, porque uma data que ninguém sabe ler não prova nada.
 */
function isWithinQuoteValidity(option: ShippingQuoteOption, now: Date): boolean {
  if (option.expiresAt == null) {
    return true;
  }

  const expiresAt = Date.parse(option.expiresAt);

  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}

/**
 * Modalidade de entrega que pode entrar no total. Uma seleção só vale quando a
 * cotação que a originou é a do CEP atual, a opção ainda existe nela e a validade
 * não passou — o `selectedOption` sobrevive no localStorage e pode ter vindo de
 * outro endereço, de outro carrinho ou de uma cotação que já foi substituída.
 */
export function resolveSelectedShipping(
  shippingQuote: CheckoutShippingQuoteState,
  addressZipCode: string,
  now: Date = new Date(),
): ShippingQuoteOption | null {
  const { quote, selectedOption } = shippingQuote;
  const destinationCep = addressZipCode.replace(/\D/g, "");

  if (!quote || !selectedOption || destinationCep.length !== 8) {
    return null;
  }

  if (quote.destinationCep !== destinationCep) {
    return null;
  }

  const selectedOptionKey = selectedOption.optionKey ?? `correios:${selectedOption.code}`;
  const option = quote.options.find(
    (item) => (item.optionKey ?? `correios:${item.code}`) === selectedOptionKey,
  );

  return option &&
    option.price === selectedOption.price &&
    typeof option.fingerprint === "string" &&
    option.fingerprint === selectedOption.fingerprint &&
    Number.isInteger(option.customerPriceCents) &&
    option.customerPriceCents === selectedOption.customerPriceCents &&
    option.deliveryTime === selectedOption.deliveryTime &&
    option.expiresAt === selectedOption.expiresAt &&
    isWithinQuoteValidity(option, now)
    ? option
    : null;
}
