export const ACCOUNTS_PATH = "/admin/contas";

export const ACCOUNTS_TABS = ["pessoas", "empresas", "vendors", "analises"] as const;

export type AccountsTab = (typeof ACCOUNTS_TABS)[number];

export const ACCOUNTS_TAB_LABELS: Record<AccountsTab, string> = {
  pessoas: "Contas",
  empresas: "Empresas",
  vendors: "Vendors",
  analises: "Análises",
};

export const MEMBERSHIP_ROLE_LABELS: Record<string, string> = {
  owner: "Titular",
  admin: "Administrador",
  buyer: "Comprador",
  viewer: "Consulta",
};

export const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  expired: "Expirado",
  pending_company_approval: "Aguardando aprovação",
  pending_identity: "Aguardando identidade",
  rejected: "Rejeitado",
  revoked: "Revogado",
  suspended: "Suspenso",
};

export function parseAccountsTab(value: string | undefined): AccountsTab {
  return (ACCOUNTS_TABS as readonly string[]).includes(value ?? "")
    ? (value as AccountsTab)
    : "pessoas";
}

export function membershipRoleLabel(role: string) {
  return MEMBERSHIP_ROLE_LABELS[role] ?? role ?? "—";
}

export function membershipStatusLabel(status: string) {
  return MEMBERSHIP_STATUS_LABELS[status] ?? status ?? "—";
}

export function accountsHref(tab: AccountsTab, query?: string) {
  const params = new URLSearchParams(query ?? "");

  if (tab === "pessoas") {
    params.delete("tab");
  } else {
    params.set("tab", tab);
  }

  const search = params.toString();
  return search ? `${ACCOUNTS_PATH}?${search}` : ACCOUNTS_PATH;
}

export function personHref(userId: number | string, query?: string) {
  const search = query ? `?${query}` : "";
  return `${ACCOUNTS_PATH}/${userId}${search}`;
}

export function companyHref(companyId: number) {
  return `${ACCOUNTS_PATH}/empresa/${companyId}`;
}

export function formatRelativeTime(value: string) {
  if (!value) return "—";

  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return "—";

  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 0) return "agora";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}m`;
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";

  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

export function formatCnpj(value: string) {
  const digits = value.replace(/\D+/g, "");

  if (digits.length !== 14) {
    return value || "—";
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export const COMPANY_STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  archived: "Arquivada",
  onboarding: "Em cadastro",
  suspended: "Suspensa",
};

export const OWNERSHIP_STATUS_LABELS: Record<string, string> = {
  document_required: "Aguardando documento",
  pending: "Titularidade pendente",
  pending_manual_review: "Aguardando revisão",
  rejected: "Titularidade reprovada",
  verified: "Titularidade verificada",
};

export function companyStatusLabel(status: string) {
  return COMPANY_STATUS_LABELS[status] ?? status ?? "—";
}

export function ownershipStatusLabel(status: string) {
  return OWNERSHIP_STATUS_LABELS[status] ?? status ?? "—";
}

export function companyDisplayName(row: { legalName: string; tradeName: string | null }) {
  return row.tradeName?.trim() || row.legalName.trim() || "Empresa sem nome";
}
