export const CADASTRO_STORAGE_KEY = "papelito:cadastro:step1";

/**
 * Rascunho parcial da etapa 1, salvo quando o usuário sai da página sem enviar (ex.: clicando no
 * logo). Key separada de CADASTRO_STORAGE_KEY de propósito: aquela é o contrato de "etapa 1
 * concluída e validada" que libera a etapa 2, e um rascunho incompleto não pode satisfazer esse
 * guard.
 */
export const CADASTRO_STEP1_DRAFT_KEY = "papelito:cadastro:step1:draft";

export type CadastroStep1Draft = Partial<Omit<CadastroStep1Data, "intent">> & {
  intent?: CadastroIntent;
};

export {
  DEFAULT_POST_ONBOARDING_PATH,
  ONBOARDING_PATH,
} from "@/features/company/onboarding";

/**
 * Intenção de onboarding B2B:
 * - "create_company": o usuário é o titular e cadastra a própria empresa (fluxo com CNPJ).
 * - "join_company": o usuário cria a conta e depois solicita acesso a uma empresa existente.
 */
export type CadastroIntent = "create_company" | "join_company";

export type CadastroStep1Data = {
  birthDate: string;
  cpf: string;
  name: string;
  email: string;
  phone: string;
  intent: CadastroIntent;
};

/**
 * Dados já conhecidos ao abrir /cadastro/completar: identidade vinda do provedor OAuth e o que
 * o usuário salvou antes de abandonar. CPF e data de nascimento não voltam em claro por design.
 */
export type CadastroPrefill = {
  email: string;
  name: string;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cnpj: string;
  cpfLast4: string | null;
  hasBirthDate: boolean;
  intent: CadastroIntent;
};

export const BRAZILIAN_STATES: Array<{ value: string; label: string }> = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];
