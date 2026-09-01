import type {
  CheckoutAddressForm,
  PaymentForm,
  PaymentMethod,
  ShippingQuoteOption,
} from "../types/checkout";

export type CheckoutStepNumber = 1 | 2 | 3;

export type CheckoutStepAccess = Record<CheckoutStepNumber, boolean>;

export const CHECKOUT_STEP_ROUTES: Record<CheckoutStepNumber, string> = {
  1: "/checkout",
  2: "/checkout/pagamento",
  3: "/checkout/revisao",
};

/** O carrinho vem de storage não confiável, então `vendorId` pode faltar mesmo o tipo exigindo. */
type VendorScopedItem = { vendorId?: number | null };

export function resolveCartVendorId(items: VendorScopedItem[]) {
  const vendorIds = items
    .map((item) => item.vendorId)
    .filter((vendorId): vendorId is number => typeof vendorId === "number" && vendorId > 0);
  const uniqueVendorIds = new Set(vendorIds);

  return vendorIds.length === items.length && uniqueVendorIds.size === 1
    ? vendorIds[0]
    : null;
}

export function isAddressFormComplete(form: CheckoutAddressForm) {
  return (
    form.zipCode.replace(/\D/g, "").length === 8 &&
    Boolean(form.street.trim()) &&
    Boolean(form.number.trim()) &&
    Boolean(form.neighborhood.trim()) &&
    Boolean(form.city.trim()) &&
    Boolean(form.state.trim())
  );
}

type CheckoutStepAccessInput = {
  items: VendorScopedItem[];
  addressForm: CheckoutAddressForm;
  selectedShippingOption: ShippingQuoteOption | null;
  paymentMethod: PaymentMethod;
  paymentForm: PaymentForm;
};

/**
 * Deriva quais etapas o comprador já pode acessar a partir do que está preenchido.
 * Voltar é sempre permitido; avançar só quando a etapa anterior tem dado suficiente
 * para a seguinte não montar um total incompleto.
 */
export function getCheckoutStepAccess({
  items,
  addressForm,
  selectedShippingOption,
  paymentMethod,
  paymentForm,
}: CheckoutStepAccessInput): CheckoutStepAccess {
  const requiresShippingChoice = items.length > 0 && resolveCartVendorId(items) !== null;
  const addressReady =
    isAddressFormComplete(addressForm) &&
    (!requiresShippingChoice || Boolean(selectedShippingOption));
  const paymentReady =
    paymentMethod === "credit_card" ? Boolean(paymentForm.cardTokenId) : true;

  return {
    1: true,
    2: addressReady,
    3: addressReady && paymentReady,
  };
}
