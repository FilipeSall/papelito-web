/**
 * Forma canônica de um e-mail para comparação e envio.
 *
 * Espelha `papelito_normalize_email()` no WordPress: apenas trim e caixa baixa. Não remove ponto
 * nem sufixo `+tag` — isso associaria endereços de contas diferentes.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Informa se dois endereços são o mesmo depois de normalizados. Vazio nunca casa.
 */
export function emailsMatch(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalizeEmail(left ?? "");
  const normalizedRight = normalizeEmail(right ?? "");

  return normalizedLeft !== "" && normalizedLeft === normalizedRight;
}
