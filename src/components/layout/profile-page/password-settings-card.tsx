"use client";

import { useState, useTransition } from "react";

import { signOutAndClearSession } from "@/features/auth/client/logout";
import type { ProfilePasswordFormValues } from "@/features/profile/types/profile-customer";
import { ArrowRightIcon } from "@/components/ui/icons";

import { ProfileFormField } from "./profile-form-field";

type FeedbackState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

const INITIAL_PASSWORD_FORM: ProfilePasswordFormValues = {
  password: "",
  confirmPassword: "",
};

export function PasswordSettingsCard({
  variant = "default",
}: {
  variant?: "default" | "embedded";
}) {
  const [form, setForm] = useState(INITIAL_PASSWORD_FORM);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function updateField<Key extends keyof ProfilePasswordFormValues>(
    key: Key,
    value: ProfilePasswordFormValues[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setFeedback(null);
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (form.password.length < 8) {
      nextErrors.password = "A nova senha precisa ter pelo menos 8 caracteres.";
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "As senhas precisam coincidir.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/password", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (response.status === 401) {
          await signOutAndClearSession({ callbackUrl: "/entrar" });
          return;
        }

        if (!response.ok) {
          setFeedback({
            type: "error",
            message: body?.message ?? "Nao foi possivel atualizar sua senha.",
          });
          return;
        }

        setFeedback({
          type: "success",
          message: "Sua senha foi atualizada com sucesso.",
        });
        setForm(INITIAL_PASSWORD_FORM);
      } catch {
        setFeedback({
          type: "error",
          message: "Erro de rede ao atualizar a senha. Tente novamente.",
        });
      }
    });
  }

  const isEmbedded = variant === "embedded";

  return (
    <form
      className={
        isEmbedded
          ? "flex flex-1 flex-col px-5 py-6 md:px-6"
          : "border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
      }
      onSubmit={handleSubmit}
    >
      {!isEmbedded ? <div className="h-2 w-full bg-brand-yellow" /> : null}

      <div className={isEmbedded ? "flex flex-1 flex-col gap-6" : "flex flex-col gap-6 px-6 py-6 sm:px-8"}>
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
              Atualizacao segura
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ProfileFormField
              autoComplete="new-password"
              errorMessage={fieldErrors.password}
              label="Nova senha"
              onChange={(value) => updateField("password", value)}
              placeholder="Minimo de 8 caracteres"
              type="password"
              value={form.password}
            />
            <ProfileFormField
              autoComplete="new-password"
              errorMessage={fieldErrors.confirmPassword}
              label="Confirmar nova senha"
              onChange={(value) => updateField("confirmPassword", value)}
              placeholder="Repita a nova senha"
              type="password"
              value={form.confirmPassword}
            />
          </div>
        </div>

        {feedback ? (
          <div
            className={`px-4 py-3 text-sm font-bold ${
              feedback.type === "error"
                ? "border-2 border-[#c0392b] bg-[#c0392b]/10 text-[#c0392b]"
                : "border-2 border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
            }`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.type === "error" ? "⚠ " : "✓ "}
            {feedback.message}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 border-t-2 border-[#1a1a1a] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#1a1a1a]/70">
            Esta acao atualiza a senha diretamente na conta autenticada.
          </p>

          <button
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Salvando..." : "Atualizar senha"}
            {!isPending ? (
              <ArrowRightIcon className="h-4 w-4" size={18} strokeWidth={1.8} />
            ) : null}
          </button>
        </div>
      </div>
    </form>
  );
}
