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
	purchaseMode?: "b2b" | "not_buyer" | "blocked";
	purchaseBlockReason?: string | null;
}): { title: string; body: string } | null {
	if (context.purchaseMode === "not_buyer") return null;
	const reasonMessages: Record<string, { title: string; body: string }> = {
		identity_incomplete: { title: "Perfil incompleto", body: "Complete a verificação do seu perfil para comprar em nome de uma empresa." },
		identity_rejected: { title: "Perfil não aprovado", body: "Seu perfil pessoal não está apto para realizar compras." },
		company_missing: { title: "Empresa necessária", body: "Cadastre sua empresa ou solicite acesso a uma empresa existente para comprar." },
		company_selection_required: { title: "Selecione a empresa ativa", body: "Escolha a empresa com a qual deseja operar antes de comprar." },
		company_pending_review: { title: "Cadastro em análise", body: "A empresa ainda aguarda aprovação para realizar compras." },
		company_rejected: { title: "Empresa não aprovada", body: "A empresa não está apta para realizar compras." },
		company_suspended: { title: "Empresa suspensa", body: "A empresa está suspensa para compras." },
		company_registry_inactive: { title: "Cadastro empresarial inativo", body: "A situação cadastral da empresa não permite compras." },
		company_registry_unavailable: { title: "Consulta empresarial indisponível", body: "Não foi possível confirmar o cadastro da empresa agora." },
		company_provider_conflict: { title: "Cadastro empresarial em revisão", body: "As fontes de consulta da empresa divergem e exigem revisão." },
		membership_missing: { title: "Vínculo necessário", body: "Você não possui um vínculo ativo com a empresa selecionada." },
		membership_pending: { title: "Vínculo em análise", body: "Seu vínculo empresarial ainda não foi aprovado." },
		membership_suspended: { title: "Acesso suspenso", body: "Seu vínculo empresarial está suspenso." },
		membership_expired: { title: "Vínculo expirado", body: "Seu vínculo empresarial expirou." },
		role_cannot_purchase: { title: "Sem permissão de compra", body: "Seu papel empresarial não permite realizar compras." },
		billing_email_unverified: { title: "E-mail de faturamento pendente", body: "Confirme o e-mail de faturamento em Perfil › Empresa para liberar as compras." },
		fiscal_address_incomplete: { title: "Endereço fiscal incompleto", body: "Complete o endereço fiscal da empresa para comprar." },
		payment_profile_incomplete: { title: "Dados de pagamento incompletos", body: "Revise os dados empresariais necessários para o pagamento." },
		alphanumeric_cnpj_payment_disabled: { title: "Pagamento indisponível", body: "O pagamento para CNPJ alfanumérico ainda não está disponível." },
	};
	if (context.purchaseBlockReason && reasonMessages[context.purchaseBlockReason]) {
		return reasonMessages[context.purchaseBlockReason];
	}
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
