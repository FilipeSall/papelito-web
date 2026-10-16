import type { AdminVendorBankAccount, AdminVendorDetail } from "@/lib/server/admin-vendors";
import { formatBankCodeLabel } from "@/features/revendedor/constants/bank-codes";
import type { VendorPaymentSummary } from "@/features/vendor-payment-gateways/types/payment-gateways";

import { DetailRow, DetailSection } from "./vendor-detail-primitives";
import { VendorPaymentGatewaysSection } from "./vendor-payment-gateways-section";

function formatHolderType(value: string): string {
  if (value === "company") return "Pessoa jurídica";
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

/**
 * Aba de dados bancários do detalhe administrativo do vendor: conta cadastrada e, abaixo, o
 * espelho dos gateways de pagamento com o registro da conferência de titularidade Mercado Pago.
 */
export function VendorBankingTab({
  paymentGateways,
  vendor,
}: Readonly<{ paymentGateways: VendorPaymentSummary | null; vendor: AdminVendorDetail }>) {
  const bankAccount = vendor.bankAccount;

  return (
    <div className="space-y-5">
      <DetailSection title="Dados bancários">
        <DetailRow label="Titular" value={bankAccount?.holderName} />
        <DetailRow label="Tipo do titular" value={formatHolderType(bankAccount?.holderType ?? "")} />
        <DetailRow label="Documento do titular" value={bankAccount?.holderDocument} />
        <DetailRow label="Banco" value={formatBankCodeLabel(bankAccount?.bankCode)} />
        <DetailRow label="Agência" value={formatBranch(bankAccount)} />
        <DetailRow label="Conta" value={formatAccount(bankAccount)} />
        <DetailRow label="Tipo da conta" value={formatAccountType(bankAccount?.type ?? "")} />
      </DetailSection>
      <VendorPaymentGatewaysSection summary={paymentGateways} vendorId={vendor.id} />
    </div>
  );
}
