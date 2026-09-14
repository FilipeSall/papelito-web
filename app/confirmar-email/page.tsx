"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthWelcomePanel } from "@/components/auth";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";

type VerificationViewState = "idle" | "verifying" | "verified" | "retryable" | "error";

type ApiErrorResponse = {
  code?: string;
  message?: string;
};

type FeedbackTone = "success" | "error";

type VerificationOutcome = {
  viewState: VerificationViewState;
  tone: FeedbackTone;
  message: string;
};

function getTitle(viewState: VerificationViewState) {
  if (viewState === "verified") {
    return "E-mail Confirmado";
  }

  if (viewState === "verifying") {
    return "Confirmando E-mail";
  }

  return "Confirme Seu E-mail";
}

function getDescription(viewState: VerificationViewState, email: string, canVerify: boolean) {
  if (viewState === "verified") {
    return "Sua conta foi liberada. Agora você já pode entrar normalmente com seu e-mail e senha.";
  }

  if (viewState === "verifying") {
    return "Estamos validando o link enviado para sua caixa de entrada.";
  }

  if ((viewState === "idle" || viewState === "retryable") && canVerify) {
    return `Confirme que ${email} é o seu e-mail para liberar o login com senha.`;
  }

  if (email) {
    return `Enviamos um link de confirmação para ${email}. Abra a mensagem e clique no link para liberar o login com senha.`;
  }

  return "Abra o link enviado para seu e-mail para concluir a ativação da conta.";
}

/**
 * Envia o token ao WordPress e traduz a resposta. Falha de rede ou 5xx permite tentar de novo
 * com o mesmo link; recusa 4xx pede um link novo, porque o token é inválido ou expirou.
 */
async function requestEmailVerification(email: string, token: string): Promise<VerificationOutcome> {
  let response: Response;

  try {
    response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    });
  } catch {
    return {
      viewState: "retryable",
      tone: "error",
      message: "Erro de rede ao confirmar seu e-mail. Tente novamente.",
    };
  }

  if (response.ok) {
    return {
      viewState: "verified",
      tone: "success",
      message: "E-mail confirmado com sucesso. Sua conta já pode entrar com senha.",
    };
  }

  if (response.status >= 500) {
    return {
      viewState: "retryable",
      tone: "error",
      message: "Não foi possível confirmar seu e-mail agora. Tente novamente.",
    };
  }

  const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;

  return {
    viewState: "error",
    tone: "error",
    message: body?.message ?? "Não foi possível confirmar seu e-mail. Solicite um novo link.",
  };
}

function ConfirmarEmailPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const canVerify = Boolean(email && token);
  const callbackUrl = searchParams.get("callbackUrl") === "/convite" ? "/convite" : "/entrar";
  const verifiedHref =
    callbackUrl === "/convite"
      ? `/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : callbackUrl;
  const [viewState, setViewState] = useState<VerificationViewState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("success");
  const [isResending, setIsResending] = useState(false);

  /**
   * Confirma o e-mail só com clique explícito: abrir o link não basta, porque scanners de e-mail
   * corporativo abrem links e executam JavaScript sem nenhuma pessoa envolvida.
   */
  async function handleVerify() {
    if (!canVerify) {
      return;
    }

    setViewState("verifying");
    setFeedbackMessage(null);

    const outcome = await requestEmailVerification(email, token);

    setViewState(outcome.viewState);
    setFeedbackTone(outcome.tone);
    setFeedbackMessage(outcome.message);
  }

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

  const title = getTitle(viewState);
  const description = getDescription(viewState, email, canVerify);
  const showConfirmAction = canVerify && (viewState === "idle" || viewState === "retryable");
  const showResendActions = viewState === "error" || (viewState === "idle" && !canVerify);

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

          {showConfirmAction ? (
            <div className="mt-10 space-y-4">
              <button
                type="button"
                onClick={() => void handleVerify()}
                className="flex h-14 w-full items-center justify-center rounded-full bg-brand-yellow font-black uppercase tracking-wide text-brand-dark transition hover:bg-brand-yellow/90"
              >
                Confirmar E-mail
              </button>
            </div>
          ) : null}

          {showResendActions ? (
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
