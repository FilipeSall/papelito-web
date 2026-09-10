"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type RefObject } from "react";

import { BaseModal } from "@/components/ui/base-modal";
import { hardPrimaryActionClass, hardQuietActionClass } from "@/components/ui/hard-actions";
import { fetchChamadoReasons } from "@/features/chamados/services/chamado-client";
import type { ChamadoReasonOption } from "@/features/chamados/types/chamado";

import { profileFieldLabelClass, profileInputClass } from "./profile-panel";

export type ReturnReasonChoice = { reason: string; reasonOther: string };

/**
 * Motivo da devolução, antes de existir chamado.
 *
 * O clique em "Solicitar devolução" não cria mais nada: primeiro o comprador escolhe o motivo, e
 * o chamado nasce já com ele. Os motivos vêm do backend em vez de serem repetidos aqui, porque o
 * vocabulário é do PHP — foi assim que a lista de motivos já divergiu uma vez.
 */
export function ReturnReasonModal({
  isSubmitting = false,
  onClose,
  onConfirm,
  open,
}: Readonly<{
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (choice: ReturnReasonChoice) => void;
  open: boolean;
}>) {
  const titleId = useId();
  const descriptionId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  return (
    <BaseModal
      ariaDescribedBy={descriptionId}
      ariaLabelledBy={titleId}
      contentClassName="max-w-lg"
      initialFocusRef={firstFieldRef}
      onClose={isSubmitting ? () => undefined : onClose}
      open={open}
    >
      {/* O formulário só existe enquanto o modal está aberto: fechar desmonta e o estado volta ao
          zero sozinho, sem efeito de reset. */}
      <ReturnReasonForm
        descriptionId={descriptionId}
        firstFieldRef={firstFieldRef}
        isSubmitting={isSubmitting}
        onClose={onClose}
        onConfirm={onConfirm}
        titleId={titleId}
      />
    </BaseModal>
  );
}

function ReturnReasonForm({
  descriptionId,
  firstFieldRef,
  isSubmitting,
  onClose,
  onConfirm,
  titleId,
}: Readonly<{
  descriptionId: string;
  firstFieldRef: RefObject<HTMLInputElement | null>;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (choice: ReturnReasonChoice) => void;
  titleId: string;
}>) {
  const [options, setOptions] = useState<ChamadoReasonOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonOther, setReasonOther] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let active = true;

    void fetchChamadoReasons()
      .then((catalog) => {
        if (active) setOptions(catalog.returnReasons);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selected = options.find((option) => option.value === reason);
  const needsDetail = selected?.requiresDetail === true;
  const missingReason = reason === "";
  const missingDetail = needsDetail && reasonOther.trim() === "";
  const canConfirm = !missingReason && !missingDetail && !isSubmitting;

  return (
    <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />

      <div className="px-6 py-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/56">
          Meus pedidos · Devolução
        </p>
        <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-[#1a1a1a]" id={titleId}>
          Por que você quer devolver?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#231f20]/70" id={descriptionId}>
          O motivo abre o chamado já explicado para a loja. Sem ele não dá para seguir.
        </p>

        {loadError ? (
          <p className="mt-4 border-2 border-[#c0392b] bg-white px-4 py-3 text-sm font-bold text-[#c0392b]">
            ⚠ Não foi possível carregar os motivos. Tente novamente.
          </p>
        ) : null}

        <fieldset className="mt-5">
          <legend className={profileFieldLabelClass}>Motivo *</legend>
          {isLoading ? (
            // Ícone mais texto: com `prefers-reduced-motion` o giro para, e a frase continua
            // dizendo o que está acontecendo.
            <p
              className="mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#231f20]/55"
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
          <div className="mt-2 space-y-2">
            {options.map((option, index) => (
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
                  name="return-reason"
                  onChange={() => {
                    setReason(option.value);
                    setTouched(true);
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

        {needsDetail ? (
          <div className="mt-4">
            <label className={profileFieldLabelClass} htmlFor="return-reason-other">
              Descreva o motivo *
            </label>
            <input
              aria-describedby={missingDetail && touched ? `${descriptionId}-erro` : undefined}
              aria-invalid={missingDetail && touched}
              className={`${profileInputClass} mt-2`}
              id="return-reason-other"
              onChange={(event) => setReasonOther(event.target.value)}
              placeholder="Ex: a caixa chegou aberta"
              value={reasonOther}
            />
          </div>
        ) : null}

        {touched && (missingReason || missingDetail) ? (
          <p className="mt-3 text-xs font-bold text-[#c0392b]" id={`${descriptionId}-erro`}>
            ⚠ {missingReason ? "Escolha um motivo para a devolução." : "Descreva o motivo."}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t-2 border-[#1a1a1a] px-6 py-4">
        <button
          className={hardQuietActionClass}
          disabled={isSubmitting}
          onClick={onClose}
          type="button"
        >
          Cancelar
        </button>
        <button
          className={hardPrimaryActionClass}
          disabled={!canConfirm || isLoading}
          onClick={() => {
            setTouched(true);
            if (canConfirm) onConfirm({ reason, reasonOther: reasonOther.trim() });
          }}
          type="button"
        >
          {isSubmitting ? "Abrindo chamado…" : "Abrir chamado"}
        </button>
      </div>
    </div>
  );
}
