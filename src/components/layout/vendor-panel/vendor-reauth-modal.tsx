"use client";

import { useId, useState, useTransition } from "react";

import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";
import { BaseModal } from "@/components/ui/base-modal";
import { braspressErrorMessage } from "@/features/vendor-settings/utils/braspress-error-message";

/** Peso visual do diálogo: o destrutivo carrega a faixa vermelha e o confirmar vermelho. */
export type VendorReauthTone = "danger" | "default";

type VendorReauthModalProps = {
  /** Texto do botão que executa a ação depois da senha conferida. */
  confirmLabel: string;
  /** O que vai acontecer assim que a identidade for confirmada. */
  description: string;
  /** Trava o diálogo enquanto a ação do chamador ainda está em voo. */
  isSubmitting?: boolean;
  /** Fecha sem confirmar. Ignorado enquanto houver requisição em andamento. */
  onClose: () => void;
  /** Recebe o tíquete de curta duração emitido pelo backend. */
  onTicket: (ticket: string) => Promise<void> | void;
  open: boolean;
  title: string;
  tone?: VendorReauthTone;
};

const STRIPE_CLASS: Record<VendorReauthTone, string> = {
  danger: "bg-[#c0392b]",
  default: "bg-brand-yellow",
};

const CONFIRM_CLASS: Record<VendorReauthTone, string> = {
  danger:
    "border-[#c0392b] bg-[#c0392b] text-white shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] focus-visible:outline-[#c0392b]",
  default:
    "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500] hover:shadow-[1px_1px_0px_#ffe500] focus-visible:outline-[#1a1a1a]",
};

const CONFIRM_BASE =
  "inline-flex h-11 cursor-pointer items-center justify-center border-2 px-5 text-xs font-black uppercase tracking-[0.18em] transition-shadow active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none";

/**
 * Troca a senha da conta por um tíquete de curta duração no backend.
 *
 * Fica fora do componente de propósito: a senha nunca precisa sobreviver a um
 * render, e o erro já volta traduzido pelo `code`, sem ecoar o texto do
 * WordPress.
 */
async function requestReauthTicket(currentPassword: string): Promise<{ message: string } | { ticket: string }> {
  try {
    const response = await fetch("/api/vendor/braspress/reauth", {
      body: JSON.stringify({ currentPassword }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as { code?: string; ticket?: string } | null;

    if (!response.ok) {
      return { message: braspressErrorMessage({ code: body?.code, status: response.status }, "reauth") };
    }

    if (typeof body?.ticket !== "string" || body.ticket === "") {
      return { message: braspressErrorMessage({ status: response.status }, "reauth") };
    }

    return { ticket: body.ticket };
  } catch {
    return { message: "Não foi possível falar com o servidor. Tente novamente." };
  }
}

/**
 * Diálogo que confirma a senha da conta Papelito antes de uma ação sensível da
 * integração e devolve ao chamador o tíquete que a autoriza.
 *
 * A senha vive só aqui e é apagada em todo caminho de saída — quem atravessa
 * para o formulário é o tíquete. Erro de senha mantém o diálogo aberto e não
 * revela nada: quem decide o que fazer com o tíquete é `onTicket`.
 */
export function VendorReauthModal({
  confirmLabel,
  description,
  isSubmitting = false,
  onClose,
  onTicket,
  open,
  title,
  tone = "default",
}: Readonly<VendorReauthModalProps>) {
  const titleId = useId();
  const descriptionId = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, startChecking] = useTransition();

  const busy = checking || isSubmitting;

  function reset() {
    setPassword("");
    setError(null);
  }

  function handleClose() {
    if (busy) return;

    reset();
    onClose();
  }

  function confirm() {
    if (!password) {
      setError("Digite a senha da sua conta Papelito para continuar.");
      return;
    }

    setError(null);
    startChecking(async () => {
      const result = await requestReauthTicket(password);

      if ("message" in result) {
        setError(result.message);
        return;
      }

      reset();
      await onTicket(result.ticket);
    });
  }

  return (
    <BaseModal
      ariaDescribedBy={descriptionId}
      ariaLabelledBy={titleId}
      contentClassName="max-w-md"
      onClose={handleClose}
      open={open}
    >
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className={`h-2 w-full ${STRIPE_CLASS[tone]}`} />
        <div className="p-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-[#1a1a1a]" id={titleId}>
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 font-medium text-[#1a1a1a]/70" id={descriptionId}>
            {description}
          </p>

          <div className="mt-5">
            <ProfileFormField
              autoComplete="current-password"
              disabled={busy}
              label="Senha da sua conta Papelito"
              onChange={setPassword}
              type="password"
              value={password}
            />
          </div>

          {error ? (
            <p
              className="mt-3 border-2 border-[#c0392b] bg-white px-4 py-3 text-sm font-bold text-[#c0392b]"
              role="alert"
            >
              ⚠ {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              className="inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] px-5 text-xs font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={busy}
              onClick={handleClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              aria-busy={busy}
              className={`${CONFIRM_BASE} ${CONFIRM_CLASS[tone]}`}
              disabled={busy}
              onClick={confirm}
              type="button"
            >
              {busy ? "Confirmando..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
