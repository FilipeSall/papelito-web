import type { ProfileOrderPaymentInfo } from "../types/profile-order-detail";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const deadlineFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

/**
 * Prazo de pagamento do pedido. PIX tem prioridade sobre boleto quando ambos
 * existirem (cada pedido usa um unico metodo, mas mantemos a precedencia explicita).
 */
export function getPaymentExpiresAt(payment: ProfileOrderPaymentInfo): string | undefined {
  return payment.pix?.expiresAt ?? payment.boleto?.expiresAt;
}

function parseExpiry(expiresAt: string | undefined): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Indica se o prazo de pagamento ja passou. Prazo ausente/invalido nunca conta
 * como expirado (o backend ainda pode confirmar um pagamento em transito).
 */
export function isPaymentExpired(expiresAt: string | undefined, nowMs: number): boolean {
  const expiryMs = parseExpiry(expiresAt);
  return expiryMs !== null && expiryMs <= nowMs;
}

export type PaymentDeadline = {
  label: string;
  absoluteLabel: string;
  remainingLabel: string;
  expired: boolean;
  hasDeadline: boolean;
};

function remainingLabel(diffMs: number): string {
  if (diffMs >= DAY_MS) {
    const days = Math.ceil(diffMs / DAY_MS);
    return days === 1 ? "falta 1 dia" : `faltam ${days} dias`;
  }

  if (diffMs >= HOUR_MS) {
    const hours = Math.ceil(diffMs / HOUR_MS);
    return hours === 1 ? "falta 1 hora" : `faltam ${hours} horas`;
  }

  const minutes = Math.max(1, Math.ceil(diffMs / MINUTE_MS));
  return minutes === 1 ? "falta 1 min" : `faltam ${minutes} min`;
}

/**
 * Monta o rotulo de prazo de pagamento para exibicao. `nowMs` e injetado para
 * manter a funcao pura e testavel.
 */
export function formatPaymentDeadline(expiresAt: string | undefined, nowMs: number): PaymentDeadline {
  const expiryMs = parseExpiry(expiresAt);

  if (expiryMs === null) {
    return { label: "", absoluteLabel: "", remainingLabel: "", expired: false, hasDeadline: false };
  }

  if (expiryMs <= nowMs) {
    return {
      label: "Pagamento expirado",
      absoluteLabel: deadlineFormatter.format(new Date(expiryMs)),
      remainingLabel: "",
      expired: true,
      hasDeadline: true,
    };
  }

  const formatted = deadlineFormatter.format(new Date(expiryMs));
  const remaining = remainingLabel(expiryMs - nowMs);

  return {
    label: `Pague até ${formatted} (${remaining})`,
    absoluteLabel: formatted,
    remainingLabel: remaining,
    expired: false,
    hasDeadline: true,
  };
}
