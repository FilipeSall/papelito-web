import { Store, User } from "lucide-react";

import { StatusChip } from "@/components/layout/operational-panel";
import { projectRichTextForDisplay, RichText } from "@/features/rich-text";

import type { ChamadoMessage, ChamadoRole } from "../types/chamado";
import { chamadoDateLabel } from "../utils/chamado-date-label";

function roleLabel(role: ChamadoRole) {
  if (role === "administrator") return "Papelito";
  if (role === "seller") return "Vendor";
  return "Cliente";
}

/**
 * O amarelo aparece uma vez por tela na conversa, e é para a Papelito: significa que o
 * marketplace entrou no atendimento. Cliente e vendor se distinguem por avatar, posição e
 * ícone, não por cor.
 */
function roleChip(role: ChamadoRole) {
  if (role === "administrator") {
    return { icon: User, tone: "positive" as const };
  }

  return { icon: role === "seller" ? Store : User, tone: "neutral" as const };
}

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

  return (
    <article
      aria-busy={message.id < 0 ? true : undefined}
      className={`flex max-w-[92%] gap-3 sm:max-w-[84%] ${message.isMine ? "ml-auto flex-row-reverse" : ""} ${
        animate ? "animate-chamado-message" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        {showIdentity ? (
          <div
            className={`flex flex-wrap items-center gap-2 ${message.isMine ? "justify-end" : ""}`}
          >
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
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
          className={`mt-1.5 rounded-none border-2 px-4 py-3 ${
            message.isMine
              ? "border-[#1a1a1a] bg-[#1a1a1a] text-[#f5f1e8]"
              : "border-[#1a1a1a] bg-white text-[#1a1a1a]"
          } ${message.id < 0 ? "opacity-70" : ""}`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {nodes ? <RichText nodes={nodes} /> : message.plainText}
          </p>
        </div>

        <p
          className={`mt-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
            message.isMine ? "text-right" : ""
          } text-[#1a1a1a]/50`}
        >
          {message.id < 0 ? (
            "Enviando…"
          ) : (
            <time dateTime={message.createdAt}>
              {chamadoDateLabel(message.createdAt)}
            </time>
          )}
        </p>
      </div>
    </article>
  );
}
