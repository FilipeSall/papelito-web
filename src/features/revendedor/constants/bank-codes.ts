import type { SelectOption } from "@/types/admin-products-manager";

export const OTHER_BANK_OPTION_VALUE = "other";

export const PRIMARY_BANK_OPTIONS: readonly SelectOption[] = [
  { label: "001 - Banco do Brasil", value: "001" },
  { label: "104 - Caixa Economica Federal", value: "104" },
  { label: "237 - Bradesco", value: "237" },
  { label: "341 - Itau Unibanco", value: "341" },
  { label: "033 - Santander", value: "033" },
  { label: "260 - Nubank", value: "260" },
  { label: "077 - Banco Inter", value: "077" },
  { label: "208 - BTG Pactual", value: "208" },
  { label: "212 - Banco Original", value: "212" },
  { label: "336 - C6 Bank", value: "336" },
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

export function findBankOptionByCode(bankCode: string): SelectOption | undefined {
  return PRIMARY_BANK_OPTIONS.find((option) => option.value === bankCode.trim());
}

export function formatBankCodeLabel(bankCode: string | null | undefined): string {
  const normalized = bankCode?.trim() ?? "";
  if (!normalized) return "—";
  return findBankOptionByCode(normalized)?.label ?? normalized;
}
