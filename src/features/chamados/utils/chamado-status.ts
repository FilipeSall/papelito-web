import { CircleCheckBig, Clock, MessageSquareMore, type LucideIcon } from "lucide-react";

import type { StatusTone } from "@/components/layout/operational-panel";

import type { ChamadoStatus } from "../types/chamado";

type ChamadoStatusMeta = {
  /** Afordância de UI. A autoridade continua sendo `capabilities` vindo do backend. */
  canReply: boolean;
  /** Conta na fila de trabalho do vendor e da Papelito. */
  countsAsQueue: boolean;
  icon: LucideIcon;
  label: string;
  tone: StatusTone;
};

const CHAMADO_STATUS: Record<ChamadoStatus, ChamadoStatusMeta> = {
  aberto: {
    canReply: true,
    countsAsQueue: true,
    icon: MessageSquareMore,
    label: "Aberto",
    tone: "pending",
  },
  // `neutral`, não `positive`: chamado fechado é registro fechado, não vitória — e amarelo de
  // celebração num registro que pode ter frustrado o cliente é a voz errada.
  encerrado: {
    canReply: false,
    countsAsQueue: false,
    icon: CircleCheckBig,
    label: "Encerrado",
    tone: "neutral",
  },
};

const FALLBACK: ChamadoStatusMeta = {
  canReply: false,
  countsAsQueue: false,
  icon: Clock,
  label: "Situação desconhecida",
  tone: "neutral",
};

export function chamadoStatusMeta(status: string): ChamadoStatusMeta {
  return CHAMADO_STATUS[status as ChamadoStatus] ?? FALLBACK;
}
