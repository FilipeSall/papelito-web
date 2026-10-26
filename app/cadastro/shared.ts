import type { CadastroIntent } from "@/features/company-application";

export {
  CADASTRO_STEP1_DRAFT_KEY,
  CADASTRO_STEP1_ERROR_KEY,
  CADASTRO_STEP2_DRAFT_KEY,
  CADASTRO_STORAGE_KEY,
  type CadastroIntent,
  type CadastroStep1Data,
  type CadastroStep1Draft,
  type CadastroStep1Errors,
  type CadastroStep1Field,
} from "@/features/company-application";

export {
  DEFAULT_POST_ONBOARDING_PATH,
  ONBOARDING_PATH,
} from "@/features/company/onboarding";

export type CadastroStep2Draft = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
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

export const BRAZILIAN_STATE_OPTIONS = BRAZILIAN_STATES.map((uf) => ({
  label: `${uf.value} — ${uf.label}`,
  searchText: `${uf.value} ${uf.label}`,
  triggerLabel: uf.value,
  value: uf.value,
}));
