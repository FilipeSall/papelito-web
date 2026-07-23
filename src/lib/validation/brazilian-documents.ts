import { isCep, isCnpj, isCpf } from "validator-brazil";

/**
 * Camada única de validação e formatação de documentos brasileiros (CPF, CNPJ, CEP).
 *
 * A validação estrutural (dígitos verificadores / formato) delega para `validator-brazil`,
 * que já suporta o CNPJ alfanumérico. As máscaras/normalizadores são próprios para preservar
 * letras do CNPJ alfanumérico e uppercase, mantendo paridade com o normalizador PHP do backend.
 *
 * Fase 0: este módulo é a base da consolidação futura. A validação de UX aqui NUNCA substitui
 * a autoridade do backend — a UI apenas sinaliza.
 */

/** Remove tudo que não for dígito. Use apenas para CPF/CEP (o CNPJ pode conter letras). */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/* ------------------------------------------------------------------ CPF */

/** Normaliza um CPF para 11 dígitos (string vazia se o comprimento não bater). */
export function normalizeCpf(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);
  return digits.length === 11 ? digits : "";
}

/** Aplica a máscara visual de CPF (000.000.000-00). */
export function formatCpf(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Valida um CPF pelos dígitos verificadores oficiais. */
export function isValidCpf(value: string): boolean {
  return isCpf(value);
}

/* ----------------------------------------------------------------- CNPJ */

/**
 * Canonicaliza um CNPJ: uppercase, mantém apenas [A-Z0-9], até 14 posições.
 *
 * NÃO usa `\D` (destruiria as letras do CNPJ alfanumérico). Retorna string vazia se o
 * resultado não tiver 14 caracteres.
 */
export function normalizeCnpj(value: string): string {
  const filtered = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);
  return filtered.length === 14 ? filtered : "";
}

/**
 * Aplica a máscara visual de CNPJ (00.000.000/0000-00) preservando letras e uppercase para
 * suportar o CNPJ alfanumérico.
 */
export function formatCnpj(value: string): string {
  const chars = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);

  if (chars.length <= 2) return chars;
  if (chars.length <= 5) return `${chars.slice(0, 2)}.${chars.slice(2)}`;
  if (chars.length <= 8) {
    return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5)}`;
  }
  if (chars.length <= 12) {
    return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5, 8)}/${chars.slice(8)}`;
  }
  return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5, 8)}/${chars.slice(8, 12)}-${chars.slice(12)}`;
}

/** Valida um CNPJ (numérico ou alfanumérico) pelos dígitos verificadores oficiais. */
export function isValidCnpj(value: string): boolean {
  return isCnpj(value);
}

/** Indica se o CNPJ contém letras nas 12 primeiras posições (classificação, não aceitação). */
export function isAlphanumericCnpj(value: string): boolean {
  const canonical = normalizeCnpj(value);
  return canonical !== "" && /[A-Z]/.test(canonical.slice(0, 12));
}

/* ------------------------------------------------------------------ CEP */

/** Normaliza um CEP para 8 dígitos (string vazia se o comprimento não bater). */
export function normalizeCep(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  return digits.length === 8 ? digits : "";
}

/** Aplica a máscara visual de CEP (00000-000). */
export function formatCep(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Valida apenas o FORMATO estrutural do CEP. NÃO comprova existência — a consulta remota
 * (ViaCEP/BrasilAPI) permanece separada e é a prova de existência.
 */
export function isValidCep(value: string): boolean {
  return isCep(value);
}
