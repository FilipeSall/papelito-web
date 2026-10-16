"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";

import { AnchoredSection } from "@/components/ui/anchored-sections";
import { hardDangerActionClass, hardPrimaryActionClass, hardSecondaryActionClass } from "@/components/ui/hard-actions";
import {
  fetchVendorPaymentSummary,
  refreshVendorPaymentGateways,
  saveVendorPaymentPreference,
  startMercadoPagoConnection,
  startPagarmeKyc,
  submitPagarmeRecipient,
} from "@/features/vendor-payment-gateways/services/payment-gateways-client";
import type {
  GatewayStatus,
  MercadoPagoAccountSummary,
  PaymentProvider,
  VendorPaymentSummary,
} from "@/features/vendor-payment-gateways/types/payment-gateways";
import {
  PROVIDER_LABELS,
  isMercadoPagoConnected,
  oauthReturnBanner,
  paymentRoutes,
  type PaymentRoute,
} from "@/features/vendor-payment-gateways/utils/gateway-display";

import { CARRIER_ROUTE_COLUMNS } from "./carrier-route-row";
import { MercadoPagoDisconnectDialog } from "./mercadopago-disconnect-dialog";
import { PaymentGatewayDetails } from "./payment-gateway-details";
import { PaymentNotice, type PaymentNoticeState } from "./payment-notice";
import { PaymentRouteRow } from "./payment-route-row";

/** Âncora do formulário financeiro, alvo do "Completar dados financeiros". */
export const FINANCIAL_PROFILE_ANCHOR = "dados-financeiros";

type BusyAction = "connect" | "kyc" | "preference" | "pagarme" | "refresh" | null;

type VendorPaymentGatewaysPanelProps = {
  /** Resumo lido no servidor; o painel só o substitui por respostas do servidor. */
  initialSummary: VendorPaymentSummary;
  /** Valor de `?mercadopago=` do retorno do OAuth. */
  oauthOutcome?: string;
  /** Valor de `?reason=` do retorno do OAuth (código do catálogo de erros). */
  oauthReason?: string;
  /** Formulário financeiro, renderizado dentro da mesma seção. */
  children?: ReactNode;
};

const ROUTE_HEADINGS = ["Gateway", "Recebe", "Estado", "Papel"];

const SUSPENDED_NOTICE: PaymentNoticeState = {
  tone: "error",
  title: "Pagamentos suspensos",
  message: "A Papelito suspendeu os pagamentos desta loja. Fale com o suporte para entender o que falta.",
};

const ROUTE_TOOLTIP: Record<PaymentProvider, string> = {
  mercadopago:
    "Os pedidos vão para a sua conta Mercado Pago pelo Checkout Pro: o comprador paga no ambiente do Mercado Pago com cartão, PIX ou boleto.",
  pagarme:
    "Os pedidos vão para o recebedor da sua loja na Pagar.me, com cartão, PIX ou boleto no checkout da Papelito.",
};

function selectedMessage(provider: PaymentProvider): string {
  const other = provider === "mercadopago" ? "pagarme" : "mercadopago";

  return `✓ ${PROVIDER_LABELS[provider]} passa a receber todos os novos pedidos. ${PROVIDER_LABELS[other]} fica fora do checkout; pedidos já emitidos continuam no gateway em que foram criados.`;
}

/**
 * Alerta de loja fora do checkout: o gateway escolhido não recebe e, por ser escolha
 * exclusiva, o outro não entra no lugar.
 */
function SelectedGatewayAlert({ route }: Readonly<{ route: PaymentRoute | undefined }>) {
  if (route?.statusTone !== "attention") return null;

  return (
    <PaymentNotice
      notice={{
        tone: "error",
        title: "Sua loja está fora do checkout",
        message: `${route.label} é o gateway escolhido, mas não pode receber agora: ${route.hint ?? ""} Resolva a pendência ou escolha o outro gateway.`,
      }}
    />
  );
}

type MercadoPagoActionsProps = {
  busy: BusyAction;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

function MercadoPagoActions({ busy, connected, onConnect, onDisconnect }: Readonly<MercadoPagoActionsProps>) {
  const connectLabel = connected ? "Reconectar Mercado Pago" : "Conectar Mercado Pago";

  return (
    <>
      <button className={hardPrimaryActionClass} disabled={busy !== null} onClick={onConnect} type="button">
        {busy === "connect" ? "Abrindo Mercado Pago..." : connectLabel}
      </button>
      {connected ? (
        <button className={hardDangerActionClass} disabled={busy !== null} onClick={onDisconnect} type="button">
          Desconectar
        </button>
      ) : null}
    </>
  );
}

type PagarmeActionsProps = {
  busy: BusyAction;
  status: GatewayStatus | null;
  onKyc: () => void;
  onSubmit: () => void;
};

/**
 * Próximo passo da Pagar.me, conforme o estado do servidor: completar o cadastro, enviá-lo à
 * Pagar.me ou concluir a verificação. CNAE bloqueado ou recebedor ativo não têm ação aqui.
 */
function PagarmeActions({ busy, onKyc, onSubmit, status }: Readonly<PagarmeActionsProps>) {
  if (!status || status.state === "blocked_cnae" || status.canReceive) return null;

  if (status.pendingFields.length > 0) {
    return (
      <a className={hardSecondaryActionClass} href={`#${FINANCIAL_PROFILE_ANCHOR}`}>
        Completar dados financeiros
      </a>
    );
  }

  if (status.state === "kyc_pending") {
    return (
      <button className={hardPrimaryActionClass} disabled={busy !== null} onClick={onKyc} type="button">
        {busy === "kyc" ? "Abrindo Pagar.me..." : "Concluir verificação na Pagar.me"}
      </button>
    );
  }

  return (
    <button className={hardPrimaryActionClass} disabled={busy !== null} onClick={onSubmit} type="button">
      {busy === "pagarme" ? "Enviando..." : "Enviar cadastro à Pagar.me"}
    </button>
  );
}

type GatewayDrawerProps = {
  account?: MercadoPagoAccountSummary | null;
  actions: ReactNode;
  status: GatewayStatus | null;
};

function GatewayDrawer({ account, actions, status }: Readonly<GatewayDrawerProps>) {
  return (
    <div className="px-5 pb-5 md:px-6">
      <div className="space-y-4 border-2 border-[#1a1a1a] bg-[#fbf7ef] p-4 md:p-5">
        <PaymentGatewayDetails account={account} status={status} />
        <div className="flex flex-wrap gap-3 empty:hidden">{actions}</div>
      </div>
    </div>
  );
}

/**
 * Seção Pagamentos do vendor no modo de gateways, no formato do quadro de Transportadoras: uma
 * linha por gateway com rádio de escolha exclusiva, estado e papel, e uma gaveta com os detalhes
 * e as ações de cada um (conectar o Mercado Pago, enviar o cadastro ou concluir a verificação na
 * Pagar.me).
 *
 * Só o gateway escolhido recebe; o outro nunca entra como alternativa automática. Nada é
 * otimista: escolha, desconexão e reconsultas só mudam a tela com a resposta do servidor, e o
 * cabeçalho da página é atualizado por `router.refresh()` depois de cada mudança.
 */
export function VendorPaymentGatewaysPanel({
  children,
  initialSummary,
  oauthOutcome,
  oauthReason,
}: Readonly<VendorPaymentGatewaysPanelProps>) {
  const router = useRouter();
  const radioName = useId();
  const [summary, setSummary] = useState(initialSummary);
  const [notice, setNotice] = useState<PaymentNoticeState | null>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const routes = paymentRoutes(summary);
  const selectedRoute = routes.find((route) => route.selected);
  const connected = isMercadoPagoConnected(summary);

  async function reloadSummary(successMessage: string) {
    const result = await fetchVendorPaymentSummary();

    if (result.ok) setSummary(result.data);
    setNotice({ tone: "success", message: successMessage });
    router.refresh();
  }

  async function refresh() {
    setBusy("refresh");
    setNotice(null);
    const result = await refreshVendorPaymentGateways();
    setBusy(null);

    if (!result.ok) {
      setNotice({ tone: "error", message: result.message });
      return;
    }

    setSummary(result.data);
    setNotice({ tone: "success", message: "Estado dos gateways atualizado." });
    router.refresh();
  }

  async function select(provider: PaymentProvider) {
    setBusy("preference");
    setNotice(null);
    const result = await saveVendorPaymentPreference(provider, summary.preference.version);
    setBusy(null);

    if (!result.ok) {
      setNotice({ tone: "error", title: "Escolha não salva", message: result.message });
      return;
    }

    setSummary((current) => ({ ...current, preference: result.data }));
    setNotice({ tone: "success", message: selectedMessage(provider) });
    router.refresh();
  }

  async function submitPagarme() {
    setBusy("pagarme");
    setNotice(null);
    const result = await submitPagarmeRecipient();

    if (!result.ok) {
      setBusy(null);
      setNotice({ tone: "error", title: "Cadastro não enviado", message: result.message });
      return;
    }

    await reloadSummary("Cadastro enviado à Pagar.me. Ela analisa os dados e pode pedir a verificação da empresa.");
    setBusy(null);
  }

  async function redirectTo(action: "connect" | "kyc", start: () => ReturnType<typeof startPagarmeKyc>) {
    setBusy(action);
    setNotice(null);
    const result = await start();

    if (!result.ok) {
      setBusy(null);
      setNotice({ tone: "error", message: result.message });
      return;
    }

    window.location.assign(result.data);
  }

  async function handleDisconnected() {
    setDisconnectOpen(false);
    await reloadSummary("Conta Mercado Pago desconectada para novos pedidos.");
  }

  function drawerActions(provider: PaymentProvider, status: GatewayStatus | null): ReactNode {
    if (provider === "mercadopago") {
      return (
        <MercadoPagoActions
          busy={busy}
          connected={connected}
          onConnect={() => void redirectTo("connect", startMercadoPagoConnection)}
          onDisconnect={() => setDisconnectOpen(true)}
        />
      );
    }

    return (
      <PagarmeActions
        busy={busy}
        onKyc={() => void redirectTo("kyc", startPagarmeKyc)}
        onSubmit={() => void submitPagarme()}
        status={status}
      />
    );
  }

  return (
    <AnchoredSection
      bodyClassName="bg-white"
      description="Escolha o gateway que recebe os pedidos da sua loja. A Papelito não retém o seu dinheiro: cada pagamento vai direto para a conta da loja no gateway escolhido."
      id="pagamentos"
      title="Pagamentos"
    >
      <div className="space-y-3 px-5 pt-5 empty:hidden md:px-6">
        <PaymentNotice notice={summary.mode === "suspended" ? SUSPENDED_NOTICE : null} />
        <SelectedGatewayAlert route={selectedRoute} />
        <PaymentNotice notice={oauthReturnBanner(oauthOutcome, oauthReason)} />
        <PaymentNotice notice={notice} />
      </div>

      <fieldset aria-busy={busy === "preference"} className="mt-4">
        <legend className="sr-only">Gateway que recebe os pedidos</legend>
        <div
          aria-hidden="true"
          className={`hidden gap-x-4 border-y-2 border-[#1a1a1a] px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60 md:grid ${CARRIER_ROUTE_COLUMNS}`}
        >
          {ROUTE_HEADINGS.map((heading) => (
            <span key={heading}>{heading}</span>
          ))}
        </div>
        <div className="divide-y-2 divide-[#1a1a1a]/10">
          {routes.map((route) => (
            <PaymentRouteRow
              busy={busy !== null}
              key={route.provider}
              name={radioName}
              onSelect={() => void select(route.provider)}
              route={route}
              tooltip={ROUTE_TOOLTIP[route.provider]}
            >
              <GatewayDrawer
                account={route.provider === "mercadopago" ? summary.mercadopagoAccount : undefined}
                actions={drawerActions(route.provider, route.status)}
                status={route.status}
              />
            </PaymentRouteRow>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#1a1a1a] bg-[#fbf7ef] px-5 py-4 md:px-6">
        <p className="max-w-2xl text-xs leading-5 font-semibold text-[#1a1a1a]/65">
          Só um gateway recebe por vez: o outro não entra como alternativa automática. Trocar vale para os próximos
          pedidos — pedido com link, PIX ou boleto já emitido não troca de gateway. A reconsulta só lê o estado; nenhuma
          cobrança é feita.
        </p>
        <button className={hardSecondaryActionClass} disabled={busy !== null} onClick={() => void refresh()} type="button">
          {busy === "refresh" ? "Consultando..." : "Atualizar estado"}
        </button>
      </div>

      {children ? <div className="px-5 pb-6 md:px-6">{children}</div> : null}

      <MercadoPagoDisconnectDialog
        onClose={() => setDisconnectOpen(false)}
        onDisconnected={() => void handleDisconnected()}
        open={disconnectOpen}
      />
    </AnchoredSection>
  );
}
