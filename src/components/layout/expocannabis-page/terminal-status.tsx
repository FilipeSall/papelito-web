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

const BUTTON = "min-h-15 rounded-lg px-4 text-lg font-extrabold transition-transform duration-120 enabled:active:scale-98 disabled:opacity-60 motion-reduce:transition-none";
const SECONDARY = `${BUTTON} bg-[#F4F4F5]`;
const PRIMARY = `${BUTTON} bg-[#231F20] text-brand-yellow`;
const PANEL = "expo-panel-in grid gap-2 rounded-[10px] bg-[#F4F4F5] p-5";
const DETAIL = "text-[15px] leading-[1.45] font-medium text-[#52525B]";

function Waiting({ children }: Readonly<{ children: string }>) {
  return (
    <p className="flex items-center gap-2 text-[15px] font-bold">
      <i aria-hidden className="expo-blink size-2.5 rounded-xs bg-[#231F20]" />
      {children}
    </p>
  );
}

/** Painel cinza da cobrança na maquininha para cada estado da order; as ações ficam em `TerminalActions`. */
export function TerminalStatus({ status }: Readonly<TerminalStatusProps>) {
  if (status.state === "sending") {
    return (
      <div role="status" className={PANEL}>
        <p className="text-xl font-extrabold">Mandando pra maquininha…</p>
        <div aria-hidden className="expo-skeleton h-16 rounded-lg" />
      </div>
    );
  }

  if (status.state === "at_terminal") {
    return (
      <div role="status" className={PANEL}>
        <p className="text-xl font-extrabold">Passe o cartão ou leia o Pix na maquininha</p>
        <p className={DETAIL}>A confirmação aparece aqui sozinha.</p>
        <Waiting>Aguardando a maquininha</Waiting>
      </div>
    );
  }

  if (status.state === "check_terminal") {
    return (
      <div role="status" className={PANEL}>
        <p className="text-xl font-extrabold">Confira na maquininha</p>
        <p className={DETAIL}>Não recebemos a resposta da maquininha. Se ela aprovou, o supervisor libera o pedido.</p>
      </div>
    );
  }

  return (
    <div role="alert" className={PANEL}>
      <p className="text-xl font-extrabold text-[#B42318]">{failureText(status)}</p>
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

  return (
    <div className="grid gap-3 min-[768px]:grid-cols-2">
      <button type="button" className={PRIMARY} disabled={busy} onClick={onRetry}>
        Tentar de novo
      </button>
      <button type="button" className={SECONDARY} disabled={busy} onClick={onAbandon}>
        Voltar ao pedido
      </button>
    </div>
  );
}
