"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";

import { ArrowRightIcon } from "../atoms/auth-icons";
import { AuthSubmitButton } from "../atoms/auth-submit-button";
import { AuthPasswordField } from "../molecules/auth-password-field";

type ResetPasswordApiResponse = {
  message?: string;
};

type FieldErrors = {
  password?: string;
  confirmPassword?: string;
};

export function AuthResetPasswordForm() {
  const searchParams = useSearchParams();
  const login = searchParams.get("login")?.trim() ?? "";
  const key = searchParams.get("key")?.trim() ?? "";
  const hasResetLink = Boolean(login && key);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    hasResetLink ? null : "Link de redefinicao inválido ou incompleto.",
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm(password: string, confirmPassword: string) {
    const nextErrors: FieldErrors = {};

    if (password.length < 8) {
      nextErrors.password = "A nova senha precisa ter pelo menos 8 caracteres.";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "As senhas precisam coincidir.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasResetLink) {
      setErrorMessage("Link de redefinicao inválido ou incompleto.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm(password, confirmPassword)) {
      return;
    }

    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            login,
            key,
            password,
            confirmPassword,
          }),
        });

        const body = (await response.json().catch(() => null)) as ResetPasswordApiResponse | null;

        if (!response.ok) {
          setErrorMessage(
            body?.message ?? "Não foi possível redefinir sua senha. Solicite um novo link.",
          );
          return;
        }

        setFieldErrors({});
        setSuccessMessage("Senha alterada com sucesso. Agora você já pode entrar com a nova senha.");
      } catch {
        setErrorMessage("Erro de rede ao redefinir a senha. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  return (
    <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
      <div className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-yellow/80">Acesso seguro</p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-wide text-white">
          Criar nova senha
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          Digite uma nova senha para acessar sua conta.
        </p>

        {successMessage ? (
          <div className="mt-10 space-y-6">
            <p className="text-sm text-emerald-300" role="status">
              {successMessage}
            </p>

            <Link
              href="/entrar"
              className="flex h-14 w-full items-center justify-center rounded-full bg-brand-yellow font-black uppercase tracking-wide text-brand-dark transition hover:bg-brand-yellow/90"
            >
              Ir para entrar
            </Link>
          </div>
        ) : (
          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <fieldset className="space-y-6" disabled={isSubmitting || !hasResetLink}>
              <AuthPasswordField
                id="password"
                name="password"
                label="Nova senha"
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
              />
              {fieldErrors.password ? (
                <p className="-mt-3 text-sm text-red-200" role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}

              <AuthPasswordField
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar nova senha"
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword ? (
                <p className="-mt-3 text-sm text-red-200" role="alert">
                  {fieldErrors.confirmPassword}
                </p>
              ) : null}

              {errorMessage ? (
                <p className="text-sm text-red-200" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <AuthSubmitButton
                icon={<ArrowRightIcon className="h-5 w-5" />}
                disabled={isSubmitting || !hasResetLink}
              >
                {isSubmitting ? "Alterando..." : "Alterar senha"}
              </AuthSubmitButton>
            </fieldset>
          </form>
        )}

        {!successMessage ? (
          <Link
            href="/entrar"
            className="mt-6 inline-flex text-sm font-medium text-brand-yellow hover:underline"
          >
            Voltar para entrar
          </Link>
        ) : null}
      </div>
    </div>
  );
}
