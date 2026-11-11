import type { EventOrderStatus } from "@/features/expocannabis/types/order";

type TerminalStatusProps = {
  status: EventOrderStatus;
  canSupervise: boolean;
  busy: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onAbandon: () => void;
  onManual: () => void;
};

const FAILURE_TEXT: Record<string, string> = {
  terminal_busy: "Maquininha ocupada. Cancele a cobrança anterior ou espere 5 min.",
  canceled: "A cobrança foi cancelada.",
};

function failureText(status: EventOrderStatus): string {
  if (status.state === "expired") return "A cobrança expirou.";
  if (status.state === "canceled") return FAILURE_TEXT.canceled;
  return FAILURE_TEXT[status.detail] ?? "A cobrança não passou.";
}

const SECONDARY = "h-14 rounded-md border-2 border-[#231F20] bg-white px-4 text-base font-extrabold disabled:opacity-50";
const PRIMARY = "h-14 rounded-md bg-[#231F20] px-4 text-base font-extrabold text-brand-yellow disabled:opacity-50";

/** Painel da cobrança na maquininha para cada estado da order. */
export function TerminalStatus({ status, canSupervise, busy, onCancel, onRetry, onAbandon, onManual }: Readonly<TerminalStatusProps>) {
  if (status.state === "sending") {
    return (
      <div role="status" className="grid gap-3">
        <p className="text-xl font-extrabold">Mandando pra maquininha…</p>
        <div aria-hidden className="expo-skeleton h-24 rounded-md" />
      </div>
    );
  }

  if (status.state === "at_terminal") {
    return (
      <div role="status" className="grid gap-4">
        <p className="text-xl font-extrabold">Passe o cartão ou leia o Pix na maquininha</p>
        <p className="text-base text-[#52525B]">A confirmação aparece aqui sozinha.</p>
        <button type="button" className={SECONDARY} disabled={busy} onClick={onCancel}>
          Cancelar cobrança
        </button>
      </div>
    );
  }

  if (status.state === "check_terminal") {
    return (
      <div role="status" className="grid gap-4">
        <p className="text-xl font-extrabold">Confira na maquininha</p>
        <p className="text-base text-[#52525B]">Não recebemos a resposta da maquininha. Se ela aprovou, o supervisor libera o pedido.</p>
        {canSupervise ? (
          <button type="button" className={PRIMARY} onClick={onManual}>
            Liberar manualmente
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div role="alert" className="grid gap-4">
      <p className="text-xl font-extrabold text-[#B42318]">{failureText(status)}</p>
      <div className="grid gap-3 min-[768px]:grid-cols-2">
        <button type="button" className={PRIMARY} disabled={busy} onClick={onRetry}>
          Tentar de novo
        </button>
        <button type="button" className={SECONDARY} disabled={busy} onClick={onAbandon}>
          Voltar ao pedido
        </button>
      </div>
    </div>
  );
}
