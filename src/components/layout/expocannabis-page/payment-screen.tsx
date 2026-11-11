"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";

import { expocannabisClient, type ClientResult } from "@/features/expocannabis/client/expocannabis-client";
import type { AttendanceAction, AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import type { EventContext } from "@/features/expocannabis/types/context";
import type { EventOrderStatus, ManualConfirmInput } from "@/features/expocannabis/types/order";
import { formatCents } from "@/features/expocannabis/utils/cart";
import { parseQuote } from "@/features/expocannabis/utils/parse-quote";

import { CheckoutStepper } from "./checkout-stepper";
import { ManualConfirmDialog } from "./manual-confirm-dialog";
import { OrderSummary } from "./order-summary";
import { RadioCard } from "./radio-card";
import { TerminalStatus } from "./terminal-status";

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

function quoteChangedNotice(result: ClientResult<EventOrderStatus>, dispatch: Dispatch<AttendanceAction>): string {
  if (result.ok) return "";
  const quote = result.code === "papelito_event_quote_changed" ? parseQuote(result.data?.quote) : null;
  if (!quote) return result.message;
  dispatch({ type: "set-quote", quote });
  return `O valor mudou: agora é ${formatCents(quote.totalCents)}. Confere com o lojista e cobra de novo.`;
}

/**
 * Tela 04: forma de pagamento e cobrança na maquininha, acompanhada a cada 2 s.
 *
 * O mesmo atendimento usa sempre a mesma chave, então dois toques em "Cobrar" não geram duas
 * cobranças. Valor mudado no servidor é mostrado antes de cobrar de novo.
 */
export function PaymentScreen({ context, state, dispatch }: Readonly<PaymentScreenProps>) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualError, setManualError] = useState("");
  const charging = useRef(false);
  const { order, quote, buyer, registered } = state;
  const orderId = order?.orderId ?? 0;
  const orderState = order?.state ?? "";

  useEffect(() => {
    if (!orderId || !POLL_STATES.has(orderState)) return undefined;
    const timer = window.setInterval(async () => {
      const result = await expocannabisClient.orderStatus(orderId);
      if (result.ok) dispatch({ type: "set-order", order: result.data });
    }, POLL_MS);
    return () => window.clearInterval(timer);
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
    else setNotice(quoteChangedNotice(result, dispatch));
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

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <CheckoutStepper current={2} />
        <h1 className="mt-4 text-[30px] font-extrabold">Pagamento</h1>
        <div className="mt-4 grid gap-6 min-[1024px]:grid-cols-[1fr_360px]">
          <div className="grid content-start gap-6">
            {choosing ? (
              <div role="radiogroup" aria-label="Forma de pagamento" className="grid gap-3">
                <RadioCard
                  title="Cartão na maquininha"
                  sub={`Passe ${total} no crédito ou no débito. As parcelas são escolhidas na máquina.`}
                  checked={state.method === "card"}
                  onSelect={() => dispatch({ type: "set-method", method: "card" })}
                />
                <RadioCard
                  title="Pix na maquininha"
                  sub="O QR aparece na tela da maquininha."
                  checked={state.method === "pix"}
                  onSelect={() => dispatch({ type: "set-method", method: "pix" })}
                />
              </div>
            ) : null}
            {order ? (
              <TerminalStatus
                status={order}
                canSupervise={context.operator.canSupervise}
                busy={busy}
                onCancel={() => run(() => expocannabisClient.cancel(orderId))}
                onRetry={() => run(() => expocannabisClient.retry(orderId, state.method))}
                onAbandon={abandon}
                onManual={() => setManualOpen(true)}
              />
            ) : null}
            {notice ? (
              <p role="alert" className="text-base font-bold text-[#B42318]">
                {notice}
              </p>
            ) : null}
          </div>
          <OrderSummary context={context} state={state} />
        </div>
      </div>
      {order === null ? (
        <div className="border-t-2 border-[#E4E4E7] px-8 py-4">
          <button type="button" onClick={charge} disabled={busy} className="h-[68px] w-full rounded-md bg-brand-yellow text-xl font-extrabold shadow-[0_5px_0_#231F20] disabled:opacity-60">
            {`Cobrar ${total} na maquininha`}
          </button>
        </div>
      ) : null}
      {manualOpen ? (
        <ManualConfirmDialog open defaultMethod={state.method} error={manualError} busy={false} onSubmit={manualConfirm} onClose={() => setManualOpen(false)} />
      ) : null}
    </div>
  );
}
