import {
  VENDOR_PENDING_FIELD_LABELS,
  type VendorPendingFieldKey,
} from "@/features/revendedor/constants/pending-registration";

import type { GatewayStatus, PaymentProvider, VendorPaymentSummary } from "../types/payment-gateways";
import { gatewayErrorMessage, gatewayReasonLabel, gatewayStateLabel } from "./payment-gateway-messages";

/** Ordem de exibição dos gateways: Mercado Pago primeiro, por ser o default da coorte nova. */
export const PROVIDER_ORDER: readonly PaymentProvider[] = ["mercadopago", "pagarme"];

/** Nome comercial de cada gateway, como o vendor o reconhece. */
export const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  mercadopago: "Mercado Pago",
  pagarme: "Pagar.me",
};

/**
 * Peso visual de um card de gateway. `ready` só sai de `canReceive`; `unknown` é falta de leitura
 * e nunca é desenhado como aprovado nem como recusado.
 */
export type GatewayTone = "blocked" | "pending" | "ready" | "unknown";

const BLOCKED_STATES = new Set(["blocked_cnae", "unavailable"]);
const UNKNOWN_FIELD_LABEL = "Dado cadastral pendente";
const MISSING_STATUS_REASON = "Estado deste gateway não foi informado pela Papelito.";
const MISSING_STATUS_LABEL = "Sem leitura";

const timestampFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

/** Classifica o card pelo veredito do backend; nunca promove a apto por conta própria. */
export function gatewayTone(status: GatewayStatus | null): GatewayTone {
  if (!status) return "unknown";
  if (status.canReceive) return "ready";
  if (BLOCKED_STATES.has(status.state)) return "blocked";

  return "pending";
}

/** Aplica a máscara `0000-0/00` a um CNAE de sete dígitos; outro formato volta como veio. */
export function formatCnaeCode(code: string): string {
  if (!/^\d{7}$/.test(code)) return code;

  return `${code.slice(0, 4)}-${code.slice(4, 5)}/${code.slice(5)}`;
}

/**
 * Data/hora curta no fuso de São Paulo. Aceita ISO com fuso ou o `Y-m-d H:i:s` em UTC do
 * WordPress; vazio ou ilegível devolve string vazia para o chamador mostrar "nunca".
 */
export function formatGatewayTimestamp(value: string): string {
  if (!value) return "";

  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? "" : timestampFormatter.format(date);
}

/** Rótulo humano de uma pendência de cadastro; chave desconhecida nunca aparece crua. */
export function pendingFieldLabel(key: string): string {
  return VENDOR_PENDING_FIELD_LABELS[key as VendorPendingFieldKey] ?? UNKNOWN_FIELD_LABEL;
}

/** Status de um gateway no resumo, ou `null` quando o backend não o devolveu. */
export function findGateway(summary: VendorPaymentSummary, provider: PaymentProvider): GatewayStatus | null {
  return summary.gateways.find((item) => item.provider === provider) ?? null;
}

/** Motivo principal de um gateway não receber, já traduzido. */
export function gatewayBlockReason(status: GatewayStatus | null): string {
  if (!status) return MISSING_STATUS_REASON;
  if (status.state === "blocked_cnae") return gatewayStateLabel("blocked_cnae");

  const [firstReason] = status.reasonCodes;

  return firstReason ? gatewayReasonLabel(firstReason) : gatewayStateLabel(status.state);
}

/** Tom de uma linha do quadro de gateways; `attention` também tinge a linha inteira. */
export type PaymentRouteTone = "attention" | "neutral" | "positive";

/** Uma linha do quadro de gateways: escolha exclusiva, estado e papel no checkout. */
export type PaymentRoute = {
  provider: PaymentProvider;
  label: string;
  /** Gateway escolhido (ou padrão da coorte) segundo o servidor; o rádio só segue esta flag. */
  selected: boolean;
  /** Só gateway com `canReceive`, fora do modo suspenso, pode ser escolhido. */
  selectable: boolean;
  status: GatewayStatus | null;
  statusLabel: string;
  statusTone: PaymentRouteTone;
  /** Por que não recebe agora; `null` quando recebe. */
  hint: string | null;
  role: string;
  roleTone: PaymentRouteTone;
};

const ROUTE_ROLE_RECEIVING = "Recebe os pedidos";
const ROUTE_ROLE_BROKEN = "Escolhido, mas não recebe";
const ROUTE_ROLE_OFF = "Fora do checkout";

function routeTone(selected: boolean, canReceive: boolean): PaymentRouteTone {
  if (canReceive) return "positive";

  return selected ? "attention" : "neutral";
}

function routeRole(selected: boolean, canReceive: boolean): { role: string; roleTone: PaymentRouteTone } {
  if (!selected) return { role: ROUTE_ROLE_OFF, roleTone: "neutral" };

  return canReceive
    ? { role: ROUTE_ROLE_RECEIVING, roleTone: "positive" }
    : { role: ROUTE_ROLE_BROKEN, roleTone: "attention" };
}

function buildRoute(summary: VendorPaymentSummary, provider: PaymentProvider): PaymentRoute {
  const status = findGateway(summary, provider);
  const canReceive = status?.canReceive === true;
  const selected = summary.preference.preferredProvider === provider;

  return {
    provider,
    label: PROVIDER_LABELS[provider],
    selected,
    selectable: canReceive && summary.mode !== "suspended",
    status,
    statusLabel: status ? gatewayStateLabel(status.state) : MISSING_STATUS_LABEL,
    statusTone: routeTone(selected, canReceive),
    hint: canReceive ? null : gatewayBlockReason(status),
    ...routeRole(selected, canReceive),
  };
}

/**
 * Linhas do quadro de gateways, na ordem de exibição. A escolha é exclusiva: só o gateway
 * escolhido recebe, e o outro nunca entra como alternativa automática. Nada aqui decide a
 * escolha — ela vem de `summary.preference`, já resolvida pelo WordPress.
 */
export function paymentRoutes(summary: VendorPaymentSummary): PaymentRoute[] {
  return PROVIDER_ORDER.map((provider) => buildRoute(summary, provider));
}

/** Pendências que dependem da Papelito, não da loja: só resta aguardar a conferência. */
const PAPELITO_REVIEW_REASONS = new Set(["identity_verification_pending", "cnae_verification_pending"]);

/**
 * Texto do alerta de loja fora do checkout, ou `null` quando o gateway escolhido recebe. Diz quem
 * precisa agir: conferência da Papelito não pede nada à loja, e "escolha o outro gateway" só
 * aparece quando o outro está apto de fato.
 */
export function outOfCheckoutMessage(routes: PaymentRoute[]): string | null {
  const selected = routes.find((route) => route.selected);
  if (selected?.statusTone !== "attention") return null;

  const reason = selected.hint ?? "";
  const waitsForPapelito = selected.status?.reasonCodes.some((code) => PAPELITO_REVIEW_REASONS.has(code)) ?? false;

  if (waitsForPapelito) {
    return `${selected.label} ainda não pode receber. ${reason} Assim que a Papelito concluir a conferência, a loja volta a vender sozinha.`;
  }

  const otherAvailable = routes.some((route) => !route.selected && route.selectable);
  const action = otherAvailable ? "Resolva a pendência ou escolha o outro gateway." : "Resolva a pendência para voltar a vender.";

  return `${selected.label} é o gateway escolhido, mas não pode receber agora. ${reason} ${action}`;
}

/** Diz se o gateway escolhido recebe agora — base do sinal "apta a vender" no cabeçalho. */
export function selectedGatewayReady(summary: VendorPaymentSummary | null): boolean {
  if (!summary) return false;

  return findGateway(summary, summary.preference.preferredProvider)?.canReceive === true;
}

/** Leitura mínima do recebedor Pagar.me legado usada no sinal do cabeçalho. */
export type LegacyRecipientSignal = { loadFailed: boolean; status: string };

/**
 * Sinal do cabeçalho de Configurações. No modo de gateways vale "o gateway escolhido recebe" (e
 * suspenso bloqueia); no legado, ou sem resumo legível, segue o recebedor Pagar.me de sempre.
 */
export function vendorPaymentSignal(summary: VendorPaymentSummary | null, recipient: LegacyRecipientSignal): string {
  if (summary && summary.mode !== "legacy") {
    return summary.mode !== "suspended" && selectedGatewayReady(summary) ? "apta a vender" : "venda bloqueada";
  }

  if (recipient.loadFailed) return "estado não lido";

  return recipient.status === "active" ? "apta a vender" : "venda bloqueada";
}

/** Conta Mercado Pago ativa vinculada; conta desconectada, revogada ou substituída não conta. */
export function isMercadoPagoConnected(summary: VendorPaymentSummary): boolean {
  return summary.mercadopagoAccount?.status === "active";
}

const IDENTITY_LABELS: Record<string, string> = {
  mismatch: "Conta de outro titular",
  verified: "Titularidade conferida",
};

/** Rótulo da conferência de titularidade da conta Mercado Pago; qualquer outro valor é pendente. */
export function identityStatusLabel(status: string): string {
  return IDENTITY_LABELS[status] ?? "Aguardando conferência";
}

/** Aviso exibido no retorno do OAuth do Mercado Pago. */
export type OauthReturnBanner = {
  tone: "error" | "info" | "success";
  title: string;
  message: string;
};

/**
 * Traduz `?mercadopago=` e `?reason=` do retorno do OAuth. Conexão concluída não é aprovação:
 * a conta ainda passa pela conferência de titularidade antes de receber.
 */
export function oauthReturnBanner(outcome: string | undefined, reason?: string): OauthReturnBanner | null {
  switch (outcome) {
    case "connected":
      return {
        tone: "success",
        title: "Conta Mercado Pago conectada",
        message: "A Papelito ainda confere se a conta pertence ao CNPJ da loja. Acompanhe o estado no card abaixo.",
      };
    case "denied":
      return {
        tone: "info",
        title: "Conexão cancelada",
        message: "Você não autorizou a Papelito no Mercado Pago. Nada foi alterado; conecte quando quiser.",
      };
    case "session_required":
      return {
        tone: "error",
        title: "Sessão expirada",
        message: "A conexão começou em outra sessão ou expirou. Entre de novo e clique em Conectar Mercado Pago.",
      };
    case "error":
      return { tone: "error", title: "Não foi possível conectar", message: gatewayErrorMessage(reason ?? "") };
    default:
      return null;
  }
}
