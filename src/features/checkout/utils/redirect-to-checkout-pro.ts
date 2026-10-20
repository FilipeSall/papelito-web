import { isAllowedMercadoPagoUrl } from "./mercado-pago-redirect";

/** Aba reservada no clique para receber o Checkout Pro depois que o pedido for criado. */
export type CheckoutProTab = {
  navigate: (url: string) => void;
  close: () => void;
};

/** Onde o Checkout Pro abriu: na aba reservada, na aba atual (pop-up bloqueado) ou em lugar nenhum. */
export type CheckoutProRedirect = "tab" | "same_tab" | "blocked";

/**
 * Abre uma aba vazia no próprio clique, antes de qualquer `await`, para o navegador não tratá-la
 * como pop-up. O vínculo com a página da Papelito é cortado (`opener = null`). Devolve `null`
 * quando o navegador bloqueia mesmo assim; quem chama cai para a aba atual.
 */
export function reserveCheckoutProTab(): CheckoutProTab | null {
  const tab = window.open("", "_blank");

  if (!tab) return null;

  tab.opener = null;

  return {
    navigate: (url) => {
      tab.location.href = url;
    },
    close: () => tab.close(),
  };
}

/**
 * Leva o comprador ao Checkout Pro. Revalida o allowlist do Mercado Pago no último ponto antes de
 * sair do site: URL fora dele fecha a aba reservada e não navega. Com aba reservada, só ela vai ao
 * Mercado Pago; sem aba, a página atual navega.
 */
export function redirectToCheckoutPro(url: string, tab: CheckoutProTab | null = null): CheckoutProRedirect {
  if (!isAllowedMercadoPagoUrl(url)) {
    tab?.close();
    return "blocked";
  }

  if (tab) {
    tab.navigate(url);
    return "tab";
  }

  window.location.assign(url);
  return "same_tab";
}
