import { Ban, CircleCheckBig, ClipboardCheck, Clock, PackageCheck, Truck, Undo2, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { StatusTone } from "@/components/layout/operational-panel";
import type { VendorReturnStatus } from "@/features/returns/types/vendor-return";

/**
 * Ação que o estado atual permite. Em qualquer momento a devolução tem no
 * máximo uma ação principal — é isso que mantém a fila legível e o painel de
 * ação sempre no mesmo lugar, em vez de sete botões competindo.
 */
export type ReturnAction =
  | "approve"
  | "authorization"
  | "received"
  | "inspection"
  | "refund"
  | null;

type ReturnStatusMeta = {
  label: string;
  /** O que o vendor precisa fazer agora, em imperativo. Vazio quando é espera. */
  callToAction: string;
  action: ReturnAction;
  icon: LucideIcon;
  tone: StatusTone;
  /** Espera de terceiro: conta na fila, mas não cobra o vendor. */
  waiting: boolean;
};

const RETURN_STATUS: Record<VendorReturnStatus, ReturnStatusMeta> = {
  requested: {
    label: "Aguardando análise",
    callToAction: "Analisar solicitação",
    action: "approve",
    icon: Undo2,
    tone: "pending",
    waiting: false,
  },
  awaiting_reverse_authorization: {
    label: "Aprovada",
    callToAction: "Enviar autorização de postagem",
    action: "authorization",
    icon: ClipboardCheck,
    tone: "pending",
    waiting: false,
  },
  awaiting_posting: {
    label: "Aguardando postagem",
    callToAction: "Confirmar recebimento",
    action: "received",
    icon: Clock,
    tone: "neutral",
    waiting: true,
  },
  in_transit: {
    label: "Em trânsito",
    callToAction: "Confirmar recebimento",
    action: "received",
    icon: Truck,
    tone: "neutral",
    waiting: true,
  },
  awaiting_vendor_receipt: {
    label: "Chegou até você",
    callToAction: "Confirmar recebimento",
    action: "received",
    icon: PackageCheck,
    tone: "pending",
    waiting: false,
  },
  under_inspection: {
    label: "Em inspeção",
    callToAction: "Registrar inspeção",
    action: "inspection",
    icon: ClipboardCheck,
    tone: "pending",
    waiting: false,
  },
  refund_pending: {
    label: "Estorno pendente",
    callToAction: "Registrar estorno",
    action: "refund",
    icon: Wallet,
    tone: "critical",
    waiting: false,
  },
  refunded: { label: "Estornada", callToAction: "", action: null, icon: CircleCheckBig, tone: "positive", waiting: false },
  rejected: { label: "Recusada", callToAction: "", action: null, icon: Ban, tone: "neutral", waiting: false },
  cancelled: {
    label: "Cancelada pelo cliente",
    callToAction: "",
    action: null,
    icon: Ban,
    tone: "neutral",
    waiting: false,
  },
  posting_expired: {
    label: "Autorização expirada",
    callToAction: "",
    action: null,
    icon: Clock,
    tone: "neutral",
    waiting: false,
  },
};

const FALLBACK: ReturnStatusMeta = {
  label: "Situação desconhecida",
  callToAction: "",
  action: null,
  icon: Clock,
  tone: "neutral",
  waiting: true,
};

export function returnStatusMeta(status: string): ReturnStatusMeta {
  return RETURN_STATUS[status as VendorReturnStatus] ?? FALLBACK;
}

const REASON_LABELS: Record<string, string> = {
  regret: "Desistência da compra",
  defective: "Produto com defeito",
  damaged: "Danificado no transporte",
  incorrect_item: "Item errado",
  incomplete_item: "Item incompleto",
  other: "Outro motivo",
};

export function returnReasonLabel(reason: string) {
  return REASON_LABELS[reason] ?? "Motivo não informado";
}

const CONDITION_LABELS: Record<string, string> = {
  sellable: "Revendável",
  defective: "Com defeito",
  damaged: "Danificado",
  unsellable: "Sem condição de revenda",
  other: "Outra condição",
};

export function returnConditionLabel(condition: string | null) {
  return condition ? CONDITION_LABELS[condition] ?? condition : "";
}

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  bank_transfer: "Transferência bancária",
  original_method: "Mesmo meio da compra",
  other: "Outro meio",
};

export function returnMethodLabel(method: string) {
  return METHOD_LABELS[method] ?? method;
}
