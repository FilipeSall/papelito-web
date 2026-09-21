import {
  Ban,
  CircleAlert,
  CircleCheck,
  FileCheck2,
  FileClock,
  Hourglass,
  PackageCheck,
  PackageSearch,
  RotateCcw,
  Truck,
  Wallet,
} from "lucide-react";

import type { StatusShape } from "@/components/layout/operational-panel";
import type { ShippingProvider } from "@/features/checkout/types/checkout";
import { resolveShippingProvider } from "@/features/shipping/utils/resolve-shipping-provider";
import { shippingProviderWithArticle } from "@/features/shipping/utils/shipping-provider-label";
import type {
  ShipmentGenerationStatus,
  ShipmentLogisticsStatus,
  VendorOrderStatus,
} from "@/features/vendor-orders/types/vendor-orders";

/**
 * Vocabulário de situação do pedido.
 *
 * Cada situação é ícone **mais** texto, pela mesma razão do estoque: a tela é
 * conferida em pressa, às vezes impressa, e a cor sozinha some nesses casos.
 */
const ORDER_STATUS: Record<VendorOrderStatus, StatusShape> = {
  aguardando_pagamento: { icon: Wallet, label: "Aguardando pagamento", tone: "neutral" },
  aguardando_estoque: { icon: CircleAlert, label: "Análise de estoque", tone: "critical" },
  aguardando_envio: { icon: Hourglass, label: "Aguardando envio", tone: "pending" },
  em_separacao: { icon: PackageSearch, label: "Em separação", tone: "pending" },
  enviado: { icon: Truck, label: "Enviado", tone: "neutral" },
  entregue: { icon: PackageCheck, label: "Entregue", tone: "positive" },
  cancelado: { icon: Ban, label: "Cancelado", tone: "critical" },
  cancelamento_solicitado: { icon: RotateCcw, label: "Estorno em andamento", tone: "critical" },
  estornado: { icon: RotateCcw, label: "Estornado", tone: "neutral" },
};

export function vendorOrderStatusShape(status: VendorOrderStatus): StatusShape {
  return ORDER_STATUS[status];
}

export const VENDOR_ORDER_STATUS_ORDER: VendorOrderStatus[] = [
  "aguardando_pagamento",
  "aguardando_envio",
  "em_separacao",
  "enviado",
  "entregue",
  "aguardando_estoque",
  "cancelamento_solicitado",
  "cancelado",
  "estornado",
];

/**
 * O que o vendor precisa fazer agora, em uma frase.
 *
 * As situações que não dependem dele — pagamento, trânsito, entrega, análise de
 * estoque — dizem de quem é a vez, em vez de sumirem: "nada aqui" e "não é com
 * você" são leituras diferentes numa fila de trabalho.
 */
const NEXT_ACTION: Record<Exclude<VendorOrderStatus, "enviado">, string> = {
  aguardando_pagamento: "Aguardando o comprador pagar",
  aguardando_estoque: "A Papelito vai orientar a próxima etapa",
  aguardando_envio: "Separar o pedido",
  em_separacao: "Postar e informar o rastreio",
  entregue: "Entrega concluída",
  cancelado: "Pedido encerrado",
  cancelamento_solicitado: "Acompanhar o estorno ao comprador",
  estornado: "Pedido encerrado com estorno",
};

/**
 * Frase da próxima ação, já sabendo quem entrega o pedido.
 *
 * `enviado` é a única situação em que a frase depende da transportadora: o
 * vendor está esperando **uma** delas, e dizer "os Correios" num pedido
 * Braspress manda acompanhar quem não vai encostar no pacote. Pedido sem
 * provider é lido como Correios.
 */
export function vendorOrderNextAction(status: VendorOrderStatus, provider?: string): string {
  if (status === "enviado") {
    return `Acompanhando ${shippingProviderWithArticle(resolveShippingProvider(provider))}`;
  }

  return NEXT_ACTION[status];
}

/**
 * Rótulo do botão que executa a transição, no imperativo curto.
 *
 * Só existe para os destinos que a API aceita — `enviado` e `entregue` são
 * projetados pelo rastreamento da transportadora e nunca viram botão.
 */
const TRANSITION_LABEL: Partial<Record<VendorOrderStatus, string>> = {
  em_separacao: "Marcar como separado",
  cancelado: "Cancelar pedido",
};

export function vendorOrderTransitionLabel(status: VendorOrderStatus): string {
  return TRANSITION_LABEL[status] ?? vendorOrderStatusShape(status).label;
}

export function isVendorOrderTransitionOffered(status: VendorOrderStatus): boolean {
  return status in TRANSITION_LABEL;
}

/** Marcador positivo da lista: só existe quando a nota foi anexada. */
export const FISCAL_ATTACHED_SHAPE: StatusShape = {
  icon: FileCheck2,
  label: "Nota fiscal",
  tone: "neutral",
};

/** Estado vazio da seção de documentos, no detalhe do pedido. */
export const FISCAL_PENDING_SHAPE: StatusShape = {
  icon: FileClock,
  label: "Sem nota fiscal",
  tone: "pending",
};

/**
 * Trilha da nota, em frase de linha do tempo.
 *
 * O pedido guarda **uma** nota e o arquivo anterior é apagado quando outro
 * entra no lugar. A trilha é cumulativa e sobrevive à remoção — é ela que
 * responde "por que a nota que eu vi ontem sumiu?".
 */
const FISCAL_EVENT_LABEL: Record<string, string> = {
  anexada: "Nota anexada ao pedido",
  removida: "Nota removida",
  substituida: "Nota substituída por outra",
};

export function fiscalEventLabel(event: string): string {
  return FISCAL_EVENT_LABEL[event] ?? event.replace(/_/g, " ");
}

const FISCAL_ACTOR_LABEL: Record<string, string> = {
  admin: "Suporte Papelito",
  sistema: "Sistema",
  vendor: "Você",
};

/** Quem executou. Vazio quando o evento não registrou papel — não inventa autor. */
export function fiscalActorLabel(actorRole: string): string {
  return FISCAL_ACTOR_LABEL[actorRole] ?? "";
}

const BLOCK_REASON: Record<"aguardando_pagamento" | "cancelado", string> = {
  aguardando_pagamento: "A nota fiscal pode ser anexada depois que o pagamento for confirmado.",
  cancelado: "Pedido cancelado não recebe nota fiscal.",
};

export function fiscalBlockMessage(reason: "" | "aguardando_pagamento" | "cancelado"): string {
  return reason === "" ? "" : BLOCK_REASON[reason];
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  boleto: "Boleto",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  pix: "Pix",
};

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABEL[method] ?? (method ? method.replace(/_/g, " ") : "Não informado");
}

const PAYMENT_STATE: Record<string, StatusShape> = {
  canceled: { icon: Ban, label: "Cancelado", tone: "critical" },
  captured: { icon: CircleCheck, label: "Pago", tone: "positive" },
  failed: { icon: CircleAlert, label: "Falhou", tone: "critical" },
  paid: { icon: CircleCheck, label: "Pago", tone: "positive" },
  pending: { icon: Hourglass, label: "Pendente", tone: "pending" },
  processing: { icon: Hourglass, label: "Processando", tone: "pending" },
  refunded: { icon: CircleAlert, label: "Reembolsado", tone: "critical" },
};

export function paymentStateShape(state: string): StatusShape {
  return PAYMENT_STATE[state] ?? { icon: Hourglass, label: "Situação indisponível", tone: "neutral" };
}

/**
 * Estado do envio em vocabulário que serve às duas transportadoras.
 *
 * "Objeto" é palavra dos Correios e some daqui; o que é fato só de uma delas —
 * pré-postagem, etiqueta — vive no mapa por transportadora, abaixo.
 */
const LOGISTICS_LABEL: Record<ShipmentLogisticsStatus, string> = {
  cancelled: "Envio cancelado",
  delivered: "Entrega confirmada pela transportadora",
  delivery_failed: "Tentativa de entrega sem sucesso",
  expired: "Envio expirado",
  in_transit: "Encomenda em trânsito",
  lost: "Ocorrência logística; acompanhamento necessário",
  out_for_delivery: "Encomenda saiu para entrega",
  pickup_available: "Encomenda disponível para retirada",
  posted: "Encomenda postada",
  preposted: "Envio registrado; aguardando postagem",
  returned: "Encomenda devolvida ao remetente",
  returning: "Encomenda em devolução",
  tracking_pending: "Aguardando eventos da transportadora",
};

/**
 * O que cada transportadora sobrescreve do vocabulário comum.
 *
 * Correios mantém pré-postagem e etiqueta porque elas existem lá; a Braspress
 * não emite nenhuma das duas e ficaria prometendo um passo inexistente. Onde a
 * frase só muda de nome, a transportadora é nomeada — "pelos Correios" e "pela
 * Braspress" exigem preposições diferentes e por isso são frases inteiras, não
 * interpolação.
 */
const LOGISTICS_LABEL_BY_PROVIDER: Record<
  ShippingProvider,
  Partial<Record<ShipmentLogisticsStatus, string>>
> = {
  braspress: {
    delivered: "Entrega confirmada pela Braspress",
    tracking_pending: "Aguardando eventos da Braspress",
  },
  correios: {
    cancelled: "Pré-postagem cancelada",
    delivered: "Entrega confirmada pelos Correios",
    expired: "Pré-postagem expirada",
    preposted: "Etiqueta gerada; aguardando postagem",
    tracking_pending: "Aguardando eventos dos Correios",
  },
};

/** Só a Papelito gera etiqueta, e só nos Correios: sem isso não há o que aguardar. */
const NO_SHIPMENT_HEADLINE = "Sem postagem registrada";

const AWAITING_LABEL_HEADLINE = "Aguardando geração da etiqueta";

/**
 * Estado do envio dito na transportadora do pedido.
 *
 * Remessa sem `provider` — ou registrada à mão, pelo S10 — é lida como
 * Correios: era a única transportadora quando aquele registro nasceu.
 */
export function logisticsStatusLabel(
  status: ShipmentLogisticsStatus | "not_started",
  provider?: string,
): string {
  const resolved = resolveShippingProvider(provider);

  if (status === "not_started") {
    return resolved === "braspress" ? NO_SHIPMENT_HEADLINE : AWAITING_LABEL_HEADLINE;
  }

  return LOGISTICS_LABEL_BY_PROVIDER[resolved][status] ?? LOGISTICS_LABEL[status];
}

const GENERATION_LABEL: Record<ShipmentGenerationStatus, string> = {
  failed: "Não foi possível gerar a etiqueta",
  generated: "Etiqueta gerada",
  generating: "Geração da etiqueta em andamento",
  not_started: AWAITING_LABEL_HEADLINE,
  uncertain: "Geração com resultado incerto; revisão do suporte necessária",
};

export function generationStatusLabel(status: ShipmentGenerationStatus): string {
  return GENERATION_LABEL[status];
}

/**
 * Frase única da logística: enquanto a etiqueta não existe, o que importa é a
 * geração; depois dela, o que importa é o evento da transportadora.
 *
 * Sem geração automática de pré-postagem não há etiqueta a esperar — a frase
 * "aguardando geração da etiqueta" faria o vendor aguardar um passo que o
 * sistema não vai executar, quando quem posta é ele. Pedido Braspress cai
 * sempre nesse caso: a Papelito não emite nada pela Braspress, e a flag de
 * geração automática é global dos Correios.
 */
export function logisticsHeadline(
  generationStatus: ShipmentGenerationStatus,
  status: ShipmentLogisticsStatus | "not_started",
  automaticGenerationEnabled = true,
  provider?: string,
): string {
  const resolved = resolveShippingProvider(provider);

  if (generationStatus === "generated") {
    return logisticsStatusLabel(status, resolved);
  }

  const generatesLabel = automaticGenerationEnabled && resolved === "correios";

  if (generationStatus === "not_started" && !generatesLabel) {
    return NO_SHIPMENT_HEADLINE;
  }

  return generationStatusLabel(generationStatus);
}
