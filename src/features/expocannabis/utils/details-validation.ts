import type { AttendanceContact, AttendanceState } from "../hooks/attendance-reducer";

/** Campo do formulário de dados e entrega. */
export type DetailsField = "name" | "phone" | "email" | "cep" | "street" | "number" | "neighborhood" | "city" | "state";

/** Erros por campo, só com os inválidos. */
export type DetailsErrors = Partial<Record<DetailsField, string>>;

/** Rótulo curto de cada campo, usado no "Falta arrumar". */
export const DETAILS_LABELS: Record<DetailsField, string> = {
  name: "nome",
  phone: "WhatsApp",
  email: "e-mail",
  cep: "CEP",
  street: "rua",
  number: "número",
  neighborhood: "bairro",
  city: "cidade",
  state: "UF",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Só os dígitos de um texto. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Máscara do WhatsApp: `(11) 98765-4321` ou `(11) 3456-7890`. */
export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  const split = digits.length === 11 ? 7 : 6;
  if (digits.length <= split) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}

function contactErrors(contact: AttendanceContact): DetailsErrors {
  const errors: DetailsErrors = {};
  if (contact.name.trim().length < 2) errors.name = "Informe o nome de quem compra.";
  const phone = onlyDigits(contact.phone).length;
  if (phone < 10 || phone > 11) errors.phone = "WhatsApp com DDD: 10 ou 11 números.";
  if (!EMAIL.test(contact.email.trim())) errors.email = "E-mail no formato nome@dominio.com.";
  return errors;
}

function addressErrors(delivery: AttendanceState["delivery"]): DetailsErrors {
  const errors: DetailsErrors = {};
  if (onlyDigits(delivery.cep).length !== 8) errors.cep = "O CEP tem 8 números. Confere aí?";
  if (!delivery.street.trim()) errors.street = "Informe a rua.";
  if (!delivery.number.trim()) errors.number = "Informe o número.";
  if (!delivery.neighborhood.trim()) errors.neighborhood = "Informe o bairro.";
  if (!delivery.city.trim()) errors.city = "Informe a cidade.";
  if (delivery.state.trim().length !== 2) errors.state = "UF com 2 letras.";
  return errors;
}

/** Valida contato e entrega. Número e bairro são exigidos também no endereço da Receita. */
export function validateDetails(state: AttendanceState): DetailsErrors {
  return { ...contactErrors(state.contact), ...addressErrors(state.delivery) };
}

/** Texto do aviso acima do botão: "Falta arrumar: nome, WhatsApp…". */
export function missingSummary(errors: DetailsErrors): string {
  const fields = (Object.keys(DETAILS_LABELS) as DetailsField[]).filter((field) => errors[field]);
  return fields.length ? `Falta arrumar: ${fields.map((field) => DETAILS_LABELS[field]).join(", ")}.` : "";
}
