import { useCartStore } from "@/features/cart";
import { useCheckoutStore } from "@/features/checkout/store/use-checkout-store";
import { useNotificationsStore } from "@/features/notifications/store/use-notifications-store";
import { useRevendedorRegistrationDraftStore } from "@/features/revendedor/store/use-revendedor-registration-draft-store";
import { createEmptyVendorRegistrationDraft } from "@/features/revendedor/utils/revendedor-registration";

export function resetAllStores() {
  useCartStore.setState({ items: [], coupon: null });
  useCartStore.persist.clearStorage();

  useCheckoutStore.setState({
    addressForm: {
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
    paymentMethod: "credit_card",
    paymentForm: {
      holderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      installments: "",
    },
    shippingQuote: {
      quote: null,
      selectedOption: null,
    },
  });
  useCheckoutStore.persist.clearStorage();

  useNotificationsStore.setState({
    unreadCount: 0,
    items: [],
  });

  useRevendedorRegistrationDraftStore.setState({
    draft: createEmptyVendorRegistrationDraft(),
    hasHydrated: false,
  });
  useRevendedorRegistrationDraftStore.persist.clearStorage();
}
