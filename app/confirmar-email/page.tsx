"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";

import { AuthWelcomePanel } from "@/components/auth";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import { COMPANY_APPLICATION_PATH } from "@/features/company/onboarding";

type VerificationViewState = "idle" | "verifying" | "verified" | "retryable" | "error";

/**
 * De onde veio o link: uma conta já existente ou uma candidatura empresarial pré-conta.
 *
 * A candidatura ainda não tem `wp_user`, então confirma por outra rota e volta para a etapa 3
 * do cadastro em vez da tela de login. O escopo vem no fragmento do link, junto do token.
 */
type VerificationScope = "conta" | "candidatura";

const APPLICATION_SCOPE_PARAM = "candidatura";

const VERIFICATION_ENDPOINTS: Record<VerificationScope, { verify: string; resend: string }> = {
  conta: { verify: "/api/auth/verify-email", resend: "/api/auth/resend-verification" },
  candidatura: {
    verify: "/api/company-applications/verify-email",
    resend: "/api/company-applications/resend-verification",
  },
};

type ApiErrorResponse = {
  code?: string;
  message?: string;
};

type FeedbackTone = "success" | "error";

type Feedback = {
  tone: FeedbackTone;
  message: string;
};

type VerificationOutcome = Feedback & {
  viewState: VerificationViewState;
};

function subscribeToHashChange(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function readLocationHash() {
  return window.location.hash;
}

function readServerLocationHash() {
  return "";
}

/**
 * Lê um parâmetro do link de confirmação. O e-mail atual manda e-mail e token no fragmento, que
 * GTM e GA4 não registram; a query continua valendo para links já enviados e para o reenvio.
 */
function readLinkParam(
  name: string,
  hashParams: URLSearchParams,
  searchParams: Pick<URLSearchParams, "get">,
) {
  return (hashParams.get(name) ?? searchParams.get(name) ?? "").trim();
}

/**
 * Para onde levar depois da confirmação.
 *
 * A candidatura volta para a etapa 3 do cadastro, e não para o login: a conta dela só passa a
 * existir quando o administrador aprovar.
 */
function resolveVerifiedHref(scope: VerificationScope, callbackUrl: string) {
  if (scope === "candidatura") {
    return COMPANY_APPLICATION_PATH;
  }

  if (callbackUrl === "/convite") {
    return `/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }

  return callbackUrl;
}

/**
 * Rótulo do botão que aparece depois da confirmação, no mesmo vocabulário do destino.
 */
function resolveVerifiedLabel(scope: VerificationScope, callbackUrl: string) {
  if (scope === "candidatura") {
    return "Continuar cadastro";
  }

  return callbackUrl === "/convite" ? "Entrar para concluir convite" : "Ir Para Entrar";
}

function getTitle(viewState: VerificationViewState) {
  if (viewState === "verified") {
    return "E-mail Confirmado";
  }

  if (viewState === "verifying") {
    return "Confirmando E-mail";
  }

  return "Confirme Seu E-mail";
}

function getDescription(
  viewState: VerificationViewState,
  email: string,
  canVerify: boolean,
  scope: VerificationScope,
) {
  const purpose =
    scope === "candidatura" ? "que sua candidatura siga para análise" : "liberar o login com senha";

  if (viewState === "verified") {
    return scope === "candidatura"
      ? "Seu e-mail está confirmado. Continue o cadastro para acompanhar a candidatura."
      : "Sua conta foi liberada. Agora você já pode entrar normalmente com seu e-mail e senha.";
  }

  if (viewState === "verifying") {
    return "Estamos validando o link enviado para sua caixa de entrada.";
  }

  if ((viewState === "idle" || viewState === "retryable") && canVerify) {
    return `Confirme que ${email} é o seu e-mail para ${purpose}.`;
  }

  if (email) {
    return `Enviamos um link de confirmação para ${email}. Abra a mensagem e clique no link para ${purpose}.`;
  }

  return "Abra o link enviado para seu e-mail para concluir a ativação da conta.";
}

/**
 * Envia o token ao WordPress e traduz a resposta. Falha de rede ou 5xx permite tentar de novo
 * com o mesmo link; recusa 4xx pede um link novo, porque o token é inválido ou expirou.
 */
async function requestEmailVerification(
  email: string,
  token: string,
  scope: VerificationScope,
): Promise<VerificationOutcome> {
  let response: Response;

  try {
    response = await fetch(VERIFICATION_ENDPOINTS[scope].verify, {
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
      message:
        scope === "candidatura"
          ? "E-mail confirmado com sucesso. Sua candidatura seguiu para a próxima etapa."
          : "E-mail confirmado com sucesso. Sua conta já pode entrar com senha.",
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

/**
 * Pede um novo e-mail de confirmação. O sucesso é neutro de propósito: o WordPress não revela
 * se a conta ainda está pendente.
 */
async function requestVerificationResend(
  email: string,
  scope: VerificationScope,
): Promise<Feedback> {
  try {
    const response = await fetch(VERIFICATION_ENDPOINTS[scope].resend, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      return {
        tone: "error",
        message: body?.message ?? "Não foi possível reenviar o e-mail de confirmação agora.",
      };
    }

    return {
      tone: "success",
      message:
        scope === "candidatura"
          ? "Se ainda faltar confirmar, enviamos um novo link para esse e-mail."
          : "Se a conta ainda estiver pendente, enviamos um novo e-mail de confirmação.",
    };
  } catch {
    return {
      tone: "error",
      message: "Erro de rede ao reenviar o e-mail. Tente novamente.",
    };
  }
}

function ConfirmarEmailPageContent() {
  const searchParams = useSearchParams();
  const locationHash = useSyncExternalStore(
    subscribeToHashChange,
    readLocationHash,
    readServerLocationHash,
  );
  const hashParams = new URLSearchParams(locationHash.replace(/^#/, ""));
  const email = readLinkParam("email", hashParams, searchParams);
  const token = readLinkParam("token", hashParams, searchParams);
  const canVerify = Boolean(email && token);
  const scope: VerificationScope =
    readLinkParam("scope", hashParams, searchParams) === APPLICATION_SCOPE_PARAM
      ? "candidatura"
      : "conta";
  const callbackUrl = searchParams.get("callbackUrl") === "/convite" ? "/convite" : "/entrar";
  const verifiedHref = resolveVerifiedHref(scope, callbackUrl);
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

    const outcome = await requestEmailVerification(email, token, scope);

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

    const feedback = await requestVerificationResend(email, scope);

    setFeedbackTone(feedback.tone);
    setFeedbackMessage(feedback.message);
    setIsResending(false);
  }

  const title = getTitle(viewState);
  const description = getDescription(viewState, email, canVerify, scope);
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
                {resolveVerifiedLabel(scope, callbackUrl)}
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
