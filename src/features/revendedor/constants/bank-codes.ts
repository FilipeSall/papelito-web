import type { SelectOption } from "@/types/admin-products-manager";

export const OTHER_BANK_OPTION_VALUE = "other";

export type BankOption = SelectOption & {
  hasBranchCheckDigit?: boolean;
};

export const PRIMARY_BANK_OPTIONS: readonly BankOption[] = [
  { label: "001 - Banco do Brasil", value: "001" },
  { label: "104 - Caixa Economica Federal", value: "104" },
  { label: "237 - Bradesco", value: "237" },
  { label: "341 - Itau Unibanco", value: "341" },
  { label: "033 - Santander", value: "033" },
  { label: "260 - Nubank", value: "260", hasBranchCheckDigit: false },
  { label: "077 - Banco Inter", value: "077" },
  { label: "208 - BTG Pactual", value: "208" },
  { label: "212 - Banco Original", value: "212" },
  { label: "336 - C6 Bank", value: "336", hasBranchCheckDigit: false },
  { label: "422 - Banco Safra", value: "422" },
  { label: "623 - Banco Pan", value: "623" },
  { label: "756 - Sicoob", value: "756" },
  { label: "748 - Sicredi", value: "748" },
  { label: "041 - Banrisul", value: "041" },
  { label: "070 - BRB", value: "070" },
  { label: "004 - Banco do Nordeste", value: "004" },
  { label: "021 - Banestes", value: "021" },
] as const;

export const ADMIN_BANK_OPTIONS: readonly SelectOption[] = [
  ...PRIMARY_BANK_OPTIONS,
  { label: "Outro", value: OTHER_BANK_OPTION_VALUE },
];

export function findBankOptionByCode(bankCode: string): BankOption | undefined {
  return PRIMARY_BANK_OPTIONS.find((option) => option.value === bankCode.trim());
}

/**
 * Indica se a agencia do banco tem digito verificador.
 *
 * Bancos digitais como Nubank (260) e C6 (336) usam agencia fixa 0001 sem DV; a
 * Pagar.me rejeita a string vazia em `branch_check_digit`, entao o campo deve
 * ficar desabilitado e vazio no formulario. Atencao: o Inter (077) usa 0001-9,
 * ou seja, TEM DV. Para bancos desconhecidos ou nao mapeados, assume-se que ha
 * digito (comportamento padrao seguro).
 */
export function bankHasBranchCheckDigit(bankCode: string): boolean {
  const option = findBankOptionByCode(bankCode);
  if (!option) return true;
  return option.hasBranchCheckDigit !== false;
}

export function formatBankCodeLabel(bankCode: string | null | undefined): string {
  const normalized = bankCode?.trim() ?? "";
  if (!normalized) return "—";
  return findBankOptionByCode(normalized)?.label ?? normalized;
}
