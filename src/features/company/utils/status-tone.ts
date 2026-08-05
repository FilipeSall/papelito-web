export type StatusTone = "success" | "pending" | "danger" | "neutral";

/**
 * Paleta semântica dos status da área de empresa. O verde/vermelho não podem ser os tons puros do
 * Tailwind: o fundo é claro (#faf8f2/white) e a marca exige contraste AA no texto pequeno.
 */
export const STATUS_TEXT_CLASSES: Record<StatusTone, string> = {
  success: "text-[#1a7f37]",
  pending: "text-[#8a6d00]",
  danger: "text-[#c0392b]",
  neutral: "text-[#231f20]",
};

export const STATUS_BADGE_CLASSES: Record<StatusTone, string> = {
  success: "border-[#1a7f37] bg-[#e8f5ec] text-[#1a7f37]",
  pending: "border-[#8a6d00] bg-[#fdf6e0] text-[#8a6d00]",
  danger: "border-[#c0392b] bg-[#fbeceb] text-[#c0392b]",
  neutral: "border-[#1a1a1a] bg-white text-[#1a1a1a]",
};

/**
 * Mapa único de status → tom. Cobre member status, invitation status, company/registry/ownership
 * status e billing email status, que compartilham vocabulário no WP.
 */
const TONE_BY_STATUS: Record<string, StatusTone> = {
  active: "success",
  accepted: "success",
  verified: "success",
  complete: "success",

  pending: "pending",
  onboarding: "pending",
  pending_identity: "pending",
  pending_company_approval: "pending",
  pending_manual_review: "pending",
  unverified: "pending",
  unavailable: "pending",
  conflict: "pending",

  rejected: "danger",
  declined: "danger",
  suspended: "danger",
  revoked: "danger",
  expired: "danger",
  inactive: "danger",
};

export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";
  return TONE_BY_STATUS[status] ?? "neutral";
}

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  accepted: "Aceito",
  verified: "Verificado",
  complete: "Concluído",
  pending: "Pendente",
  onboarding: "Em cadastro",
  pending_manual_review: "Em análise",
  unverified: "Não confirmado",
  unavailable: "Indisponível",
  conflict: "Divergente",
  rejected: "Recusado",
  declined: "Recusado",
  suspended: "Suspenso",
  revoked: "Revogado",
  expired: "Expirado",
  inactive: "Inativo",
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status.replaceAll('_', " ");
}
