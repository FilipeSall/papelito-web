"use client";

import { useState } from "react";

const RESEND_FAILURE_MESSAGE =
  "Não foi possível reenviar agora. Tente novamente em alguns instantes.";
const RESEND_SUCCESS_MESSAGE =
  "Se ainda faltar confirmar, o link chega em instantes. Verifique também a caixa de spam.";

/**
 * Tela da candidatura que ainda não teve o e-mail confirmado.
 *
 * É o passo que segura a candidatura fora da fila do administrador: enquanto a pessoa não
 * clicar no link, nada é enviado para análise e o upload de documento fica bloqueado. O
 * reenvio tem intervalo de um minuto no backend e responde igual nos dois casos, então a
 * mensagem de sucesso é deliberadamente neutra.
 */
export function EmailVerificationPending() {
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function resendVerification() {
    setWorking(true);
    setMessage(null);

    try {
      const response = await fetch("/api/company-applications/resend-verification", {
        method: "POST",
      });
      setMessage(response.ok ? RESEND_SUCCESS_MESSAGE : RESEND_FAILURE_MESSAGE);
    } catch {
      setMessage(RESEND_FAILURE_MESSAGE);
    }

    setWorking(false);
  }

  return (
    <>
      <p className="mt-4 text-sm leading-6 text-white/55">
        Enviamos um link de confirmação para o e-mail que você cadastrou. Confirme o
        endereço para que sua candidatura siga para análise da equipe Papelito.
      </p>
      {message ? (
        <p className="mt-6 rounded-lg bg-white/6 p-3 text-xs font-medium text-white/70" role="status">
          {message}
        </p>
      ) : null}
      <button
        type="button"
        onClick={resendVerification}
        disabled={working}
        className="mt-6 inline-flex rounded-full bg-brand-yellow px-5 py-3 text-sm font-black uppercase tracking-wide text-brand-dark transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {working ? "Reenviando..." : "Reenviar link de confirmação"}
      </button>
    </>
  );
}
