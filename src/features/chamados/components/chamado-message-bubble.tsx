import { Store, User } from "lucide-react";

import { StatusChip } from "@/components/layout/operational-panel";
import { projectRichTextForDisplay, RichText } from "@/features/rich-text";

import type { ChamadoMessage, ChamadoRole } from "../types/chamado";
import { chamadoDateLabel } from "../utils/chamado-date-label";
import {
  chamadoMessageSide,
  type ChamadoMessageSide,
} from "../utils/chamado-message-side";

function roleLabel(role: ChamadoRole) {
  if (role === "administrator") return "Papelito";
  if (role === "seller") return "Vendor";
  return "Cliente";
}

/**
 * O amarelo aparece uma vez por tela na conversa, e é para a Papelito: significa que o
 * marketplace entrou no atendimento. Cliente e vendor se distinguem por lado, preenchimento e
 * ícone, não por cor.
 */
function roleChip(role: ChamadoRole) {
  if (role === "administrator") {
    return { icon: User, tone: "positive" as const };
  }

  return { icon: role === "seller" ? Store : User, tone: "neutral" as const };
}

/**
 * Cada lado é um pacote fechado: alinhamento do bloco, do crachá e da data, preenchimento do
 * balão e o `bg-*` da cauda — que precisa ser o mesmo do balão para os dois contornos fecharem
 * numa silhueta só.
 */
const SIDE: Record<
  ChamadoMessageSide,
  {
    block: string;
    bubble: string;
    identity: string;
    stamp: string;
    tail: string;
  }
> = {
  left: {
    block: "mr-auto",
    bubble: "bg-white text-[#1a1a1a]",
    identity: "",
    stamp: "",
    tail: "chamado-tail-left bg-white",
  },
  right: {
    block: "ml-auto",
    bubble: "bg-[#1a1a1a] text-[#f5f1e8]",
    identity: "justify-end",
    stamp: "text-right",
    tail: "chamado-tail-right bg-[#1a1a1a]",
  },
};

export function ChamadoMessageBubble({
  animate = false,
  message,
  showIdentity = true,
}: Readonly<{
  animate?: boolean;
  message: ChamadoMessage;
  showIdentity?: boolean;
}>) {
  const nodes = message.content
    ? projectRichTextForDisplay(message.content)
    : null;
  const chip = roleChip(message.senderRole);
  const side = SIDE[chamadoMessageSide(message.senderRole)];

  return (
    <article
      aria-busy={message.id < 0 ? true : undefined}
      className={`w-fit max-w-[86%] min-w-0 sm:max-w-[78%] ${side.block} ${
        animate ? "animate-chamado-message" : ""
      }`}
    >
      {showIdentity ? (
        <div
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${side.identity}`}
        >
          <span className="min-w-0 wrap-break-word text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
            {message.senderName}
          </span>
          <StatusChip
            compact
            icon={chip.icon}
            label={roleLabel(message.senderRole)}
            tone={chip.tone}
          />
        </div>
      ) : null}

      <div
        className={`relative mt-3 rounded-none border-2 border-[#1a1a1a] px-4 py-3 ${side.bubble} ${
          message.id < 0 ? "opacity-70" : ""
        }`}
      >
        <span aria-hidden className={`chamado-tail ${side.tail}`} />
        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
          {nodes ? <RichText nodes={nodes} /> : message.plainText}
        </p>
      </div>

      <p
        className={`mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1a1a1a]/50 ${side.stamp}`}
      >
        {message.id < 0 ? (
          "Enviando…"
        ) : (
          <time dateTime={message.createdAt}>
            {chamadoDateLabel(message.createdAt)}
          </time>
        )}
      </p>
    </article>
  );
}
