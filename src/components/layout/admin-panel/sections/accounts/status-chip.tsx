import {
  Ban,
  Building2,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock,
  MailWarning,
  Store,
  User,
} from "lucide-react";

import { StatusChip, type StatusShape, type StatusTone } from "../../primitives";

const ACCOUNT_STATUS: Record<string, StatusShape> = {
  active: { icon: CircleCheck, label: "Ativa", tone: "positive" },
  admin_active: { icon: CircleCheck, label: "Ativa", tone: "positive" },
  vendor_active: { icon: CircleCheck, label: "Ativa", tone: "positive" },
  suspended: { icon: Ban, label: "Suspensa", tone: "critical" },
  email_pending: { icon: MailWarning, label: "E-mail pendente", tone: "pending" },
  pending_manual_review: { icon: Clock, label: "Em análise", tone: "pending" },
  vendor_pending: { icon: Clock, label: "Em análise", tone: "pending" },
  vendor_rejected: { icon: CircleX, label: "Reprovada", tone: "critical" },
};

const COMPANY_STATUS: Record<string, StatusShape> = {
  active: { icon: CircleCheck, label: "Ativa", tone: "positive" },
  suspended: { icon: Ban, label: "Suspensa", tone: "critical" },
  onboarding: { icon: Clock, label: "Em cadastro", tone: "pending" },
  archived: { icon: CircleDashed, label: "Arquivada", tone: "neutral" },
};

const OWNERSHIP_STATUS: Record<string, StatusShape> = {
  verified: { icon: CircleCheck, label: "Titularidade verificada", tone: "neutral" },
  pending: { icon: Clock, label: "Titularidade pendente", tone: "pending" },
  pending_manual_review: { icon: Clock, label: "Aguardando revisão", tone: "pending" },
  document_required: { icon: CircleAlert, label: "Aguardando documento", tone: "pending" },
  rejected: { icon: CircleX, label: "Titularidade reprovada", tone: "critical" },
};

const APPLICATION_STATUS: Record<string, StatusShape> = {
  pending_manual_review: { icon: Clock, label: "Aguardando revisão", tone: "pending" },
  document_required: { icon: CircleAlert, label: "Aguardando documento", tone: "pending" },
  approved: { icon: CircleCheck, label: "Aprovada", tone: "positive" },
  auto_approved: { icon: CircleCheck, label: "Aprovada automaticamente", tone: "positive" },
  rejected: { icon: CircleX, label: "Reprovada", tone: "critical" },
};

const ENTITY_ICONS = {
  company: Building2,
  person: User,
  vendor: Store,
} as const;

export type EntityKind = keyof typeof ENTITY_ICONS;

function resolve(map: Record<string, StatusShape>, status: string, fallbackLabel?: string) {
  return (
    map[status] ?? {
      icon: CircleDashed,
      label: fallbackLabel || status || "—",
      tone: "neutral" as StatusTone,
    }
  );
}

export { StatusChip, type StatusTone };

export function AccountStatusChip({
  className,
  fallbackLabel,
  status,
}: {
  className?: string;
  fallbackLabel?: string;
  status: string;
}) {
  const shape = resolve(ACCOUNT_STATUS, status, fallbackLabel);
  return <StatusChip className={className} {...shape} />;
}

export function CompanyStatusChip({ status }: { status: string }) {
  return <StatusChip {...resolve(COMPANY_STATUS, status)} />;
}

/**
 * Tom do status da empresa, para quem precisa da cor sem renderizar o chip.
 *
 * Mantém a paleta de status em um lugar só — cor nova entra em COMPANY_STATUS, não numa segunda
 * tabela paralela.
 */
export function companyStatusTone(status: string): StatusTone {
  return resolve(COMPANY_STATUS, status).tone;
}

export function OwnershipStatusChip({ status }: { status: string }) {
  return <StatusChip compact {...resolve(OWNERSHIP_STATUS, status)} />;
}

export function ApplicationStatusChip({ status }: { status: string }) {
  return <StatusChip {...resolve(APPLICATION_STATUS, status)} />;
}

/**
 * Ícone da entidade, usado para ancorar visualmente cada linha da listagem.
 */
export function EntityMark({ kind, label }: { kind: EntityKind; label: string }) {
  const Icon = ENTITY_ICONS[kind];

  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a]"
      title={label}
    >
      <Icon aria-hidden className="h-4 w-4" strokeWidth={2.2} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
