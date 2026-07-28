"use client";

import Link from "next/link";
import { startTransition, useState } from "react";

import { ArrowRightIcon } from "../atoms/auth-icons";
import { AuthSubmitButton } from "../atoms/auth-submit-button";
import { AuthTextField } from "../molecules/auth-text-field";

type ForgotPasswordApiResponse = {
  message?: string;
};

const GENERIC_SUCCESS_MESSAGE =
  "Se o e-mail informado estiver cadastrado, você receberá as instrucoes para redefinir sua senha.";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthForgotPasswordForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setSuccessMessage(null);
      setErrorMessage("Informe o e-mail cadastrado para continuar.");
      return;
    }

    if (!isValidEmail(email)) {
      setSuccessMessage(null);
      setErrorMessage("Informe um e-mail válido.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const body = (await response.json().catch(() => null)) as ForgotPasswordApiResponse | null;

        if (!response.ok) {
          setErrorMessage(
            body?.message ?? "Não foi possível enviar as instrucoes agora. Tente novamente.",
          );
          return;
        }

        setSuccessMessage(GENERIC_SUCCESS_MESSAGE);
      } catch {
        setErrorMessage("Erro de rede ao solicitar a redefinicao de senha. Tente novamente.");
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
          Recuperar senha
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          Informe o e-mail cadastrado na sua conta. Enviaremos as instrucoes para você criar
          uma nova senha.
        </p>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <fieldset className="space-y-6" disabled={isSubmitting}>
            <AuthTextField
              id="email"
              name="email"
              label="E-mail"
              type="text"
              placeholder="seu@email.com"
              autoComplete="email"
              inputMode="email"
            />

            {errorMessage ? (
              <p className="text-sm text-red-200" role="alert">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="text-sm text-emerald-300" role="status">
                {successMessage}
              </p>
            ) : null}

            <AuthSubmitButton
              icon={<ArrowRightIcon className="h-5 w-5" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar instrucoes"}
            </AuthSubmitButton>
          </fieldset>
        </form>

        <Link
          href="/entrar"
          className="mt-6 inline-flex text-sm font-medium text-brand-yellow hover:underline"
        >
          Voltar para entrar
        </Link>
      </div>
    </div>
  );
}
