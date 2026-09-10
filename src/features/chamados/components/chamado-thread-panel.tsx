"use client";

import { CircleCheckBig, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  hardQuietActionClass,
  hardSecondaryActionClass,
} from "@/components/ui/hard-actions";
import {
  FOCUS_RING,
  HardPanel,
  InlineAlert,
  StatusChip,
} from "@/components/layout/operational-panel";
import type { RichTextDocument } from "@/features/rich-text";
import { VendorOpenReturn } from "@/features/returns/components/vendor-open-return";

import { MESSAGE_POLL_INTERVAL_MS } from "../constants";
import {
  closeChamado,
  escalateChamado,
  fetchChamado,
  markChamadoRead,
  sendChamadoMessage,
} from "../services/chamado-client";
import type { Chamado, ChamadoMessage } from "../types/chamado";
import { chamadoDateLabel } from "../utils/chamado-date-label";
import { chamadoReasonLabel } from "../utils/chamado-reason";
import { chamadoStatusMeta } from "../utils/chamado-status";

import { ChamadoComposer } from "./chamado-composer";
import { ChamadoMessageList } from "./chamado-message-list";
import { ChamadoReturnStatus } from "./chamado-return-status";
import { ChamadoWhatsappAction } from "./chamado-whatsapp-action";

type Surface = "buyer" | "tool";

export function ChamadoThreadPanel({
  initialChamado,
  viewerName = "Você",
}: Readonly<{
  initialChamado: Chamado;
  surface?: Surface;
  viewerName?: string;
}>) {
  const router = useRouter();
  const threadId = initialChamado.threadId;
  const [notice, setNotice] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<ChamadoMessage | null>(
    null,
  );

  const { data, error, mutate } = useSWR(
    threadId ? `chamado:${threadId}` : null,
    () => fetchChamado(threadId),
    {
      fallbackData: initialChamado,
      refreshInterval: MESSAGE_POLL_INTERVAL_MS,
      revalidateOnFocus: true,
    },
  );

  const chamado = data ?? initialChamado;
  const latestMessageId =
    chamado.messages[chamado.messages.length - 1]?.id ?? 0;
  const seenRef = useRef(0);

  useEffect(() => {
    if (
      !threadId ||
      latestMessageId <= 0 ||
      seenRef.current === latestMessageId
    )
      return;

    seenRef.current = latestMessageId;
    let active = true;

    void markChamadoRead(threadId)
      .then((updated) => {
        if (active) void mutate(updated, false);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [latestMessageId, mutate, threadId]);

  const statusMeta = chamadoStatusMeta(chamado.status);
  const reasonLabel = chamadoReasonLabel(chamado.reason, chamado.reasonLabel);

  // A bolha otimista some assim que a mensagem real chega, reconciliada pelo texto e pelo autor —
  // um id temporário sobrevivendo a um ciclo de polling mostraria a mensagem duplicada.
  const messages = useMemo(() => {
    if (!pendingMessage) return chamado.messages;

    const landed = chamado.messages.some(
      (message) =>
        message.isMine && message.plainText === pendingMessage.plainText,
    );

    return landed ? chamado.messages : [...chamado.messages, pendingMessage];
  }, [chamado.messages, pendingMessage]);

  async function handleSubmit(message: {
    content: RichTextDocument;
    plainText: string;
  }) {
    if (isSending) return;

    setNotice(null);
    setIsSending(true);
    setPendingMessage({
      content: message.content,
      createdAt: new Date().toISOString(),
      id: -Date.now(),
      isMine: true,
      plainText: message.plainText,
      senderId:
        chamado.participants[
          chamado.viewerRole === "seller" ? "seller" : "customer"
        ].id,
      senderName: viewerName,
      senderRole: chamado.viewerRole,
    });

    try {
      const updated = await sendChamadoMessage(threadId, message);
      await mutate(updated, false);
      router.refresh();
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar a mensagem.",
      );
    } finally {
      setPendingMessage(null);
      setIsSending(false);
    }
  }

  async function handleEscalate() {
    if (isEscalating) return;

    setNotice(null);
    setIsEscalating(true);
    try {
      await mutate(await escalateChamado(threadId), false);
      router.refresh();
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Não foi possível acionar a Papelito.",
      );
    } finally {
      setIsEscalating(false);
    }
  }

  async function handleClose() {
    if (isClosing) return;

    setNotice(null);
    setIsClosing(true);
    try {
      await mutate(await closeChamado(threadId), false);
      setConfirmClose(false);
      router.refresh();
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Não foi possível encerrar o chamado.",
      );
    } finally {
      setIsClosing(false);
    }
  }

  const sellerWhatsapp = chamado.participants.seller.whatsappUrl;
  const showWhatsapp =
    chamado.viewerRole !== "seller" &&
    "whatsappUrl" in chamado.participants.seller;

  return (
    <HardPanel accent="black" className="overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#1a1a1a] px-5 py-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rotate-45 bg-brand-yellow"
            />
            Chamado #{chamado.threadId}
          </p>
          <h1 className="mt-1.5 text-lg font-black uppercase tracking-tight text-[#1a1a1a]">
            {reasonLabel}
          </h1>
          <p className="mt-1 text-xs font-semibold text-[#231f20]/64">
            {chamado.counterpartName} · aberto em{" "}
            {chamadoDateLabel(chamado.openedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {chamado.escalatedAt ? (
            <StatusChip
              compact
              icon={ShieldCheck}
              label="Papelito acompanhando"
              tone="positive"
            />
          ) : null}
          <StatusChip
            icon={statusMeta.icon}
            label={statusMeta.label}
            tone={statusMeta.tone}
          />
        </div>
      </header>

      <ChamadoReturnStatus
        returnRequest={chamado.returnRequest}
        role={chamado.viewerRole}
      />

      {chamado.capabilities.canStartReturn &&
      chamado.order &&
      chamado.returnReason ? (
        <VendorOpenReturn
          items={chamado.order.items
            .map((item) => ({
              itemId: Number(item.id),
              name: item.name,
              qty: item.quantity,
            }))
            .filter((item) => Number.isInteger(item.itemId) && item.itemId > 0)}
          orderId={chamado.order.id}
          reason={chamado.returnReason}
          reasonOther={chamado.reasonOther}
          threadId={chamado.threadId}
        />
      ) : null}

      {chamado.status === "encerrado" ? (
        <p className="border-b-2 border-[#1a1a1a]/10 bg-[#faf8f2] px-5 py-3 text-sm font-semibold leading-6 text-[#231f20]/70">
          Chamado encerrado
          {chamado.closedAt ? ` em ${chamadoDateLabel(chamado.closedAt)}` : ""}
          {chamado.closedByName ? ` por ${chamado.closedByName}` : ""}. Abra um
          novo chamado no pedido se ainda precisar de ajuda.
        </p>
      ) : null}

      <ChamadoMessageList errored={Boolean(error)} messages={messages} />

      {notice ? (
        <div className="border-t-2 border-[#1a1a1a]/10 px-5 py-3">
          <InlineAlert tone="critical">⚠ {notice}</InlineAlert>
        </div>
      ) : null}

      {chamado.capabilities.canReply ? (
        <ChamadoComposer onSubmit={handleSubmit} pending={isSending} />
      ) : null}

      <footer className="flex flex-wrap items-center gap-3 border-t-2 border-[#1a1a1a]/10 bg-[#faf8f2] px-5 py-4">
        {showWhatsapp ? (
          <ChamadoWhatsappAction
            storeLabel={chamado.participants.seller.name}
            whatsappUrl={sellerWhatsapp}
          />
        ) : null}

        {chamado.capabilities.canEscalate ? (
          <button
            className={`${hardQuietActionClass} ${FOCUS_RING}`}
            disabled={isEscalating}
            onClick={() => void handleEscalate()}
            type="button"
          >
            {isEscalating ? "Acionando…" : "Não resolveu? Acionar a Papelito"}
          </button>
        ) : null}

        {chamado.capabilities.canClose ? (
          <button
            className={`${hardSecondaryActionClass} ${FOCUS_RING} ml-auto`}
            disabled={isClosing}
            onClick={() => setConfirmClose(true)}
            type="button"
          >
            <CircleCheckBig aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            Encerrar chamado
          </button>
        ) : null}
      </footer>

      <ConfirmModal
        confirmLabel="Encerrar chamado"
        description="Depois de encerrado ninguém envia novas mensagens neste chamado. Se o assunto voltar, é preciso abrir um chamado novo no pedido."
        isSubmitting={isClosing}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => void handleClose()}
        open={confirmClose}
        title="Encerrar este chamado?"
      />
    </HardPanel>
  );
}
