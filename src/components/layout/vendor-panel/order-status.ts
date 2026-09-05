import {
  Ban,
  CircleAlert,
  CircleCheck,
  FileCheck2,
  FileClock,
  Hourglass,
  PackageCheck,
  PackageSearch,
  Truck,
  Wallet,
} from "lucide-react";

import type { StatusShape } from "@/components/layout/operational-panel";
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
  "cancelado",
];

/**
 * O que o vendor precisa fazer agora, em uma frase.
 *
 * As situações que não dependem dele — pagamento, trânsito, entrega, análise de
 * estoque — dizem de quem é a vez, em vez de sumirem: "nada aqui" e "não é com
 * você" são leituras diferentes numa fila de trabalho.
 */
const NEXT_ACTION: Record<VendorOrderStatus, string> = {
  aguardando_pagamento: "Aguardando o comprador pagar",
  aguardando_estoque: "A Papelito vai orientar a próxima etapa",
  aguardando_envio: "Separar o pedido",
  em_separacao: "Postar e informar o rastreio",
  enviado: "Acompanhando os Correios",
  entregue: "Entrega concluída",
  cancelado: "Pedido encerrado",
};

export function vendorOrderNextAction(status: VendorOrderStatus): string {
  return NEXT_ACTION[status];
}

/**
 * Rótulo do botão que executa a transição, no imperativo curto.
 *
 * Só existe para os destinos que a API aceita — `enviado` e `entregue` são
 * projetados pelo rastreamento dos Correios e nunca viram botão.
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

const LOGISTICS_LABEL: Record<ShipmentLogisticsStatus, string> = {
  cancelled: "Pré-postagem cancelada",
  delivered: "Entrega confirmada pelos Correios",
  delivery_failed: "Tentativa de entrega sem sucesso",
  expired: "Pré-postagem expirada",
  in_transit: "Objeto em trânsito",
  lost: "Ocorrência logística; acompanhamento necessário",
  out_for_delivery: "Objeto saiu para entrega",
  pickup_available: "Objeto disponível para retirada",
  posted: "Objeto postado",
  preposted: "Etiqueta gerada; aguardando postagem",
  returned: "Objeto devolvido ao remetente",
  returning: "Objeto em devolução",
  tracking_pending: "Aguardando eventos dos Correios",
};

export function logisticsStatusLabel(status: ShipmentLogisticsStatus | "not_started"): string {
  return status === "not_started" ? "Aguardando geração da etiqueta" : LOGISTICS_LABEL[status];
}

const GENERATION_LABEL: Record<ShipmentGenerationStatus, string> = {
  failed: "Não foi possível gerar a etiqueta",
  generated: "Etiqueta gerada",
  generating: "Geração da etiqueta em andamento",
  not_started: "Aguardando geração da etiqueta",
  uncertain: "Geração com resultado incerto; revisão do suporte necessária",
};

export function generationStatusLabel(status: ShipmentGenerationStatus): string {
  return GENERATION_LABEL[status];
}

/**
 * Frase única da logística: enquanto a etiqueta não existe, o que importa é a
 * geração; depois dela, o que importa é o evento dos Correios.
 *
 * Sem geração automática de pré-postagem não há etiqueta a esperar — a frase
 * "aguardando geração da etiqueta" faria o vendor aguardar um passo que o
 * sistema não vai executar, quando quem posta é ele.
 */
export function logisticsHeadline(
  generationStatus: ShipmentGenerationStatus,
  status: ShipmentLogisticsStatus | "not_started",
  automaticGenerationEnabled = true,
): string {
  if (generationStatus === "generated") {
    return logisticsStatusLabel(status);
  }

  if (generationStatus === "not_started" && !automaticGenerationEnabled) {
    return "Sem postagem registrada";
  }

  return generationStatusLabel(generationStatus);
}
