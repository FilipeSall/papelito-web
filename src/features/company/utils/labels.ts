import type { CompanyRole, MemberStatus, OnboardingStatus } from "../types/company";

export const ROLE_LABELS: Record<CompanyRole, string> = {
  owner: "Titular",
  admin: "Administrador",
  buyer: "Comprador",
  viewer: "Consulta",
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  pending_identity: "Aguardando identidade",
  pending_company_approval: "Aguardando aprovação",
  active: "Ativo",
  rejected: "Rejeitado",
  suspended: "Suspenso",
  revoked: "Revogado",
  expired: "Expirado",
};

export function roleLabel(role: CompanyRole | null | undefined): string {
  return role ? ROLE_LABELS[role] : "—";
}

export function memberStatusLabel(status: MemberStatus | null | undefined): string {
  return status ? MEMBER_STATUS_LABELS[status] : "—";
}

/**
 * Mensagem clara de bloqueio conforme o estado de onboarding/compra. Retorna null quando não há
 * bloqueio a comunicar.
 */
export function blockMessageFor(context: {
  onboardingStatus: OnboardingStatus;
  companyStatus: string | null;
  membershipStatus: MemberStatus | null;
  canPurchase: boolean;
}): { title: string; body: string } | null {
  if (context.onboardingStatus === "none") {
    return {
      title: "Você ainda não faz parte de uma empresa",
      body: "Cadastre a sua empresa ou entre em uma empresa existente para comprar no Papelito.",
    };
  }
  if (context.onboardingStatus === "company_selection_required") {
    return {
      title: "Selecione a empresa ativa",
      body: "Você participa de mais de uma empresa. Escolha com qual deseja operar para liberar a compra.",
    };
  }
  if (context.onboardingStatus === "pending" || context.membershipStatus === "pending_company_approval") {
    return {
      title: "Cadastro em análise",
      body: "Sua participação está aguardando aprovação. Você será notificado assim que for liberada.",
    };
  }
  if (context.membershipStatus === "suspended") {
    return {
      title: "Acesso suspenso",
      body: "Sua participação nesta empresa está suspensa. Fale com um administrador da empresa.",
    };
  }
  if (!context.canPurchase) {
    return {
      title: "Compra indisponível",
      body: "Seu papel atual não permite comprar por esta empresa, ou a empresa ainda não está totalmente ativa.",
    };
  }
  return null;
}
