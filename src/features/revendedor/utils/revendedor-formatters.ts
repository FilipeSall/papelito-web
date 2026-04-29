/**
 * Remove o arroba e espacos extras para manter apenas o handle do Instagram.
 */
export function sanitizeInstagramHandle(value: string) {
  return value.replace(/\s+/g, "").replace(/^@+/, "").slice(0, 30);
}

/**
 * Aplica a mascara visual de CNPJ sem alterar o valor semantico digitado.
 */
export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Aplica a mascara de telefone brasileira para numeros com DDD.
 */
export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Valida o formato basico de e-mail suficiente para o submit mock da landing.
 */
export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Valida um CNPJ usando os digitos verificadores oficiais.
 */
export function isValidCnpj(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const base = digits.slice(0, 12);
  const verificationDigits = digits.slice(12);

  const firstDigit = calculateVerificationDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateVerificationDigit(
    `${base}${firstDigit}`,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return verificationDigits === `${firstDigit}${secondDigit}`;
}

function calculateVerificationDigit(value: string, weights: number[]) {
  const total = value
    .split("")
    .reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);

  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}
