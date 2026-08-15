const MAX_FULL_NAME_LENGTH = 120;

/**
 * Palavra de um nome: letras, opcionalmente ligadas por apóstrofo ou hífen.
 *
 * Aplicada palavra a palavra, nunca à frase inteira. Uma regex que aceitasse o espaço tanto dentro
 * do grupo de ligação quanto entre palavras seria ambígua e teria backtracking exponencial — 62
 * caracteres já custavam 17 s e travavam a aba, e o teto de 120 caracteres não salvava.
 */
const NAME_WORD = /^\p{L}+(?:['’-]\p{L}+)*$/u;

/**
 * Colapsa qualquer separador de espaço Unicode num espaço simples.
 *
 * Espelha `papelito_normalize_unicode_spaces()` no WordPress. NBSP entra junto com nome colado de
 * PDF ou Word; sem normalizar dos dois lados, o formulário aceitava e o backend devolvia 422.
 */
function normalizeSpaces(value: string) {
  return value.replace(/[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF]+/gu, " ").trim();
}

function nameWords(value: string) {
  const normalized = normalizeSpaces(value);
  return normalized === "" ? [] : normalized.split(" ");
}

function nameLength(words: string[]) {
  return Array.from(words.join(" ")).length;
}

function charsetError(words: string[]) {
  return words.every((word) => NAME_WORD.test(word))
    ? undefined
    : "Informe apenas letras, espaços, apóstrofos e hífens no nome.";
}

export function validateFullName(value: string) {
  const words = nameWords(value);

  if (words.length === 0) return "Informe seu nome completo.";
  if (nameLength(words) > MAX_FULL_NAME_LENGTH) {
    return `Informe um nome com até ${MAX_FULL_NAME_LENGTH} caracteres.`;
  }
  if (words.length < 2) return "Informe nome e sobrenome.";

  return charsetError(words);
}

/** Valida uma parte isolada do nome (`first_name`/`last_name`), que pode ter uma palavra só. */
export function validateNamePart(value: string, emptyMessage: string) {
  const words = nameWords(value);

  if (words.length === 0) return emptyMessage;
  if (nameLength(words) > MAX_FULL_NAME_LENGTH) {
    return `Informe um nome com até ${MAX_FULL_NAME_LENGTH} caracteres.`;
  }

  return charsetError(words);
}

export function validatePhone(value: string) {
  const phone = normalizeSpaces(value);
  if (!phone) return "Informe seu telefone.";
  if (!/^[\d\s()+-]+$/.test(phone)) return "Informe um telefone válido com DDD.";

  const digits = phone.replace(/\D/g, "");
  // O prefixo 55 só cai em 12 ou 13 dígitos: um fixo do DDD 55 (Santa Maria/RS) tem 10 e precisa
  // sobreviver inteiro.
  const local = digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
    ? digits.slice(2)
    : digits;

  if (!/^(?:\d{10}|\d{11})$/.test(local) || /^(\d)\1+$/.test(local)) {
    return "Informe um telefone válido com DDD.";
  }

  return undefined;
}
