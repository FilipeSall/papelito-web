import type { EventOrderStatus } from "@/features/expocannabis/types/order";

type TerminalStatusProps = {
  status: EventOrderStatus;
};

type TerminalActionsProps = {
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

const BUTTON = "min-h-15 px-4 text-[18px] font-extrabold disabled:opacity-60";
const SECONDARY = `${BUTTON} border border-expo-ink bg-white text-expo-ink`;
const PRIMARY = `${BUTTON} bg-expo-noite text-brand-yellow`;
const MANUAL_AFTER_FAILURE = new Set(["failed", "expired"]);
const PANEL = "expo-tela grid gap-2 bg-expo-kraft p-5";
const DETAIL = "text-[15px] font-medium leading-[1.45] text-expo-mute";

function Waiting({ children }: Readonly<{ children: string }>) {
  return (
    <p className="flex items-center gap-2 text-[15px] font-bold">
      <i aria-hidden className="expo-blink size-2.5 bg-expo-ink" />
      {children}
    </p>
  );
}

/** Painel cinza da cobrança na maquininha para cada estado da order; as ações ficam em `TerminalActions`. */
export function TerminalStatus({ status }: Readonly<TerminalStatusProps>) {
  if (status.state === "sending") {
    return (
      <div role="status" className={PANEL}>
        <p className="ultra text-[22px] leading-7">Mandando pra maquininha…</p>
        <div aria-hidden className="expo-skeleton h-16" />
      </div>
    );
  }

  if (status.state === "at_terminal") {
    return (
      <div role="status" className={PANEL}>
        <p className="ultra text-[22px] leading-7">Passe o cartão ou leia o Pix na maquininha</p>
        <p className={DETAIL}>A confirmação aparece aqui sozinha.</p>
        <Waiting>Aguardando a maquininha</Waiting>
      </div>
    );
  }

  if (status.state === "check_terminal") {
    return (
      <div role="status" className={PANEL}>
        <p className="ultra text-[22px] leading-7">Confira na maquininha</p>
        <p className={DETAIL}>Não recebemos a resposta da maquininha. Se ela aprovou, o supervisor libera o pedido.</p>
      </div>
    );
  }

  return (
    <div role="alert" className={PANEL}>
      <p className="ultra text-[22px] leading-7 text-expo-erro">{failureText(status)}</p>
    </div>
  );
}

/** Botões da cobrança, para o rodapé fixo da tela; vazio nos estados sem ação possível. */
export function TerminalActions({ status, canSupervise, busy, onCancel, onRetry, onAbandon, onManual }: Readonly<TerminalActionsProps>) {
  if (status.state === "at_terminal") {
    return (
      <button type="button" className={`${SECONDARY} w-full`} disabled={busy} onClick={onCancel}>
        Cancelar cobrança
      </button>
    );
  }

  if (status.state === "check_terminal") {
    if (!canSupervise) return null;
    return (
      <button type="button" className={`${PRIMARY} w-full`} onClick={onManual}>
        Liberar manualmente
      </button>
    );
  }

  if (status.state === "sending") return null;

  const manual = canSupervise && MANUAL_AFTER_FAILURE.has(status.state);

  return (
    <div className="grid gap-3 min-[768px]:grid-cols-2">
      <button type="button" className={PRIMARY} disabled={busy} onClick={onRetry}>
        Tentar de novo
      </button>
      <button type="button" className={SECONDARY} disabled={busy} onClick={onAbandon}>
        Voltar ao pedido
      </button>
      {manual ? (
        <button type="button" className={`${SECONDARY} min-[768px]:col-span-2`} disabled={busy} onClick={onManual}>
          A maquininha aprovou? Liberar manualmente
        </button>
      ) : null}
    </div>
  );
}
