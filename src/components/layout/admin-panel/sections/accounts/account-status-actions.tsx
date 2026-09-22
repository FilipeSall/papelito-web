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

type AccountStatusActionsProps = Readonly<{
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
}>;

type ActionMode = "reactivate" | "suspend";

type Feedback = { text: string; tone: "error" | "success" };

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

const SECTION_LABEL_CLASS =
  "text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/52";
const ACTION_BUTTON_CLASS =
  "inline-flex h-11 items-center gap-2 border-2 px-4 text-xs font-black uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-60";

function successMessage(mode: ActionMode, subjectLabel: string): string {
  if (mode === "suspend") {
    return `${subjectLabel} suspensa. As operações comerciais estão bloqueadas.`;
  }

  return `${subjectLabel} reativada.`;
}

function failureMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

function FeedbackMessage({ feedback }: Readonly<{ feedback: Feedback }>) {
  return (
    <output
      className={[
        "block border-2 px-4 py-3 text-sm font-semibold",
        feedback.tone === "success"
          ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]"
          : "border-[#c0392b] bg-[#c0392b]/10 text-[#7a3428]",
      ].join(" ")}
    >
      {feedback.text}
    </output>
  );
}

function SuspensionDetail({ suspension }: Readonly<{ suspension: AdminAccountSuspension }>) {
  return (
    <div className="max-w-xl space-y-1 text-sm leading-6 text-[#231f20]/72">
      <p className="font-semibold text-[#231f20]">{suspension.reason}</p>
      <p className="text-xs uppercase tracking-[0.12em] text-[#231f20]/56">
        {formatDateTime(suspension.at)}
        {suspension.actorName ? ` · por ${suspension.actorName}` : ""}
      </p>
    </div>
  );
}

function StatusActionButtons({
  canReactivate,
  canSuspend,
  disabled,
  isSuspended,
  onSelect,
  suspendBlockedReason,
}: Readonly<{
  canReactivate: boolean;
  canSuspend: boolean;
  disabled: boolean;
  isSuspended: boolean;
  onSelect: (mode: ActionMode) => void;
  suspendBlockedReason: string;
}>) {
  if (isSuspended) {
    if (!canReactivate) return null;

    return (
      <button
        className={[
          ACTION_BUTTON_CLASS,
          "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500] hover:shadow-[1px_1px_0px_#ffe500]",
          FOCUS_RING,
        ].join(" ")}
        disabled={disabled}
        onClick={() => onSelect("reactivate")}
        type="button"
      >
        <ShieldCheck className="h-4 w-4" strokeWidth={2} />
        Reativar
      </button>
    );
  }

  if (canSuspend) {
    return (
      <button
        className={[
          ACTION_BUTTON_CLASS,
          "border-[#c0392b] bg-[#c0392b] text-white hover:bg-[#a8322a]",
          FOCUS_RING,
        ].join(" ")}
        disabled={disabled}
        onClick={() => onSelect("suspend")}
        type="button"
      >
        <ShieldAlert className="h-4 w-4" strokeWidth={2} />
        Suspender
      </button>
    );
  }

  if (!suspendBlockedReason) return null;

  return (
    <p className="max-w-xs border-2 border-[#1a1a1a]/18 bg-[#faf8f2] px-3 py-2 text-xs leading-5 text-[#7a3428]">
      {suspendBlockedReason}
    </p>
  );
}

function StatusHistoryList({
  statusHistory,
}: Readonly<{ statusHistory: AdminAccountStatusEvent[] }>) {
  return (
    <div className="space-y-2">
      <p className={SECTION_LABEL_CLASS}>Histórico</p>
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
  );
}

function ConfirmationCopy({
  mode,
  subjectName,
}: Readonly<{ mode: ActionMode; subjectName: string }>) {
  if (mode === "suspend") {
    return (
      <p className="text-sm leading-6 text-[#231f20]/76" id="account-status-body">
        <span className="font-semibold text-[#231f20]">{subjectName}</span> deixa de comprar e de
        vender na plataforma. O acesso à conta continua funcionando, e a pessoa passa a ver o aviso
        de bloqueio comercial.
      </p>
    );
  }

  return (
    <p className="text-sm leading-6 text-[#231f20]/76" id="account-status-body">
      <span className="font-semibold text-[#231f20]">{subjectName}</span> volta a operar
      normalmente na plataforma.
    </p>
  );
}

function ConfirmationModal({
  canSubmit,
  mode,
  onClose,
  onReasonChange,
  onSubmit,
  reason,
  reasonRef,
  reasonTooShort,
  subjectLabel,
  subjectName,
  submitting,
  trimmedReason,
}: Readonly<{
  canSubmit: boolean;
  mode: ActionMode | null;
  onClose: () => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
  reason: string;
  reasonRef: React.RefObject<HTMLTextAreaElement | null>;
  reasonTooShort: boolean;
  subjectLabel: string;
  subjectName: string;
  submitting: boolean;
  trimmedReason: string;
}>) {
  const isSuspend = mode === "suspend";

  return (
    <BaseModal
      ariaDescribedBy="account-status-body"
      ariaLabelledBy="account-status-title"
      contentClassName="max-w-lg rounded-none border-2 border-[#1a1a1a] bg-white shadow-[8px_8px_0px_#1a1a1a]"
      initialFocusRef={reasonRef}
      onClose={onClose}
      open={mode !== null}
    >
      <div className="space-y-4 px-6 py-5">
        <div>
          <p className={SECTION_LABEL_CLASS}>{isSuspend ? "Ação destrutiva" : "Confirmação"}</p>
          <h3
            className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]"
            id="account-status-title"
          >
            {isSuspend ? "Suspender" : "Reativar"} {subjectLabel.toLowerCase()}
          </h3>
        </div>

        <ConfirmationCopy mode={isSuspend ? "suspend" : "reactivate"} subjectName={subjectName} />

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
            Justificativa {isSuspend ? "(obrigatória)" : "(opcional)"}
          </span>
          <textarea
            className={[
              "mt-2 min-h-28 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
              FOCUS_RING,
            ].join(" ")}
            maxLength={MAX_REASON_LENGTH}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder={
              isSuspend
                ? "Descreva o motivo. Fica registrado no histórico da conta."
                : "Opcional. Fica registrado no histórico da conta."
            }
            ref={reasonRef}
            value={reason}
          />
          <span className="mt-1 flex items-center justify-between text-xs text-[#231f20]/56">
            <span>
              {reasonTooShort && isSuspend ? "A justificativa precisa descrever o motivo." : ""}
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
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className={[
              "inline-flex h-11 items-center gap-2 border-2 px-5 text-xs font-black uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-60",
              isSuspend
                ? "border-[#c0392b] bg-[#c0392b] text-white hover:bg-[#a8322a]"
                : "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow",
              FOCUS_RING,
            ].join(" ")}
            disabled={!canSubmit}
            onClick={onSubmit}
            type="button"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
            {isSuspend ? "Confirmar suspensão" : "Confirmar reativação"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

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
  const [mode, setMode] = useState<ActionMode | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const endpoints: Record<ActionMode, string> = {
    reactivate: reactivateEndpoint,
    suspend: suspendEndpoint,
  };
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

  function openModal(next: ActionMode) {
    setMode(next);
    setFeedback(null);
  }

  async function handleSubmit() {
    if (!mode) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      await postJson(endpoints[mode], { reason: trimmedReason });

      setMode(null);
      setReason("");
      setFeedback({ text: successMessage(mode, subjectLabel), tone: "success" });
      startTransition(() => router.refresh());
    } catch (error) {
      setFeedback({ text: failureMessage(error), tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {feedback ? <FeedbackMessage feedback={feedback} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-4 border-2 border-[#1a1a1a] bg-white px-4 py-4">
        <div className="space-y-2">
          <p className={SECTION_LABEL_CLASS}>Situação da conta</p>
          <StatusChip
            icon={isSuspended ? Ban : CircleCheck}
            label={isSuspended ? "Suspensa" : "Ativa"}
            tone={isSuspended ? "critical" : "positive"}
          />
          {suspension ? (
            <SuspensionDetail suspension={suspension} />
          ) : (
            <p className="max-w-xl text-sm leading-6 text-[#231f20]/68">
              Compra, venda e demais operações comerciais liberadas.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <StatusActionButtons
            canReactivate={canReactivate}
            canSuspend={canSuspend}
            disabled={submitting || isPending}
            isSuspended={isSuspended}
            onSelect={openModal}
            suspendBlockedReason={suspendBlockedReason}
          />
        </div>
      </div>

      {statusHistory.length > 0 ? <StatusHistoryList statusHistory={statusHistory} /> : null}

      <ConfirmationModal
        canSubmit={canSubmit}
        mode={mode}
        onClose={closeModal}
        onReasonChange={setReason}
        onSubmit={() => void handleSubmit()}
        reason={reason}
        reasonRef={reasonRef}
        reasonTooShort={reasonTooShort}
        subjectLabel={subjectLabel}
        subjectName={subjectName}
        submitting={submitting}
        trimmedReason={trimmedReason}
      />
    </div>
  );
}
