"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, startTransition, useState } from "react";

import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import { clearPreviousSessionBeforeSignIn } from "@/features/auth/client/logout";
import { buildPostAuthUrl } from "@/features/company/onboarding";

import { ArrowRightIcon } from "../atoms/auth-icons";
import { AuthSocialButton } from "../atoms/auth-social-button";
import { AuthSubmitButton } from "../atoms/auth-submit-button";
import { AuthLoginHeader } from "../molecules/auth-login-header";
import { AuthPasswordField } from "../molecules/auth-password-field";
import { AuthSocialDivider } from "../molecules/auth-social-divider";
import { AuthTextField } from "../molecules/auth-text-field";

function AuthLoginFormContent() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl");
  const postAuthUrl = buildPostAuthUrl(callbackUrl);
  const authUnavailable =
    searchParams.get("error") === "papelito_auth_unavailable" ||
    searchParams.get("error") === "papelito_auth_context_unavailable";
  const cartLoginRequired = searchParams.get("feedback") === "cart_login_required";
  // Convidado sem conta precisa de saída daqui: esta tela não cria conta, e /cadastro é
  // candidatura empresarial (CNPJ + aprovação), que não é o caminho de quem foi convidado.
  const invitationFlow = (callbackUrl ?? "").startsWith("/convite");

  /**
   * Conclui o login e sai do SPA para o destino de pós-autenticação.
   *
   * A saída é navegação de documento de propósito: `/pos-login` só existe para redirecionar, e
   * numa navegação client-side esse redirect chega como chunk RSC rejeitado em vez de 307 — o
   * mesmo caminho que o Google OAuth já percorre. O documento novo também dispensa o `refresh()`
   * que corria em paralelo com o push.
   */
  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!username || !password) {
      setErrorMessage("Preencha e-mail e senha para continuar.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setPendingVerificationEmail(null);

    startTransition(async () => {
      try {
        await clearPreviousSessionBeforeSignIn();
      } catch {
        setIsSubmitting(false);
        setErrorMessage("Não foi possível limpar a sessão anterior. Tente novamente.");
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
        callbackUrl: postAuthUrl,
      });

      if (!result || result.error) {
        setIsSubmitting(false);

        if (result?.error === "papelito_email_not_verified") {
          setPendingVerificationEmail(username);
          setErrorMessage("Confirme seu e-mail antes de entrar.");
          return;
        }

        if (result?.error === "papelito_auth_rate_limited") {
          setErrorMessage(
            "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.",
          );
          return;
        }

        if (
          result?.error === "papelito_auth_unavailable" ||
          result?.error === "papelito_auth_context_unavailable"
        ) {
          setErrorMessage("Não foi possível concluir seu login agora. Tente novamente.");
          return;
        }

        setErrorMessage(
          "E-mail ou senha inválidos. Se sua conta foi criada com Google, entre pelo Google ou redefina sua senha.",
        );
        return;
      }

      window.location.assign(result.url ?? postAuthUrl);
    });
  }

  return (
    <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
      <div className="w-full max-w-md">
        <AuthLoginHeader />

        {cartLoginRequired ? (
          <p className="mt-6 rounded-md border border-brand-yellow/50 bg-brand-yellow/10 px-3 py-2 text-sm text-brand-yellow" role="status">
            Entre na sua conta para adicionar produtos ao carrinho.
          </p>
        ) : null}

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <fieldset className="space-y-6" disabled={isSubmitting}>
            <AuthTextField
              id="username"
              name="username"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
            />

            <AuthPasswordField
              id="password"
              name="password"
              label="Senha"
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <div className="flex justify-end">
              <Link
                href="/recuperar-senha"
                className="text-xs text-brand-yellow hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {errorMessage || authUnavailable ? (
              <div className="space-y-2 text-sm text-red-200">
                <p>{errorMessage ?? "Não foi possível concluir seu login agora. Tente novamente."}</p>
                {pendingVerificationEmail ? (
                  <Link
                    href={`/confirmar-email?email=${encodeURIComponent(pendingVerificationEmail)}`}
                    className="inline-block text-brand-yellow hover:underline"
                  >
                    Reenviar e-mail de confirmação
                  </Link>
                ) : null}
              </div>
            ) : null}

            <AuthSubmitButton
              icon={<ArrowRightIcon className="h-5 w-5" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </AuthSubmitButton>
          </fieldset>
        </form>

        <AuthSocialDivider label="ou continue com" />

        <AuthSocialButton
          label="Entrar com Google"
          iconSrc="/images/auth/google-icon.svg"
          iconAlt="Google"
          provider="google"
          callbackUrl={callbackUrl ?? undefined}
        />

        {invitationFlow ? (
          <p className="mt-8 text-center text-xs text-white/70">
            Ainda não tem conta?{" "}
            <Link href="/convite/cadastro" className="text-brand-yellow hover:underline">
              Criar conta para aceitar o convite
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AuthLoginFormFallback() {
  return (
    <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
      <LogoSpinnerLoader label="" />
    </div>
  );
}

/**
 * O boundary é obrigatório: este componente chama `useSearchParams()` e, sem ele, o `next build`
 * falha no prerender da rota com `missing-suspense-with-csr-bailout`. Fica embutido aqui, e não na
 * página, para não depender de cada chamador lembrar — mesmo padrão do `NavigationLoader`.
 */
export function AuthLoginForm() {
  return (
    <Suspense fallback={<AuthLoginFormFallback />}>
      <AuthLoginFormContent />
    </Suspense>
  );
}
