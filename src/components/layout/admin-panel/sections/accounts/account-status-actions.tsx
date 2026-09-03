"use client";

import { Ban, CircleCheck, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { BaseModal } from "@/components/ui/base-modal";
import { postJson } from "@/lib/client/post-json";
import type { AdminAccountStatusEvent, AdminAccountSuspension } from "@/lib/server/admin-users";

import { FOCUS_RING } from "../../primitives";

import { formatDateTime } from "./accounts-config";
import { StatusChip } from "./status-chip";

type AccountStatusActionsProps = {
  accountStatus: string;
  canReactivate: boolean;
  canSuspend: boolean;
  statusHistory: AdminAccountStatusEvent[];
  subjectLabel: string;
  subjectName: string;
  suspendBlockedReason: string;
  suspendEndpoint: string;
  suspension: AdminAccountSuspension | null;
  reactivateEndpoint: string;
};

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

export function AccountStatusActions({
  accountStatus,
  canReactivate,
  canSuspend,
  statusHistory,
  subjectLabel,
  subjectName,
  suspendBlockedReason,
  suspendEndpoint,
  suspension,
  reactivateEndpoint,
}: AccountStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"reactivate" | "suspend" | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const isSuspended = accountStatus === "suspended";
  const trimmedReason = reason.trim();
  const reasonTooShort = trimmedReason.length > 0 && trimmedReason.length < MIN_REASON_LENGTH;
  const canSubmit =
    mode === "reactivate" || (trimmedReason.length >= MIN_REASON_LENGTH && !submitting);

  function closeModal() {
    if (submitting) return;
    setMode(null);
    setReason("");
  }

  async function handleSubmit() {
    if (!mode) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      await postJson(mode === "suspend" ? suspendEndpoint : reactivateEndpoint, {
        reason: trimmedReason,
      });

      setMode(null);
      setReason("");
      setFeedback({
        text:
          mode === "suspend"
            ? `${subjectLabel} suspensa. As operações comerciais estão bloqueadas.`
            : `${subjectLabel} reativada.`,
        tone: "success",
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Não foi possível concluir a ação.",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {feedback ? (
        <p
          className={[
            "border-2 px-4 py-3 text-sm font-semibold",
            feedback.tone === "success"
              ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]"
              : "border-[#c0392b] bg-[#c0392b]/10 text-[#7a3428]",
          ].join(" ")}
          role="status"
        >
          {feedback.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4 border-2 border-[#1a1a1a] bg-white px-4 py-4">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/52">
            Situação da conta
          </p>
          <StatusChip
            icon={isSuspended ? Ban : CircleCheck}
            label={isSuspended ? "Suspensa" : "Ativa"}
            tone={isSuspended ? "critical" : "positive"}
          />
          {suspension ? (
            <div className="max-w-xl space-y-1 text-sm leading-6 text-[#231f20]/72">
              <p className="font-semibold text-[#231f20]">{suspension.reason}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-[#231f20]/56">
                {formatDateTime(suspension.at)}
                {suspension.actorName ? ` · por ${suspension.actorName}` : ""}
              </p>
            </div>
          ) : (
            <p className="max-w-xl text-sm leading-6 text-[#231f20]/68">
              Compra, venda e demais operações comerciais liberadas.
            </p>
          )}
        </div>

        <div className="space-y-2">
          {isSuspended && canReactivate ? (
            <button
              className={[
                "inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] disabled:cursor-not-allowed disabled:opacity-60",
                FOCUS_RING,
              ].join(" ")}
              disabled={submitting || isPending}
              onClick={() => {
                setMode("reactivate");
                setFeedback(null);
              }}
              type="button"
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              Reativar
            </button>
          ) : null}

          {!isSuspended && canSuspend ? (
            <button
              className={[
                "inline-flex h-11 items-center gap-2 border-2 border-[#c0392b] bg-[#c0392b] px-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#a8322a] disabled:cursor-not-allowed disabled:opacity-60",
                FOCUS_RING,
              ].join(" ")}
              disabled={submitting || isPending}
              onClick={() => {
                setMode("suspend");
                setFeedback(null);
              }}
              type="button"
            >
              <ShieldAlert className="h-4 w-4" strokeWidth={2} />
              Suspender
            </button>
          ) : null}

          {!isSuspended && !canSuspend && suspendBlockedReason ? (
            <p className="max-w-xs border-2 border-[#1a1a1a]/18 bg-[#faf8f2] px-3 py-2 text-xs leading-5 text-[#7a3428]">
              {suspendBlockedReason}
            </p>
          ) : null}
        </div>
      </div>

      {statusHistory.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/52">
            Histórico
          </p>
          <ol className="space-y-2">
            {statusHistory.map((event, index) => (
              <li
                className="border-l-2 border-[#1a1a1a] bg-[#faf8f2] px-4 py-3"
                key={`${event.createdAt}-${index}`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
                  {event.action === "suspend" ? "Suspensão" : "Reativação"}
                  <span className="ml-2 font-semibold tracking-[0.12em] text-[#231f20]/56">
                    {formatDateTime(event.createdAt)}
                  </span>
                </p>
                {event.reason ? (
                  <p className="mt-1 text-sm leading-6 text-[#231f20]/76">{event.reason}</p>
                ) : null}
                {event.actorName ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#231f20]/50">
                    por {event.actorName}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <BaseModal
        ariaDescribedBy="account-status-body"
        ariaLabelledBy="account-status-title"
        contentClassName="max-w-lg rounded-none border-2 border-[#1a1a1a] bg-white shadow-[8px_8px_0px_#1a1a1a]"
        initialFocusRef={reasonRef}
        onClose={closeModal}
        open={mode !== null}
      >
        <div className="space-y-4 px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/52">
              {mode === "suspend" ? "Ação destrutiva" : "Confirmação"}
            </p>
            <h3 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]" id="account-status-title">
              {mode === "suspend" ? `Suspender ${subjectLabel.toLowerCase()}` : `Reativar ${subjectLabel.toLowerCase()}`}
            </h3>
          </div>

          <p className="text-sm leading-6 text-[#231f20]/76" id="account-status-body">
            {mode === "suspend" ? (
              <>
                <span className="font-semibold text-[#231f20]">{subjectName}</span> deixa de comprar
                e de vender na plataforma. O acesso à conta continua funcionando, e a pessoa passa a
                ver o aviso de bloqueio comercial.
              </>
            ) : (
              <>
                <span className="font-semibold text-[#231f20]">{subjectName}</span> volta a operar
                normalmente na plataforma.
              </>
            )}
          </p>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
              Justificativa {mode === "suspend" ? "(obrigatória)" : "(opcional)"}
            </span>
            <textarea
              className={[
                "mt-2 min-h-28 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
                FOCUS_RING,
              ].join(" ")}
              maxLength={MAX_REASON_LENGTH}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                mode === "suspend"
                  ? "Descreva o motivo. Fica registrado no histórico da conta."
                  : "Opcional. Fica registrado no histórico da conta."
              }
              ref={reasonRef}
              value={reason}
            />
            <span className="mt-1 flex items-center justify-between text-xs text-[#231f20]/56">
              <span>
                {reasonTooShort && mode === "suspend"
                  ? "A justificativa precisa descrever o motivo."
                  : ""}
              </span>
              <span>
                {trimmedReason.length}/{MAX_REASON_LENGTH}
              </span>
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 border-t-2 border-[#1a1a1a]/12 pt-4">
            <button
              className={[
                "inline-flex h-11 items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-60",
                FOCUS_RING,
              ].join(" ")}
              disabled={submitting}
              onClick={closeModal}
              type="button"
            >
              Cancelar
            </button>
            <button
              className={[
                "inline-flex h-11 items-center gap-2 border-2 px-5 text-xs font-black uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-60",
                mode === "suspend"
                  ? "border-[#c0392b] bg-[#c0392b] text-white hover:bg-[#a8322a]"
                  : "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow",
                FOCUS_RING,
              ].join(" ")}
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
              type="button"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
              {mode === "suspend" ? "Confirmar suspensão" : "Confirmar reativação"}
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
