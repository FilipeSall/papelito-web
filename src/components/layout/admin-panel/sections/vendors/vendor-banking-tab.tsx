import type { AdminVendorBankAccount, AdminVendorDetail } from "@/lib/server/admin-vendors";
import { formatBankCodeLabel } from "@/features/revendedor/constants/bank-codes";

import { DetailRow, DetailSection } from "./vendor-detail-primitives";

function formatHolderType(value: string): string {
  if (value === "company") return "Pessoa juridica";
  if (value === "individual") return "Pessoa fisica";
  return value || "—";
}

function formatAccountType(value: string): string {
  if (value === "checking") return "Conta corrente";
  if (value === "savings") return "Conta poupanca";
  return value || "—";
}

function formatBranch(bankAccount: AdminVendorBankAccount | null): string {
  if (!bankAccount?.branchNumber) return "—";
  return bankAccount.branchCheckDigit
    ? `${bankAccount.branchNumber}-${bankAccount.branchCheckDigit}`
    : bankAccount.branchNumber;
}

function formatAccount(bankAccount: AdminVendorBankAccount | null): string {
  if (!bankAccount?.accountNumber) return "—";
  return bankAccount.accountCheckDigit
    ? `${bankAccount.accountNumber}-${bankAccount.accountCheckDigit}`
    : bankAccount.accountNumber;
}

export function VendorBankingTab({ vendor }: { vendor: AdminVendorDetail }) {
  const bankAccount = vendor.bankAccount;

  return (
    <DetailSection title="Dados bancarios">
      <DetailRow label="Titular" value={bankAccount?.holderName} />
      <DetailRow label="Tipo do titular" value={formatHolderType(bankAccount?.holderType ?? "")} />
      <DetailRow label="Documento do titular" value={bankAccount?.holderDocument} />
      <DetailRow label="Banco" value={formatBankCodeLabel(bankAccount?.bankCode)} />
      <DetailRow label="Agencia" value={formatBranch(bankAccount)} />
      <DetailRow label="Conta" value={formatAccount(bankAccount)} />
      <DetailRow label="Tipo da conta" value={formatAccountType(bankAccount?.type ?? "")} />
    </DetailSection>
  );
}
