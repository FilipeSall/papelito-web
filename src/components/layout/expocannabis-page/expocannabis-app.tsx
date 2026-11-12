"use client";

import { useSyncExternalStore } from "react";

import { useAttendance } from "@/features/expocannabis/hooks/use-attendance";
import type { EventContext } from "@/features/expocannabis/types/context";
import type { BuyerLookup } from "@/features/expocannabis/types/order";

import { CnpjScreen } from "./cnpj-screen";
import { ConfirmedScreen } from "./confirmed-screen";
import { DetailsScreen } from "./details-screen";
import { StoreScreen } from "./store-screen";

import { ExpoHeader } from "./expo-header";
import { IdleDialog } from "./idle-dialog";
import { OfflineBanner } from "./offline-banner";
import { PaymentScreen } from "./payment-screen";

function subscribeNothing(): () => void {
  return () => undefined;
}

function onClient(): boolean {
  return true;
}

function onServer(): boolean {
  return false;
}

type ExpocannabisAppProps = {
  context: EventContext;
};

/**
 * App do tablet: cabeçalho, faixa offline, aviso de inatividade e a tela do atendimento.
 *
 * O atendimento mora no aparelho, então nada dele é renderizado no servidor; a tela aparece
 * depois da hidratação, sem divergir do HTML inicial.
 */
export function ExpocannabisApp({ context }: Readonly<ExpocannabisAppProps>) {
  const attendance = useAttendance(context);
  const { state, dispatch } = attendance;
  const changeStore = state.screen === 2 ? () => dispatch({ type: "change-store" }) : undefined;
  const confirmBuyer = (buyer: BuyerLookup) => dispatch({ type: state.buyer ? "switch-buyer" : "start", buyer });
  const hydrated = useSyncExternalStore(subscribeNothing, onClient, onServer);

  if (!hydrated) {
    return <div aria-busy="true" className="h-dvh bg-white" />;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white text-[#231F20]">
      <OfflineBanner />
      <ExpoHeader buyer={state.screen === 1 ? null : state.buyer} onChangeStore={changeStore} />
      <main className="relative min-h-0 flex-1 overflow-y-auto">
        {state.screen === 1 ? <CnpjScreen onConfirm={confirmBuyer} /> : null}
        {state.screen === 2 ? (
          <StoreScreen context={context} state={state} dispatch={dispatch} onCheckout={() => dispatch({ type: "go", screen: 3 })} />
        ) : null}
        {state.screen === 3 ? <DetailsScreen context={context} state={state} dispatch={dispatch} /> : null}
        {state.screen === 4 ? <PaymentScreen context={context} state={state} dispatch={dispatch} /> : null}
        {state.screen === 5 ? <ConfirmedScreen state={state} onNewOrder={attendance.reset} /> : null}
      </main>
      <IdleDialog open={attendance.idleWarning} onContinue={attendance.keepAlive} />
    </div>
  );
}
