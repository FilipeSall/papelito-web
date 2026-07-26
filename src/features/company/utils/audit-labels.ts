export type AuditTone = "neutral" | "positive" | "warning" | "danger";

export type AuditCopy = {
  title: string;
  description: string;
  tone: AuditTone;
};

/**
 * Traduz as ações cruas da trilha de auditoria (snake_case vindo do WP) para linguagem de negócio.
 * A chave precisa acompanhar `papelito_company_audit()` no plugin — ação sem entrada aqui cai no
 * fallback humanizado em vez de vazar o identificador técnico.
 */
export const AUDIT_COPY: Record<string, AuditCopy> = {
  company_created: {
    title: "Empresa cadastrada",
    description: "A empresa foi criada no Papelito e entrou na fila de verificação.",
    tone: "neutral",
  },
  ownership_auto_approved: {
    title: "Titularidade aprovada automaticamente",
    description: "Os dados do CNPJ bateram com a receita e a titularidade foi liberada sem análise manual.",
    tone: "positive",
  },
  owner_approved: {
    title: "Titularidade aprovada",
    description: "Um analista do Papelito confirmou a titularidade da empresa.",
    tone: "positive",
  },
  owner_rejected: {
    title: "Titularidade recusada",
    description: "A verificação de titularidade não foi aprovada.",
    tone: "danger",
  },
  owner_resubmitted: {
    title: "Titularidade reenviada",
    description: "Os dados da empresa foram reenviados para uma nova verificação.",
    tone: "neutral",
  },
  active_company_selected: {
    title: "Empresa ativa selecionada",
    description: "Esta empresa passou a ser a empresa ativa para comprar.",
    tone: "neutral",
  },
  company_phone_updated: {
    title: "Telefone atualizado",
    description: "O telefone de contato da empresa foi alterado.",
    tone: "neutral",
  },
  billing_email_confirmation_requested: {
    title: "Confirmação de e-mail enviada",
    description: "Enviamos um e-mail para confirmar o endereço de faturamento.",
    tone: "neutral",
  },
  billing_email_verified: {
    title: "E-mail de faturamento confirmado",
    description: "O endereço de faturamento da empresa foi verificado.",
    tone: "positive",
  },
  member_invited: {
    title: "Convite enviado",
    description: "Um novo integrante foi convidado para a empresa.",
    tone: "neutral",
  },
  member_invitation_resent: {
    title: "Convite reenviado",
    description: "O convite foi enviado novamente e o link anterior deixou de valer.",
    tone: "neutral",
  },
  member_invitation_revoked: {
    title: "Convite cancelado",
    description: "O convite foi revogado antes de ser aceito.",
    tone: "warning",
  },
  invitation_accepted: {
    title: "Convite aceito",
    description: "O convidado aceitou o convite e passou a integrar a empresa.",
    tone: "positive",
  },
  member_role_changed: {
    title: "Papel alterado",
    description: "O nível de acesso de um integrante foi alterado.",
    tone: "warning",
  },
  member_expiration_set: {
    title: "Validade de acesso definida",
    description: "O acesso de um integrante passou a ter data para expirar.",
    tone: "neutral",
  },
  member_suspend: {
    title: "Acesso suspenso",
    description: "Um integrante foi temporariamente impedido de operar pela empresa.",
    tone: "warning",
  },
  member_reactivate: {
    title: "Acesso reativado",
    description: "Um integrante suspenso voltou a operar normalmente.",
    tone: "positive",
  },
  member_revoke: {
    title: "Acesso revogado",
    description: "Um integrante foi removido em definitivo da empresa.",
    tone: "danger",
  },
  access_requested: {
    title: "Acesso solicitado",
    description: "Alguém pediu para entrar nesta empresa e aguarda aprovação.",
    tone: "neutral",
  },
  access_request_approved: {
    title: "Solicitação aprovada",
    description: "O pedido de acesso foi aprovado e o integrante entrou na empresa.",
    tone: "positive",
  },
  access_request_rejected: {
    title: "Solicitação recusada",
    description: "O pedido de acesso à empresa foi recusado.",
    tone: "danger",
  },
  ownership_transferred: {
    title: "Titularidade transferida",
    description: "A titularidade da empresa passou para outro integrante.",
    tone: "warning",
  },
  legacy_migration_completed: {
    title: "Conta migrada",
    description: "A conta antiga foi migrada para o cadastro empresarial do Papelito.",
    tone: "neutral",
  },
};

/**
 * Fallback para ações novas no backend que ainda não têm cópia dedicada: vira "Member role changed"
 * em vez de "member_role_changed".
 */
export function humanizeAuditAction(action: string): string {
  const words = action.replace(/_/g, " ").trim();
  if (!words) return "Evento registrado";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function auditCopy(action: string): AuditCopy {
  return (
    AUDIT_COPY[action] ?? {
      title: humanizeAuditAction(action),
      description: "Evento registrado na trilha de segurança da empresa.",
      tone: "neutral",
    }
  );
}
