import { isAllowedMercadoPagoUrl } from "./mercado-pago-redirect";

/**
 * Leva o navegador ao Checkout Pro. Revalida o allowlist do Mercado Pago no último ponto antes
 * de sair do site e devolve `false` sem navegar quando a URL não passa.
 */
export function redirectToCheckoutPro(url: string): boolean {
  if (!isAllowedMercadoPagoUrl(url)) return false;

  window.location.assign(url);
  return true;
}
