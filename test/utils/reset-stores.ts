import { useCartStore } from "@/features/cart";
import { useCheckoutStore } from "@/features/checkout/store/use-checkout-store";
import { useNotificationsStore } from "@/features/notifications/store/use-notifications-store";

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
      installments: "",
      cardTokenId: "",
      cardLast4: "",
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
}
