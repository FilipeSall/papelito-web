"use client";

import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";

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
          await signOut({ callbackUrl: "/entrar" });
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
          : "overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm"
      }
      onSubmit={handleSubmit}
    >
      {!isEmbedded ? <div className="h-1.5 bg-brand-yellow" /> : null}

      <div className={isEmbedded ? "flex flex-1 flex-col gap-6" : "flex flex-col gap-6 px-6 py-6 sm:px-8"}>
        <div className="rounded-[26px] border border-[#E7E0D3] bg-[linear-gradient(180deg,#FFFDF8_0%,#FBF8F0_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-5">
          <div className="mb-5 border-b border-[#E9E1D0] pb-4">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-dark/55">
              Atualizacao segura
            </p>
            <p className="mt-1 text-sm text-brand-dark/65">
              Escolha uma senha nova e confirme abaixo para concluir a troca.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
            className={`rounded-2xl px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-700"
            }`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 border-t border-black/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-text-tertiary">
            Esta acao atualiza a senha diretamente na conta autenticada.
          </p>

          <button
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-dark px-6 text-sm font-black uppercase tracking-[0.28px] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
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
