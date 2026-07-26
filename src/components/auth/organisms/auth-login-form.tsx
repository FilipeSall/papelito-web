"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { startTransition, useState } from "react";

import { clearPreviousSessionBeforeSignIn } from "@/features/auth/client/logout";
import { buildPostAuthUrl } from "@/features/company/onboarding";

import { ArrowRightIcon } from "../atoms/auth-icons";
import { AuthSocialButton } from "../atoms/auth-social-button";
import { AuthSubmitButton } from "../atoms/auth-submit-button";
import { AuthLoginHeader } from "../molecules/auth-login-header";
import { AuthPasswordField } from "../molecules/auth-password-field";
import { AuthSocialDivider } from "../molecules/auth-social-divider";
import { AuthTextField } from "../molecules/auth-text-field";

export function AuthLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl");
  const postAuthUrl = buildPostAuthUrl(callbackUrl);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
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

        setErrorMessage("Não foi possível autenticar com sua conta Papelito.");
        return;
      }

      router.push(result.url ?? postAuthUrl);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
      <div className="w-full max-w-md">
        <AuthLoginHeader />

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

            {errorMessage ? (
              <div className="space-y-2 text-sm text-red-200">
                <p>{errorMessage}</p>
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
      </div>
    </div>
  );
}
