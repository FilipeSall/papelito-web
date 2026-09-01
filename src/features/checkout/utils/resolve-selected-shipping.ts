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

  const option = quote.options.find((item) => item.code === selectedOption.code);

  return option && option.price === selectedOption.price ? option : null;
}
