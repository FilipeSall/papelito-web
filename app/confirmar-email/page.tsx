"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { AuthWelcomePanel } from "@/components/auth";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";

type VerificationViewState = "idle" | "verifying" | "verified" | "error";

type ApiErrorResponse = {
  code?: string;
  message?: string;
};

type FeedbackTone = "success" | "error";

function ConfirmarEmailPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const callbackUrl = searchParams.get("callbackUrl") === "/convite" ? "/convite" : "/entrar";
  const verifiedHref =
    callbackUrl === "/convite"
      ? `/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : callbackUrl;
  const hasAttemptedVerification = useRef(false);
  const [viewState, setViewState] = useState<VerificationViewState>(token ? "verifying" : "idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("success");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email || !token || hasAttemptedVerification.current) {
      return;
    }

    hasAttemptedVerification.current = true;

    void (async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
          setViewState("error");
          setFeedbackTone("error");
          setFeedbackMessage(
            body?.message ?? "Não foi possível confirmar seu e-mail. Solicite um novo link.",
          );
          return;
        }

        setViewState("verified");
        setFeedbackTone("success");
        setFeedbackMessage("E-mail confirmado com sucesso. Sua conta já pode entrar com senha.");
      } catch {
        setViewState("error");
        setFeedbackTone("error");
        setFeedbackMessage("Erro de rede ao confirmar seu e-mail. Tente novamente.");
      }
    })();
  }, [email, token]);

  async function handleResend() {
    if (!email || isResending) {
      return;
    }

    setIsResending(true);
    setFeedbackMessage(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        setFeedbackTone("error");
        setFeedbackMessage(
          body?.message ?? "Não foi possível reenviar o e-mail de confirmação agora.",
        );
        return;
      }

      setFeedbackTone("success");
      setFeedbackMessage("Se a conta ainda estiver pendente, enviamos um novo e-mail de confirmação.");
    } catch {
      setFeedbackTone("error");
      setFeedbackMessage("Erro de rede ao reenviar o e-mail. Tente novamente.");
    } finally {
      setIsResending(false);
    }
  }

  const title =
    viewState === "verified"
      ? "E-mail Confirmado"
      : viewState === "verifying"
        ? "Confirmando E-mail"
        : "Confirme Seu E-mail";

  const description =
    viewState === "verified"
      ? "Sua conta foi liberada. Agora você já pode entrar normalmente com seu e-mail e senha."
      : viewState === "verifying"
        ? "Estamos validando o link enviado para sua caixa de entrada."
        : email
          ? `Enviamos um link de confirmação para ${email}. Abra a mensagem e clique no link para liberar o login com senha.`
          : "Abra o link enviado para seu e-mail para concluir a ativação da conta.";

  return (
    <div className="flex min-h-screen">
      <AuthWelcomePanel />

      <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-yellow/80">
            Ativação de conta
          </p>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-wide text-white">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/60">{description}</p>

          {feedbackMessage ? (
            <p
              className={`mt-6 text-sm ${feedbackTone === "success" ? "text-emerald-300" : "text-red-200"}`}
            >
              {feedbackMessage}
            </p>
          ) : null}

          {viewState === "verifying" ? (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              Validando seu link de confirmação...
            </div>
          ) : null}

          {viewState === "verified" ? (
            <div className="mt-10 space-y-4">
              <Link
                href={verifiedHref}
                className="flex h-14 w-full items-center justify-center rounded-full bg-brand-yellow font-black uppercase tracking-wide text-brand-dark transition hover:bg-brand-yellow/90"
              >
                {callbackUrl === "/convite" ? "Entrar para concluir convite" : "Ir Para Entrar"}
              </Link>
            </div>
          ) : null}

          {viewState !== "verified" && viewState !== "verifying" ? (
            <div className="mt-10 space-y-4">
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={!email || isResending}
                className="flex h-14 w-full items-center justify-center rounded-full bg-brand-yellow font-black uppercase tracking-wide text-brand-dark transition hover:bg-brand-yellow/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResending ? "Reenviando..." : "Reenviar E-mail"}
              </button>

              <Link
                href="/entrar"
                className="flex h-14 w-full items-center justify-center rounded-full border border-white/15 font-black uppercase tracking-wide text-white transition hover:bg-white/5"
              >
                Voltar Para Entrar
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ConfirmarEmailPageFallback() {
  return (
    <main className="min-h-screen bg-brand-dark">
      <LogoSpinnerLoader className="min-h-[70vh]" label="Carregando" message="Verificando seu link." />
    </main>
  );
}

/**
 * O boundary de Suspense é obrigatório, não decorativo: esta página chama `useSearchParams()` e,
 * sem ele, o `next build` falha no prerender com `missing-suspense-with-csr-bailout`. O
 * `app/loading.tsx` da raiz cobria isso por acidente; ele saiu para não brigar com o
 * `NavigationLoader`, então o boundary passa a ficar onde a exigência realmente está.
 */
export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={<ConfirmarEmailPageFallback />}>
      <ConfirmarEmailPageContent />
    </Suspense>
  );
}
