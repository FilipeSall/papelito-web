"use client";

import { useState, useTransition } from "react";

import { signOutAndClearSession } from "@/features/auth/client/logout";
import type { ProfilePasswordFormValues } from "@/features/profile/types/profile-customer";
import { FormFeedback, type FormFeedbackState } from "@/components/ui/feedback";
import { ArrowRightIcon } from "@/components/ui/icons";

import { ProfileFormField } from "./profile-form-field";

const INITIAL_PASSWORD_FORM: ProfilePasswordFormValues = {
  currentPassword: "",
  password: "",
  confirmPassword: "",
};

export function PasswordSettingsCard({
  variant = "default",
}: Readonly<{
  variant?: "default" | "embedded" | "plain";
}>) {
  const [form, setForm] = useState(INITIAL_PASSWORD_FORM);
  const [feedback, setFeedback] = useState<FormFeedbackState>(null);
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

    if (!form.currentPassword) {
      nextErrors.currentPassword = "Informe sua senha atual.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "A nova senha precisa ter pelo menos 8 caracteres.";
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "As senhas precisam coincidir.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
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
            message: body?.message ?? "Não foi possível atualizar sua senha.",
          });
          return;
        }

        await signOutAndClearSession({ callbackUrl: "/entrar" });
      } catch {
        setFeedback({
          type: "error",
          message: "Erro de rede ao atualizar a senha. Tente novamente.",
        });
      }
    });
  }

  const isEmbedded = variant === "embedded";
  const isPlain = variant === "plain";
  const isFramed = !isEmbedded && !isPlain;

  return (
    <form
      className={
        isFramed
          ? "border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
          : isEmbedded
            ? "flex flex-1 flex-col px-5 py-6 md:px-6"
            : "flex flex-col"
      }
      onSubmit={handleSubmit}
    >
      {isFramed ? <div className="h-2 w-full bg-brand-yellow" /> : null}

      <div
        className={
          isFramed ? "flex flex-col gap-6 px-6 py-6 sm:px-8" : "flex flex-1 flex-col gap-6"
        }
      >
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
              Atualização segura
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ProfileFormField
              autoComplete="current-password"
              errorMessage={fieldErrors.currentPassword}
              label="Senha atual"
              onChange={(value) => updateField("currentPassword", value)}
              type="password"
              value={form.currentPassword}
            />
            <ProfileFormField
              autoComplete="new-password"
              errorMessage={fieldErrors.password}
              label="Nova senha"
              onChange={(value) => updateField("password", value)}
              placeholder="Mínimo de 8 caracteres"
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

        <FormFeedback feedback={feedback} />

        <div className="mt-auto flex flex-col gap-3 border-t-2 border-[#1a1a1a] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#1a1a1a]/70">
            Esta ação atualiza a senha diretamente na conta autenticada.
          </p>

          <button
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
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
