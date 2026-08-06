"use client";

import { useState, useTransition } from "react";

import { signOutAndClearSession } from "@/features/auth/client/logout";
import { Panel } from "../primitives";
import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";

type FeedbackState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

const INITIAL_PASSWORD_FORM = {
  currentPassword: "",
  password: "",
  confirmPassword: "",
};

export function ConfigContent() {
  const [form, setForm] = useState(INITIAL_PASSWORD_FORM);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function updateField<Key extends keyof typeof INITIAL_PASSWORD_FORM>(
    key: Key,
    value: string,
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

  return (
    <div className="space-y-5">
      <Panel className="max-w-3xl">
      <div className="border-b-2 border-[#231f20] bg-[#231f20] px-5 py-3 text-brand-yellow md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em]">
          Segurança da conta
        </p>
      </div>
      <form className="px-5 py-6 md:px-6 md:py-7" onSubmit={handleSubmit}>
        <div className="mb-6">
          <h2
            className="text-[1.85rem] font-semibold uppercase leading-none tracking-[0.12em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Alterar senha
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#231f20]/72">
            Atualize sua senha de administrador para manter a segurança do painel.
          </p>
        </div>

        <div className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[4px_4px_0px_#1a1a1a] md:p-6">
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

        {feedback ? (
          <div
            className={`mt-5 px-4 py-3 text-sm font-bold ${
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

        <div className="mt-5 flex flex-col gap-3 border-t-2 border-[#231f20]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#231f20]/60">
            Esta ação atualiza a senha da sua conta de administrador.
          </p>

          <button
            className="inline-flex h-11 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Salvando..." : "Atualizar senha"}
          </button>
        </div>
      </form>
      </Panel>
    </div>
  );
}
