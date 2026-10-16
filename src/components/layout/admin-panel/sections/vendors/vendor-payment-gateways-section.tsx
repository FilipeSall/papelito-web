import { useId } from "react";

import type {
  GatewayStatus,
  MercadoPagoAccountSummary,
  PaymentProvider,
  VendorPaymentSummary,
} from "@/features/vendor-payment-gateways/types/payment-gateways";
import {
  PROVIDER_LABELS,
  PROVIDER_ORDER,
  findGateway,
  formatCnaeCode,
  formatGatewayTimestamp,
  identityStatusLabel,
  pendingFieldLabel,
} from "@/features/vendor-payment-gateways/utils/gateway-display";
import { gatewayReasonLabel, gatewayStateLabel } from "@/features/vendor-payment-gateways/utils/payment-gateway-messages";

import { Panel } from "../../primitives";

import { VendorMercadoPagoIdentityForm } from "./vendor-mercadopago-identity-form";

const MODE_LABELS: Record<VendorPaymentSummary["mode"], string> = {
  gateways: "Gateways (Mercado Pago e Pagar.me)",
  legacy: "Legado (recebedor Pagar.me)",
  suspended: "Pagamentos suspensos",
};

const POSITION_LABEL = { primary: "CNAE principal", secondary: "CNAE secundário" } as const;
const NEVER = "Nunca";
const LABEL_CLASS = "text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48";

function Row({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-1">
      <span className={LABEL_CLASS}>{label}</span>
      <span className="text-sm leading-6 text-[#231f20]">{value || "—"}</span>
    </div>
  );
}

function TextList({ items }: Readonly<{ items: string[] }>) {
  const unique = [...new Set(items)];
  if (unique.length === 0) return <>—</>;

  return (
    <ul className="list-disc space-y-0.5 pl-5">
      {unique.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function CnaeRows({ status }: Readonly<{ status: GatewayStatus }>) {
  if (status.cnaeCodes.length === 0) return null;

  return (
    <Row
      label="CNAE que bloqueia a Pagar.me"
      value={
        <TextList
          items={status.cnaeCodes.map(
            (item) => `${POSITION_LABEL[item.position]} ${formatCnaeCode(item.code)}${item.label ? ` — ${item.label}` : ""}`,
          )}
        />
      }
    />
  );
}

function AccountRows({ account }: Readonly<{ account: MercadoPagoAccountSummary | null }>) {
  if (!account) return <Row label="Conta Mercado Pago" value="Nenhuma conta conectada" />;

  return (
    <>
      <Row label="Collector ID" value={account.collectorId} />
      <Row label="Titularidade" value={identityStatusLabel(account.identityStatus)} />
      <Row label="Situação da conta" value={account.status} />
      <Row label="Conectada em" value={formatGatewayTimestamp(account.connectedAt)} />
    </>
  );
}

type GatewayArticleProps = {
  provider: PaymentProvider;
  status: GatewayStatus | null;
  account: MercadoPagoAccountSummary | null;
};

function GatewayRows({ account, provider, status }: Readonly<GatewayArticleProps>) {
  if (!status) return <p className="text-sm text-[#231f20]/64">Estado não informado pelo WordPress.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Row label="Estado" value={gatewayStateLabel(status.state)} />
      <Row label="Recebe pagamentos" value={status.canReceive ? "Sim" : "Não"} />
      <Row label="Motivos" value={<TextList items={status.reasonCodes.map(gatewayReasonLabel)} />} />
      <Row label="Pendências" value={<TextList items={status.pendingFields.map(pendingFieldLabel)} />} />
      <Row label="Última verificação" value={formatGatewayTimestamp(status.lastCheckedAt) || NEVER} />
      <Row label="Último sucesso" value={formatGatewayTimestamp(status.lastSuccessAt) || NEVER} />
      <CnaeRows status={status} />
      {provider === "mercadopago" ? <AccountRows account={account} /> : null}
    </div>
  );
}

function GatewayArticle({ account, provider, status }: Readonly<GatewayArticleProps>) {
  const headingId = useId();

  return (
    <article aria-labelledby={headingId} className="space-y-3 border-2 border-[#1a1a1a] bg-white p-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-[#231f20]" id={headingId}>
        {PROVIDER_LABELS[provider]}
      </h3>
      <GatewayRows account={account} provider={provider} status={status} />
    </article>
  );
}

type SectionProps = {
  summary: VendorPaymentSummary | null;
  vendorId: number;
};

/**
 * Espelho administrativo, somente leitura, da saúde dos dois gateways do vendor e da conta
 * Mercado Pago, com o registro da conferência de titularidade quando há conta ativa.
 */
export function VendorPaymentGatewaysSection({ summary, vendorId }: Readonly<SectionProps>) {
  if (!summary) {
    return (
      <Panel className="p-5 md:p-6">
        <p className="text-sm text-[#231f20]/64">Não foi possível ler o estado dos gateways deste vendor agora.</p>
      </Panel>
    );
  }

  const activeAccountId = summary.mercadopagoAccount?.status === "active" ? summary.mercadopagoAccount.accountId : 0;

  return (
    <Panel className="space-y-4 p-5 md:p-6">
      <h2
        className="text-sm font-semibold uppercase tracking-[0.2em] text-[#231f20]/74"
        style={{ fontFamily: "var(--font-admin-mono)" }}
      >
        Gateways de pagamento
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Row label="Modo financeiro" value={MODE_LABELS[summary.mode]} />
        <Row label="Gateway que recebe" value={PROVIDER_LABELS[summary.preference.preferredProvider]} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {PROVIDER_ORDER.map((provider) => (
          <GatewayArticle
            account={summary.mercadopagoAccount}
            key={provider}
            provider={provider}
            status={findGateway(summary, provider)}
          />
        ))}
      </div>
      {activeAccountId > 0 ? <VendorMercadoPagoIdentityForm accountId={activeAccountId} vendorId={vendorId} /> : null}
    </Panel>
  );
}
