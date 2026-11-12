"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";

import { expocannabisClient, type ClientResult } from "@/features/expocannabis/client/expocannabis-client";
import type { AttendanceAction, AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import { useTerminalChoice } from "@/features/expocannabis/hooks/use-terminal-choice";
import type { EventContext, EventTerminal } from "@/features/expocannabis/types/context";
import type { EventOrderStatus, ManualConfirmInput } from "@/features/expocannabis/types/order";
import { formatCents } from "@/features/expocannabis/utils/cart";
import { parseQuote } from "@/features/expocannabis/utils/parse-quote";
import { parseStockIssues } from "@/features/expocannabis/utils/stock-issues";

import { CheckoutCta, CheckoutLayout, StickyAside } from "./checkout-layout";
import { ManualConfirmDialog } from "./manual-confirm-dialog";
import { OrderSummary } from "./order-summary";
import { RadioCard } from "./radio-card";
import { TerminalActions, TerminalStatus } from "./terminal-status";
import { WarnBox } from "./warn-box";

type PaymentScreenProps = {
  context: EventContext;
  state: AttendanceState;
  dispatch: Dispatch<AttendanceAction>;
};

const POLL_MS = 2000;
const POLL_STATES = new Set(["sending", "at_terminal", "check_terminal"]);

function quoteItems(qty: Record<number, number>) {
  return Object.entries(qty).map(([productId, value]) => ({ productId: Number(productId), qty: value }));
}

function failureNotice(result: ClientResult<EventOrderStatus>, dispatch: Dispatch<AttendanceAction>): string {
  if (result.ok) return "";
  if (result.code === "papelito_event_out_of_stock") {
    dispatch({ type: "clear-charge" });
    dispatch({ type: "stock-issue", products: parseStockIssues(result.data) });
    return "";
  }
  const quote = result.code === "papelito_event_quote_changed" ? parseQuote(result.data?.quote) : null;
  if (!quote) return result.message;
  dispatch({ type: "set-quote", quote });
  return `O valor mudou: agora é ${formatCents(quote.totalCents)}. Confere com o lojista e cobra de novo.`;
}

function TerminalPicker({ terminals, value, onChange }: Readonly<{ terminals: EventTerminal[]; value: string; onChange: (terminalId: string) => void }>) {
  return (
    <div role="radiogroup" aria-label="Maquininha" className="grid gap-2.5 min-[768px]:grid-cols-2">
      {terminals.map((terminal, index) => (
        <RadioCard
          key={terminal.id}
          title={terminal.label}
          sub={index === 0 ? "Maquininha cadastrada do evento." : "Cobra nesta maquininha."}
          checked={value === terminal.id}
          variant="large"
          onSelect={() => onChange(terminal.id)}
        />
      ))}
    </div>
  );
}

function TotalLine({ total }: Readonly<{ total: string }>) {
  return (
    <div className="mt-2 flex items-baseline gap-2.5">
      <p className="text-base font-semibold text-[#52525B]">Total do pedido</p>
      <p className="text-[26px] font-extrabold">{total}</p>
    </div>
  );
}

function PaymentMethods({ method, total, dispatch }: Readonly<{ method: AttendanceState["method"]; total: string; dispatch: Dispatch<AttendanceAction> }>) {
  return (
    <div role="radiogroup" aria-label="Forma de pagamento" className="flex flex-col gap-3">
      <RadioCard
        variant="large"
        title="Cartão na maquininha"
        sub={`Passe ${total} no crédito ou no débito. As parcelas são escolhidas na máquina.`}
        checked={method === "card"}
        onSelect={() => dispatch({ type: "set-method", method: "card" })}
      />
      <RadioCard
        variant="large"
        title="Pix na maquininha"
        sub="O QR aparece na tela da maquininha."
        checked={method === "pix"}
        onSelect={() => dispatch({ type: "set-method", method: "pix" })}
      />
    </div>
  );
}

function terminalLabel(terminals: readonly EventTerminal[], terminalId: string): string {
  return terminals.find((terminal) => terminal.id === terminalId)?.label ?? "";
}

/**
 * Tela 04: forma de pagamento e cobrança na maquininha, acompanhada a cada 2 s.
 *
 * O mesmo atendimento usa sempre a mesma chave, então dois toques em "Cobrar" não geram duas
 * cobranças. Valor mudado no servidor é mostrado antes de cobrar de novo; estoque que acabou volta
 * para a loja com a chave descartada. O acompanhamento faz uma consulta por vez e ignora a resposta
 * que chega depois de o estado da cobrança mudar (cancelamento, abandono). Com mais de uma
 * maquininha no evento, o operador escolhe em qual cobrar; a cadastrada é a padrão.
 */
export function PaymentScreen({ context, state, dispatch }: Readonly<PaymentScreenProps>) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualError, setManualError] = useState("");
  const charging = useRef(false);
  const [terminalId, chooseTerminal] = useTerminalChoice(context.terminals);
  const manyTerminals = context.terminals.length > 1;
  const { order, quote, buyer, registered } = state;
  const orderId = order?.orderId ?? 0;
  const orderState = order?.state ?? "";

  useEffect(() => {
    if (!orderId || !POLL_STATES.has(orderState)) return undefined;
    let active = true;
    let timer = 0;
    const poll = async () => {
      const result = await expocannabisClient.orderStatus(orderId);
      if (!active) return;
      if (result.ok) dispatch({ type: "set-order", order: result.data });
      timer = window.setTimeout(poll, POLL_MS);
    };
    timer = window.setTimeout(poll, POLL_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [orderId, orderState, dispatch]);

  useEffect(() => {
    if (orderState === "paid") dispatch({ type: "go", screen: 5 });
  }, [orderState, dispatch]);

  if (!quote || !buyer || !registered) return null;

  const run = async (action: () => Promise<ClientResult<EventOrderStatus>>) => {
    if (charging.current) return;
    charging.current = true;
    setBusy(true);
    setNotice("");
    const result = await action();
    charging.current = false;
    setBusy(false);
    if (result.ok) dispatch({ type: "set-order", order: result.data });
    else setNotice(failureNotice(result, dispatch));
  };

  const charge = () =>
    run(() => {
      const checkoutAttemptId = state.checkoutAttemptId ?? crypto.randomUUID();
      if (!state.checkoutAttemptId) dispatch({ type: "set-checkout-id", id: checkoutAttemptId });
      return expocannabisClient.createOrder({
        checkoutAttemptId,
        companyId: registered.companyId,
        buyerUserId: registered.buyerUserId,
        items: quoteItems(state.qty),
        kits: state.kits,
        delivery: {
          cep: state.delivery.cep,
          street: state.delivery.street,
          number: state.delivery.number,
          complement: state.delivery.complement,
          neighborhood: state.delivery.neighborhood,
          city: state.delivery.city,
          state: state.delivery.state,
        },
        quoteFingerprint: quote.quoteFingerprint,
        method: state.method,
        terminalId,
      });
    });

  const abandon = async () => {
    const result = await expocannabisClient.abandon(orderId);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    dispatch({ type: "clear-charge" });
    dispatch({ type: "go", screen: 2 });
  };

  const manualConfirm = async (input: ManualConfirmInput) => {
    setManualError("");
    const result = await expocannabisClient.manualConfirm(orderId, input);
    if (!result.ok) {
      setManualError(result.message);
      return;
    }
    setManualOpen(false);
    dispatch({ type: "set-order", order: result.data });
  };

  const total = formatCents(quote.totalCents);
  const choosing = order === null || ["failed", "expired", "canceled"].includes(order.state);
  const noChargeAttempted = order === null && !busy && state.checkoutAttemptId === null;
  const back = noChargeAttempted ? { label: "Voltar aos dados", onBack: () => dispatch({ type: "go", screen: 3 }) } : undefined;

  const footer = order ? (
    <>
      {notice ? <WarnBox>{notice}</WarnBox> : null}
      <TerminalActions
        status={order}
        canSupervise={context.operator.canSupervise}
        busy={busy}
        onCancel={() => run(() => expocannabisClient.cancel(orderId))}
        onRetry={() => run(() => expocannabisClient.retry(orderId, state.method, terminalId))}
        onAbandon={abandon}
        onManual={() => setManualOpen(true)}
      />
    </>
  ) : (
    <>
      {notice ? <WarnBox>{notice}</WarnBox> : null}
      <CheckoutCta onClick={charge} disabled={busy}>
        {`Cobrar ${total} na maquininha`}
      </CheckoutCta>
    </>
  );

  return (
    <>
      <CheckoutLayout
        current={2}
        spacing="payment"
        back={back}
        title="Como o lojista vai pagar?"
        intro={<TotalLine total={total} />}
        aside={
          <StickyAside landscapeOnly>
            <OrderSummary context={context} state={state} />
          </StickyAside>
        }
        footer={footer}
      >
        {choosing ? <PaymentMethods method={state.method} total={total} dispatch={dispatch} /> : null}
        {choosing && manyTerminals ? <TerminalPicker terminals={context.terminals} value={terminalId} onChange={chooseTerminal} /> : null}
        {order && manyTerminals ? <p className="text-base font-bold">{`Cobrando na ${terminalLabel(context.terminals, terminalId)}`}</p> : null}
        {order ? <TerminalStatus status={order} /> : null}
      </CheckoutLayout>
      {manualOpen ? (
        <ManualConfirmDialog open defaultMethod={state.method} error={manualError} busy={false} onSubmit={manualConfirm} onClose={() => setManualOpen(false)} />
      ) : null}
    </>
  );
}
