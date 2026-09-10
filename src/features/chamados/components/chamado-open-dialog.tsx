"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type RefObject } from "react";

import { BaseModal } from "@/components/ui/base-modal";
import { hardQuietActionClass } from "@/components/ui/hard-actions";
import type { RichTextDocument } from "@/features/rich-text";

import {
  ChamadoAlreadyOpenError,
  createChamado,
  fetchChamadoReasons,
} from "../services/chamado-client";
import type { ChamadoReasonOption, ChamadoRole } from "../types/chamado";

import { ChamadoComposer } from "./chamado-composer";

const FIELD_LABEL = "block text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]";
const FIELD_INPUT =
  "h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm font-semibold text-[#1a1a1a] placeholder:font-medium placeholder:text-[#1a1a1a]/45 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-yellow";

function chamadoHref(role: ChamadoRole, threadId: number) {
  return role === "seller" ? `/vendor/chamados/${threadId}` : `/perfil/chamados/${threadId}`;
}

/**
 * Abertura de chamado a partir de um pedido.
 *
 * Existe porque devolução não é o único assunto: atraso, pagamento, produto errado e dúvida
 * também precisam de porta. O motivo é escolhido antes do chamado existir, como na devolução —
 * um chamado sem motivo é o que este trabalho veio corrigir.
 */
export function ChamadoOpenDialog({
  label = "Abrir chamado",
  orderId,
  role,
  triggerClassName,
}: Readonly<{
  label?: string;
  orderId: number;
  role: ChamadoRole;
  triggerClassName: string;
}>) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)} type="button">
        {label}
      </button>

      <BaseModal
        ariaDescribedBy={descriptionId}
        ariaLabelledBy={titleId}
        contentClassName="max-w-xl"
        initialFocusRef={firstFieldRef}
        onClose={() => setOpen(false)}
        open={open}
      >
        <ChamadoOpenForm
          descriptionId={descriptionId}
          firstFieldRef={firstFieldRef}
          onClose={() => setOpen(false)}
          orderId={orderId}
          role={role}
          titleId={titleId}
        />
      </BaseModal>
    </>
  );
}

function ChamadoOpenForm({
  descriptionId,
  firstFieldRef,
  onClose,
  orderId,
  role,
  titleId,
}: Readonly<{
  descriptionId: string;
  firstFieldRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  orderId: number;
  role: ChamadoRole;
  titleId: string;
}>) {
  const router = useRouter();
  const [reasons, setReasons] = useState<ChamadoReasonOption[]>([]);
  const [returnReasons, setReturnReasons] = useState<ChamadoReasonOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [reasonOther, setReasonOther] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    void fetchChamadoReasons()
      .then((catalog) => {
        if (!active) return;
        setReasons(catalog.reasons);
        setReturnReasons(catalog.returnReasons);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os motivos. Tente novamente.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selected = reasons.find((option) => option.value === reason);
  const needsReturnReason = selected?.requiresReturnReason === true;
  const needsDetail =
    selected?.requiresDetail === true ||
    (needsReturnReason && returnReasons.find((o) => o.value === returnReason)?.requiresDetail === true);

  const missing =
    reason === "" ||
    (needsReturnReason && returnReason === "") ||
    (needsDetail && reasonOther.trim() === "");

  async function submit(message: { content: RichTextDocument; plainText: string }) {
    if (missing || isSubmitting) {
      setError("Escolha um motivo antes de abrir o chamado.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const chamado = await createChamado({
        content: message.content,
        orderId,
        plainText: message.plainText,
        reason,
        reasonOther: reasonOther.trim(),
        returnReason: needsReturnReason ? returnReason : undefined,
      });

      router.push(chamadoHref(role, chamado.threadId));
      router.refresh();
    } catch (cause) {
      // O backend recusa um segundo chamado aberto com o mesmo motivo e devolve qual é — levar
      // até ele é mais útil que repetir a recusa.
      const existingId = cause instanceof ChamadoAlreadyOpenError ? cause.threadId : 0;

      if (existingId > 0) {
        router.push(chamadoHref(role, existingId));
        return;
      }

      setError(cause instanceof Error ? cause.message : "Não foi possível abrir o chamado.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-h-[85vh] overflow-y-auto border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />

      <div className="px-6 pt-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/56">
          Pedido #{orderId}
        </p>
        <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-[#1a1a1a]" id={titleId}>
          Abrir chamado
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#231f20]/70" id={descriptionId}>
          Escolha o assunto e descreva o que aconteceu. O contexto da compra vai junto.
        </p>

        {isLoading ? (
          <p
            className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#231f20]/55"
            role="status"
          >
            <Loader2
              aria-hidden
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              strokeWidth={2.4}
            />
            Carregando motivos…
          </p>
        ) : null}

        <fieldset className="mt-5">
          <legend className={FIELD_LABEL}>Assunto *</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {reasons.map((option, index) => (
              <label
                className={`flex cursor-pointer items-start gap-3 border-2 px-4 py-3 transition ${
                  reason === option.value
                    ? "border-[#1a1a1a] bg-brand-yellow"
                    : "border-[#1a1a1a]/25 bg-white hover:border-[#1a1a1a]"
                }`}
                key={option.value}
              >
                <input
                  checked={reason === option.value}
                  className="mt-0.5 h-4 w-4 accent-[#1a1a1a]"
                  name="chamado-reason"
                  onChange={() => {
                    setReason(option.value);
                    setReturnReason("");
                    setError("");
                  }}
                  ref={index === 0 ? firstFieldRef : undefined}
                  type="radio"
                  value={option.value}
                />
                <span className="text-sm font-semibold text-[#1a1a1a]">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {needsReturnReason ? (
          <fieldset className="mt-4">
            <legend className={FIELD_LABEL}>Motivo da devolução *</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {returnReasons.map((option) => (
                <label
                  className={`flex cursor-pointer items-start gap-3 border-2 px-4 py-3 transition ${
                    returnReason === option.value
                      ? "border-[#1a1a1a] bg-brand-yellow"
                      : "border-[#1a1a1a]/25 bg-white hover:border-[#1a1a1a]"
                  }`}
                  key={option.value}
                >
                  <input
                    checked={returnReason === option.value}
                    className="mt-0.5 h-4 w-4 accent-[#1a1a1a]"
                    name="chamado-return-reason"
                    onChange={() => setReturnReason(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span className="text-sm font-semibold text-[#1a1a1a]">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {needsDetail ? (
          <div className="mt-4">
            <label className={FIELD_LABEL} htmlFor="chamado-reason-other">
              Descreva o assunto *
            </label>
            <input
              className={`${FIELD_INPUT} mt-2`}
              id="chamado-reason-other"
              onChange={(event) => setReasonOther(event.target.value)}
              placeholder="Ex: a caixa chegou aberta"
              value={reasonOther}
            />
          </div>
        ) : null}

        {error ? <p className="mt-4 text-xs font-bold text-[#c0392b]">⚠ {error}</p> : null}
      </div>

      <div className="mt-5">
        <p className={`${FIELD_LABEL} px-6`}>Mensagem *</p>
        <ChamadoComposer
          disabled={missing}
          onSubmit={submit}
          pending={isSubmitting}
          pendingLabel="Abrindo…"
          submitLabel="Abrir chamado"
        />
      </div>

      <div className="flex justify-end border-t-2 border-[#1a1a1a] px-6 py-4">
        <button
          className={hardQuietActionClass}
          disabled={isSubmitting}
          onClick={onClose}
          type="button"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
