import { validateAdultBirthDate } from "@/lib/validation/birth-date";
import { isValidCnpj, isValidCpf } from "@/lib/validation/brazilian-documents";
import { validateFullName, validatePhone } from "@/lib/validation/person";

import type {
  CadastroStep1Data,
  CadastroStep1Errors,
  CadastroStep1Field,
  CompanyApplicationStep1Errors,
} from "../types/company-application";

/** Etapa 1 concluída e validada; é o que libera a etapa 2. */
export const CADASTRO_STORAGE_KEY = "papelito:cadastro:step1";
export const CADASTRO_STEP2_DRAFT_KEY = "papelito:cadastro:step2:draft";

/** Erros por campo que a etapa 2 devolve à etapa de origem depois de um 422 do WordPress. */
export const CADASTRO_STEP1_ERROR_KEY = "papelito:cadastro:step1:errors";

/**
 * Rascunho parcial da etapa 1, salvo quando o usuário sai da página sem enviar (ex.: clicando no
 * logo). Key separada de CADASTRO_STORAGE_KEY de propósito: aquela é o contrato de "etapa 1
 * concluída e validada" que libera a etapa 2, e um rascunho incompleto não pode satisfazer esse
 * guard.
 */
export const CADASTRO_STEP1_DRAFT_KEY = "papelito:cadastro:step1:draft";

/**
 * Rascunho do formulário do `/revendedor`, com nome e sobrenome separados e os dados comerciais.
 * Fica numa key própria porque o formato difere do rascunho do `/cadastro`.
 */
export const REVENDEDOR_STEP1_DRAFT_KEY = "papelito:revendedor:step1:draft";

export const REVENDEDOR_FORM_PATH = "/revendedor#revendedor-form";

/** Ordem em que os campos de identidade aparecem e recebem foco quando há erro. */
export const CADASTRO_STEP1_FIELDS: CadastroStep1Field[] = [
  "name",
  "email",
  "phone",
  "cpf",
  "cnpj",
  "birthDate",
];

const API_FIELD_TO_STEP1_FIELD = {
  full_name: "name",
  email: "email",
  phone: "phone",
  cpf: "cpf",
  birth_date: "birthDate",
  cnpj: "cnpj",
  instagram: "instagram",
  discovery_channel: "discoveryChannel",
  has_sold_papelito: "hasSoldPapelito",
} as const;

/**
 * Regras da etapa 1 que valem para `/cadastro` e `/revendedor`: CPF e data de nascimento são
 * obrigatórios porque o WordPress confere o titular no QSA, e menor de 18 anos é barrado aqui
 * antes de chegar lá. `emailIsInvalid` vem do `validity` do input, que o formulário conhece.
 */
export function validateCadastroStep1(
  payload: CadastroStep1Data,
  emailIsInvalid: boolean,
): CadastroStep1Errors {
  const errors: CadastroStep1Errors = {};

  const nameError = validateFullName(payload.name);
  if (nameError) errors.name = nameError;
  if (!payload.email) {
    errors.email = "Informe seu e-mail.";
  } else if (emailIsInvalid) {
    errors.email = "Informe um e-mail válido.";
  }
  const phoneError = validatePhone(payload.phone);
  if (phoneError) errors.phone = phoneError;
  if (!isValidCpf(payload.cpf)) errors.cpf = "Informe um CPF válido.";
  if (!isValidCnpj(payload.cnpj)) errors.cnpj = "Informe um CNPJ válido.";
  const birthDateError = validateBirthDate(payload.birthDate);
  if (birthDateError) errors.birthDate = birthDateError;

  return errors;
}

/** Data de nascimento obrigatória e de maior de idade; undefined quando está certa. */
export function validateBirthDate(value: string): string | undefined {
  if (!value) return "Informe sua data de nascimento.";
  return validateAdultBirthDate(value);
}

/**
 * Traduz os erros por campo de um 422 de `POST /company-applications` para os nomes da etapa 1.
 * Campo que a etapa 1 não tem fica de fora, e a etapa 2 mostra a mensagem dele ali mesmo.
 */
export function step1ErrorsFromApiErrors(
  errors: Record<string, string[]>,
): CompanyApplicationStep1Errors {
  return Object.entries(API_FIELD_TO_STEP1_FIELD).reduce<CompanyApplicationStep1Errors>(
    (result, [apiField, field]) => {
      const message = errors[apiField]?.find(Boolean);
      if (message) result[field] = message;
      return result;
    },
    {},
  );
}

/**
 * Para onde a etapa 2 volta ("Voltar" ou erro na etapa 1): o formulário do `/revendedor` quando a
 * candidatura começou lá, senão o `/cadastro`, preservando o `callbackUrl`.
 */
export function companyApplicationStep1Path(
  step1: Pick<CadastroStep1Data, "lead"> | null,
  callbackUrl: string | null,
): string {
  if (step1?.lead?.source === "revendedor") return REVENDEDOR_FORM_PATH;
  return callbackUrl ? `/cadastro?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/cadastro";
}

/**
 * Lê e valida os erros que a etapa 2 deixou no `sessionStorage`, só para os campos pedidos.
 * Devolve vazio fora do navegador ou com JSON corrompido.
 */
export function readCompanyApplicationStep1Errors<Field extends string>(
  fields: readonly Field[],
): Partial<Record<Field, string>> {
  if (typeof window === "undefined") return {};

  const saved = window.sessionStorage.getItem(CADASTRO_STEP1_ERROR_KEY);
  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved) as Record<string, unknown>;
    return fields.reduce<Partial<Record<Field, string>>>((errors, field) => {
      const message = parsed[field];
      if (typeof message === "string" && message) errors[field] = message;
      return errors;
    }, {});
  } catch {
    return {};
  }
}
