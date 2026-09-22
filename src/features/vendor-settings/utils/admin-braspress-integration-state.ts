import type { VendorBraspressIntegration } from "../types/vendor-braspress";

import type { BraspressStateTone } from "./braspress-integration-status";

/** Rótulo curto, explicação e tom do estado, como o administrador o lê. */
export type AdminBraspressIntegrationState = {
  description: string;
  label: string;
  tone: BraspressStateTone;
};

const UNREADABLE: AdminBraspressIntegrationState = {
  description:
    "Não foi possível ler a configuração desta loja. Recarregue a página antes de alterar qualquer dado.",
  label: "Estado não lido",
  tone: "attention",
};

const INVALID_CREDENTIALS: AdminBraspressIntegrationState = {
  description:
    "A Braspress recusou a credencial salva. Só o cadastro de um novo par usuário/senha tira a integração deste estado — uma cotação que dê certo depois não reabilita a conta.",
  label: "Credenciais inválidas",
  tone: "attention",
};

const PROVIDER_BLOCKED: AdminBraspressIntegrationState = {
  description:
    "A credencial está correta; quem recusou o contrato foi a Braspress. O vendor precisa resolver com a transportadora — trocar a senha aqui não resolve.",
  label: "Bloqueada na Braspress",
  tone: "attention",
};

const UNCONFIGURED: AdminBraspressIntegrationState = {
  description:
    "Esta loja ainda não tem contrato Braspress cadastrado. Nada é enviado à transportadora ao salvar.",
  label: "Não integrado",
  tone: "neutral",
};

const DISABLED: AdminBraspressIntegrationState = {
  description:
    "A configuração continua guardada, mas a Braspress não é oferecida no checkout desta loja enquanto o interruptor estiver desligado. O vendor pode religar pelo painel dele.",
  label: "Desativado",
  tone: "neutral",
};

const READY: AdminBraspressIntegrationState = {
  description:
    "A configuração está completa. A Braspress passa a Ativa sozinha na primeira cotação que der certo, sem validação manual.",
  label: "Integrado · pronto para cotar",
  tone: "neutral",
};

const ACTIVE: AdminBraspressIntegrationState = {
  description:
    "A Braspress já cotou com sucesso para esta loja. Ela aparece no checkout quando também houver cobertura de CEP e embalagem cadastrada.",
  label: "Integrado · ativo",
  tone: "positive",
};

/**
 * Traduz a integração no par rótulo/explicação que o administrador lê na aba.
 *
 * A ordem das decisões é a regra, e é a mesma da tela do vendor: credencial
 * recusada e conta bloqueada aparecem **mesmo com a integração desligada**,
 * porque exigem ação de alguém; fora desses casos, desligada tem precedência
 * sobre `ready`/`active`, senão quem acabou de desligar continuaria lendo
 * "Ativo".
 */
export function adminBraspressIntegrationState(
  integration: Pick<VendorBraspressIntegration, "enabled" | "loadFailed" | "status">,
): AdminBraspressIntegrationState {
  if (integration.loadFailed) return UNREADABLE;
  if (integration.status === "invalid_credentials") return INVALID_CREDENTIALS;
  if (integration.status === "provider_blocked") return PROVIDER_BLOCKED;
  if (integration.status === "unconfigured") return UNCONFIGURED;
  if (!integration.enabled) return DISABLED;
  if (integration.status === "ready") return READY;

  return ACTIVE;
}
