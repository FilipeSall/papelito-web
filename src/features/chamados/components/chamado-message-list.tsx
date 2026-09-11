"use client";

import { MessageSquareMore } from "lucide-react";
import { useEffect, useRef } from "react";

import { InlineAlert } from "@/components/layout/operational-panel";

import type { ChamadoMessage } from "../types/chamado";

import { ChamadoMessageBubble } from "./chamado-message-bubble";

const SURFACE =
  "max-h-[26rem] min-h-64 overflow-y-auto bg-[#f7f2e7] px-4 py-5 md:px-5";

export function ChamadoMessageList({
  errored = false,
  messages,
}: Readonly<{ errored?: boolean; messages: ChamadoMessage[] }>) {
  const listRef = useRef<HTMLDivElement>(null);
  // Só anima o que chega depois da montagem: sem isso as N mensagens animam no primeiro paint e
  // reanimam a cada ciclo de polling.
  const initialIdsRef = useRef<Set<number> | null>(null);
  initialIdsRef.current ??= new Set(messages.map((message) => message.id));

  const lastId = messages[messages.length - 1]?.id ?? 0;

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastId]);

  if (errored) {
    return (
      <div className={SURFACE}>
        <InlineAlert tone="critical">
          ⚠ Não foi possível atualizar a conversa.
        </InlineAlert>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={SURFACE}>
        <div className="flex min-h-52 flex-col items-center justify-center border-2 border-dashed border-[#1a1a1a] bg-[#faf8f2] px-6 py-10 text-center">
          <MessageSquareMore
            aria-hidden
            className="h-8 w-8 text-[#1a1a1a]/35"
            strokeWidth={2.4}
          />
          <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
            Nenhuma mensagem ainda
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#231f20]/64">
            Descreva o que aconteceu com o pedido para o vendor responder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={SURFACE} ref={listRef}>
      <ol className="space-y-1.5">
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          // Nome e crachá só na primeira mensagem de cada bloco do mesmo falante. O papel entra
          // na conta porque é ele que decide o lado: um balão que troca de lado precisa dizer de
          // quem é, mesmo quando o id do remetente não mudou.
          const startsRun =
            !previous ||
            previous.senderId !== message.senderId ||
            previous.senderRole !== message.senderRole;

          return (
            <li
              className={startsRun && index > 0 ? "pt-3.5" : ""}
              key={message.id}
            >
              <ChamadoMessageBubble
                animate={!initialIdsRef.current?.has(message.id)}
                message={message}
                showIdentity={startsRun}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
