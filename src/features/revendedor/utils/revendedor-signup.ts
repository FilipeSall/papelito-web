import {
  type CadastroStep1Data,
  type CompanyApplicationStep1Errors,
  validateBirthDate,
} from "@/features/company-application";
import { formatCpf, isValidCnpj, isValidCpf } from "@/lib/validation/brazilian-documents";
import { validateNamePart, validatePhone } from "@/lib/validation/person";

import type {
  RevendedorSignupErrors,
  RevendedorSignupField,
  RevendedorSignupValues,
} from "../types/revendedor-signup";
import { isValidEmail } from "./revendedor-formatters";
import { createEmptyStep1Data, patchStep1Field } from "./revendedor-registration";

const INSTAGRAM_HANDLE = /^[A-Za-z0-9._]{1,30}$/;

/** Ordem dos campos na tela; o primeiro com erro recebe o foco. */
export const REVENDEDOR_SIGNUP_FIELDS: RevendedorSignupField[] = [
  "storeName",
  "firstName",
  "lastName",
  "cpf",
  "birthDate",
  "cnpj",
  "phone",
  "email",
  "instagram",
  "discoveryChannel",
  "hasSoldPapelito",
];

export function createEmptyRevendedorSignup(): RevendedorSignupValues {
  return { ...createEmptyStep1Data(), cpf: "", birthDate: "" };
}

/**
 * Aplica a máscara do campo editado. CPF e data de nascimento são próprios deste formulário;
 * o resto reaproveita a normalização da triagem de revendedor.
 */
export function patchRevendedorSignupField(
  current: RevendedorSignupValues,
  key: RevendedorSignupField,
  rawValue: string,
): RevendedorSignupValues {
  if (key === "cpf") return { ...current, cpf: formatCpf(rawValue) };
  if (key === "birthDate") return { ...current, birthDate: rawValue };

  const { cpf, birthDate, ...store } = current;
  return { ...patchStep1Field(store, key, rawValue), cpf, birthDate };
}

/**
 * Mesmas regras de identidade do `/cadastro` (nome, CPF, maioridade, CNPJ, telefone, e-mail) mais
 * os campos obrigatórios da loja. O Instagram segue o formato que o WordPress aceita, para o erro
 * aparecer aqui e não depois da etapa 2.
 */
export function validateRevendedorSignup(values: RevendedorSignupValues): RevendedorSignupErrors {
  const errors: RevendedorSignupErrors = {
    storeName: values.storeName.trim() ? undefined : "Informe o nome da loja.",
    firstName: validateNamePart(values.firstName, "Informe seu nome."),
    lastName: validateNamePart(values.lastName, "Informe seu sobrenome."),
    cpf: isValidCpf(values.cpf) ? undefined : "Informe um CPF válido.",
    birthDate: validateBirthDate(values.birthDate),
    cnpj: isValidCnpj(values.cnpj) ? undefined : "Informe um CNPJ válido.",
    phone: validatePhone(values.phone),
    email: isValidEmail(values.email) ? undefined : "Informe um e-mail válido.",
    instagram: validateInstagram(values.instagram),
    hasSoldPapelito: values.hasSoldPapelito ? undefined : "Escolha se você já vende produtos Papelito.",
  };

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as RevendedorSignupErrors;
}

function validateInstagram(value: string): string | undefined {
  if (!value.trim()) return "Informe o Instagram da loja.";
  if (!INSTAGRAM_HANDLE.test(value)) {
    return "Use só letras, números, ponto e sublinhado, com até 30 caracteres.";
  }
  return undefined;
}

/**
 * Converte o formulário na etapa 1 do cadastro que a `/cadastro/etapa-2` envia. O nome completo é
 * nome + sobrenome, e os dados da loja seguem em `lead` para o painel.
 */
export function revendedorSignupToStep1(values: RevendedorSignupValues): CadastroStep1Data {
  return {
    birthDate: values.birthDate,
    cnpj: values.cnpj.trim(),
    cpf: values.cpf.trim(),
    email: values.email.trim(),
    intent: "create_company",
    name: `${values.firstName.trim()} ${values.lastName.trim()}`,
    phone: values.phone.trim(),
    lead: {
      source: "revendedor",
      discoveryChannel: values.discoveryChannel,
      hasSoldPapelito: values.hasSoldPapelito,
      instagram: values.instagram.trim(),
      storeName: values.storeName.trim(),
    },
  };
}

/**
 * Leva para os campos do formulário os erros que a etapa 2 devolveu. O WordPress valida o nome
 * completo, então o erro dele aparece no campo Nome.
 */
export function revendedorErrorsFromStep1(
  errors: CompanyApplicationStep1Errors,
): RevendedorSignupErrors {
  const { name, ...rest } = errors;
  return name ? { ...rest, firstName: name } : rest;
}
