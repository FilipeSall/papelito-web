"use client";

import { useAttendance } from "@/features/expocannabis/hooks/use-attendance";
import type { EventContext } from "@/features/expocannabis/types/context";

import { ExpoHeader } from "./expo-header";
import { IdleDialog } from "./idle-dialog";
import { OfflineBanner } from "./offline-banner";

type ExpocannabisAppProps = {
  context: EventContext;
};

/** App do tablet: cabeçalho, faixa offline, aviso de inatividade e a tela do atendimento. */
export function ExpocannabisApp({ context }: Readonly<ExpocannabisAppProps>) {
  const attendance = useAttendance(context);
  const { state, dispatch } = attendance;
  const changeStore = state.screen === 2 ? () => dispatch({ type: "change-store" }) : undefined;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white text-[#231F20]">
      <OfflineBanner />
      <ExpoHeader buyer={state.screen === 1 ? null : state.buyer} onChangeStore={changeStore} />
      <main className="relative min-h-0 flex-1">{`Tela ${state.screen}`}</main>
      <IdleDialog open={attendance.idleWarning} onContinue={attendance.keepAlive} />
    </div>
  );
}
