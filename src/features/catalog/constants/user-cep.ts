export function normalizeUserCep(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length === 8 ? digits : null;
}
