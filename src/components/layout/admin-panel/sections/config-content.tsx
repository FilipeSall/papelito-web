"use client";

import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";

import { Panel } from "../primitives";
import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";

type FeedbackState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

const INITIAL_PASSWORD_FORM = {
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

  return (
    <Panel className="max-w-3xl">
      <div className="border-b-2 border-[#231f20] bg-[#231f20] px-5 py-3 text-[#ffe500] md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em]">
          Seguranca da conta
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
            Atualize sua senha de administrador para manter a seguranca do painel.
          </p>
        </div>

        <div className="overflow-hidden rounded-[26px] border border-[#231f20]/12 bg-[#fbf7ef] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:p-6">
          <div className="mb-5 border-b border-[#D8D1C2] pb-4">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#231f20]/55">
              Atualizacao segura
            </p>
            <p className="mt-1 text-sm text-[#231f20]/65">
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
            className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-700"
            }`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 border-t border-[#231f20]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#231f20]/60">
            Esta acao atualiza a senha da sua conta de administrador.
          </p>

          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#231f20] px-6 text-sm font-black uppercase tracking-[0.28px] text-[#ffe500] transition hover:bg-[#0e0d0d] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Salvando..." : "Atualizar senha"}
          </button>
        </div>
      </form>
    </Panel>
  );
}
