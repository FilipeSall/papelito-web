import type { VendorBraspressIntegration } from "../types/vendor-braspress";

/** Como o estado deve ser pintado. A cor nunca é o único sinal: o rótulo já diz tudo. */
export type BraspressStateTone = "attention" | "neutral" | "positive";

/** Rótulo curto e explicação do que o vendor precisa fazer (ou esperar) naquele estado. */
export type BraspressIntegrationState = {
  description: string;
  label: string;
  tone: BraspressStateTone;
};

const UNREADABLE: BraspressIntegrationState = {
  description:
    "Não foi possível ler a configuração atual da Braspress. Recarregue a página antes de alterar qualquer dado.",
  label: "Estado não lido",
  tone: "attention",
};

const INVALID_CREDENTIALS: BraspressIntegrationState = {
  description:
    "A Braspress recusou a credencial salva. Só substituir usuário e senha tira a integração deste estado — uma cotação que dê certo depois não reabilita a conta sozinha.",
  label: "Credenciais inválidas",
  tone: "attention",
};

const PROVIDER_BLOCKED: BraspressIntegrationState = {
  description:
    "A credencial está correta; quem recusou o contrato foi a Braspress. Fale com a transportadora — trocar a senha aqui não resolve.",
  label: "Conta bloqueada na Braspress",
  tone: "attention",
};

const UNCONFIGURED: BraspressIntegrationState = {
  description:
    "Informe usuário, senha e o CEP de origem do seu contrato para começar. Nada é enviado à Braspress ao salvar.",
  label: "Não configurada",
  tone: "neutral",
};

const DISABLED: BraspressIntegrationState = {
  description:
    "A configuração continua guardada, mas a Braspress não é oferecida no checkout desta loja enquanto o controle acima estiver desligado.",
  label: "Desabilitada",
  tone: "neutral",
};

const READY: BraspressIntegrationState = {
  description:
    "A configuração está completa. A Braspress passa a Ativa sozinha na primeira cotação que der certo, sem validação manual e sem aprovação da Papelito.",
  label: "Pronta para a primeira cotação",
  tone: "neutral",
};

const ACTIVE: BraspressIntegrationState = {
  description:
    "A Braspress já cotou com sucesso para esta loja. Ela aparece no checkout do comprador quando também houver cobertura de CEP e embalagem cadastrada.",
  label: "Ativa",
  tone: "positive",
};

/**
 * Traduz a integração no par rótulo/explicação que o vendor lê no painel.
 *
 * A ordem das decisões é a regra, não detalhe: credencial recusada e conta
 * bloqueada aparecem **mesmo com a integração desligada**, porque exigem ação;
 * fora desses casos, desligada tem precedência sobre `ready`/`active`, senão
 * quem acabou de desativar a Braspress continuaria lendo "Ativa".
 */
export function braspressIntegrationState(
  integration: VendorBraspressIntegration,
): BraspressIntegrationState {
  if (integration.loadFailed) return UNREADABLE;
  if (integration.status === "invalid_credentials") return INVALID_CREDENTIALS;
  if (integration.status === "provider_blocked") return PROVIDER_BLOCKED;
  if (integration.status === "unconfigured") return UNCONFIGURED;
  if (!integration.enabled) return DISABLED;
  if (integration.status === "ready") return READY;

  return ACTIVE;
}
