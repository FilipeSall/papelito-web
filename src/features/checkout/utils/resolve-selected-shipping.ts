import type { CheckoutShippingQuoteState, ShippingQuoteOption } from "../types/checkout";

/**
 * Modalidade de entrega que pode entrar no total. Uma seleção só vale quando a
 * cotação que a originou é a do CEP atual e a opção ainda existe nela — o
 * `selectedOption` sobrevive no localStorage e pode ter vindo de outro endereço,
 * de outro carrinho ou de uma cotação que já foi substituída.
 */
export function resolveSelectedShipping(
  shippingQuote: CheckoutShippingQuoteState,
  addressZipCode: string,
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
    option.expiresAt === selectedOption.expiresAt
    ? option
    : null;
}
