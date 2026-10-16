import type {
  CnaeRestriction,
  GatewayStatus,
  MercadoPagoAccountSummary,
} from "@/features/vendor-payment-gateways/types/payment-gateways";
import {
  formatCnaeCode,
  formatGatewayTimestamp,
  pendingFieldLabel,
} from "@/features/vendor-payment-gateways/utils/gateway-display";
import { gatewayReasonLabel, gatewayStateLabel } from "@/features/vendor-payment-gateways/utils/payment-gateway-messages";

const POSITION_LABEL: Record<CnaeRestriction["position"], string> = {
  primary: "CNAE principal",
  secondary: "CNAE secundário",
};

const NEVER = "Nunca";
const BLOCKED_CNAE_TITLE = gatewayStateLabel("blocked_cnae");

function cnaeDescription(item: CnaeRestriction): string {
  return item.label ? ` — ${item.label}` : "";
}

function CnaeCodeList({ codes }: Readonly<{ codes: CnaeRestriction[] }>) {
  if (codes.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1 text-[13px] font-medium">
      {codes.map((item) => (
        <li key={`${item.position}-${item.code}`}>
          {POSITION_LABEL[item.position]} <code className="font-(--font-admin-mono) font-semibold">{formatCnaeCode(item.code)}</code>
          {cnaeDescription(item)}
        </li>
      ))}
    </ul>
  );
}

function CnaeRestrictionList({ codes }: Readonly<{ codes: CnaeRestriction[] }>) {
  return (
    <div className="border-2 border-[#c0392b] bg-[#f7e6e2] px-4 py-3 text-[#7a3428]">
      <p className="text-sm font-black">{BLOCKED_CNAE_TITLE}</p>
      <p className="mt-1 text-[13px] leading-5 font-medium">
        A Pagar.me não atende empresas com atividade de fumo. A restrição considera a atividade principal e todas as secundárias do cartão CNPJ.
      </p>
      <CnaeCodeList codes={codes} />
    </div>
  );
}

function ReasonList({ reasonCodes }: Readonly<{ reasonCodes: string[] }>) {
  const labels = [...new Set(reasonCodes.map(gatewayReasonLabel))];
  if (labels.length === 0) return null;

  return (
    <ul className="list-disc space-y-1 pl-5 text-[13px] leading-5 font-medium text-[#1a1a1a]/80">
      {labels.map((label) => (
        <li key={label}>{label}</li>
      ))}
    </ul>
  );
}

function PendingFieldList({ fields }: Readonly<{ fields: string[] }>) {
  const labels = [...new Set(fields.map(pendingFieldLabel))];
  if (labels.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70">Falta preencher</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px] font-medium text-[#1a1a1a]/80">
        {labels.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </div>
  );
}

type FactProps = { label: string; value: string };

function Fact({ label, value }: Readonly<FactProps>) {
  return (
    <div className="flex gap-1.5">
      <dt className="uppercase tracking-wider text-[#1a1a1a]/60">{label}</dt>
      <dd className="font-semibold text-[#1a1a1a]">{value}</dd>
    </div>
  );
}

function GatewayFacts({ status }: Readonly<{ status: GatewayStatus }>) {
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1.5 font-(--font-admin-mono) text-xs" data-numeric>
      <Fact label="Pagamentos" value={status.canReceive ? "Recebe" : "Não recebe"} />
      <Fact label="Última verificação" value={formatGatewayTimestamp(status.lastCheckedAt) || NEVER} />
      <Fact label="Último sucesso" value={formatGatewayTimestamp(status.lastSuccessAt) || NEVER} />
    </dl>
  );
}

function ConnectedAccountNote({ account, status }: Readonly<{ account?: MercadoPagoAccountSummary | null; status: GatewayStatus }>) {
  if (account?.status !== "active") return null;

  return (
    <p className="text-[13px] font-medium text-[#1a1a1a]/70">
      Conta Mercado Pago nº <span className="font-(--font-admin-mono) font-semibold text-[#1a1a1a]">{account.collectorId || "—"}</span>
      {status.canReceive ? "" : ". Conectada, mas ainda não liberada para receber."}
    </p>
  );
}

type PaymentGatewayDetailsProps = {
  /** Status do backend; `null` quando o resumo não trouxe este gateway. */
  status: GatewayStatus | null;
  /** Conta Mercado Pago vinculada; só lida nos detalhes do Mercado Pago. */
  account?: MercadoPagoAccountSummary | null;
};

/**
 * Detalhes de um gateway na gaveta do quadro de Pagamentos: restrição CNAE, conta conectada,
 * motivos legíveis, pendências e datas da última verificação e do último sucesso. Aptidão vem
 * só de `canReceive` — conta conectada em verificação nunca é desenhada como liberada.
 */
export function PaymentGatewayDetails({ account, status }: Readonly<PaymentGatewayDetailsProps>) {
  if (!status) {
    return <p className="text-[13px] font-medium text-[#1a1a1a]/70">A Papelito não informou o estado deste gateway agora.</p>;
  }

  return (
    <>
      {status.state === "blocked_cnae" ? <CnaeRestrictionList codes={status.cnaeCodes} /> : null}
      <ConnectedAccountNote account={account} status={status} />
      <ReasonList reasonCodes={status.reasonCodes} />
      <PendingFieldList fields={status.pendingFields} />
      <GatewayFacts status={status} />
    </>
  );
}
