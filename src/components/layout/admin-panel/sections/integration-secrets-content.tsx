"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { FormFeedback, type FormFeedbackState } from "@/components/ui/feedback";
import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";

import { Panel } from "../primitives";

type IntegrationSecret = {
  slug: string;
  label: string;
  class: "analytics" | "operacional" | "pagamento";
  configured: boolean;
  last4: string | null;
  source: "env" | "vault" | null;
  updated_at: string | null;
  updated_by: string | null;
};

type ApiError = { code?: string; message?: string };

function errorMessage(error: ApiError | null) {
  switch (error?.code) {
    case "papelito_integration_secret_current_password_invalid":
      return "A senha atual não confere.";
    case "papelito_integration_secret_rate_limited":
      return "Muitas tentativas. Aguarde antes de tentar novamente.";
    case "papelito_integration_secret_unknown_slug":
    case "papelito_integration_secret_forbidden_slug":
      return "Esta integração não pode ser alterada.";
    default:
      return error?.message ?? "Não foi possível salvar a integração.";
  }
}

export function IntegrationSecretsContent({
  variant = "default",
}: {
  variant?: "default" | "plain";
} = {}) {
  const searchParams = useSearchParams();
  const confirmationStarted = useRef(false);
  const [items, setItems] = useState<IntegrationSecret[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FormFeedbackState>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/integration-secrets", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as { items?: IntegrationSecret[]; message?: string } | null;
      if (!response.ok) {
        setFeedback({ type: "error", message: body?.message ?? "Não foi possível carregar as integrações." });
        return;
      }
      setItems(Array.isArray(body?.items) ? body.items : []);
    } catch {
      setFeedback({ type: "error", message: "Erro de rede ao carregar as integrações." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const token = searchParams.get("integrationSecretToken");
    if (!token || confirmationStarted.current) {
      return;
    }
    confirmationStarted.current = true;
    window.history.replaceState({}, "", "/admin/config");
    startTransition(async () => {
      const response = await fetch("/api/admin/integration-secrets", {
        body: JSON.stringify({ token }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as ApiError | null;
      setFeedback(response.ok
        ? { type: "success", message: "Alteração de pagamento confirmada." }
        : { type: "error", message: errorMessage(body) });
      await load();
    });
  }, [searchParams]);

  function save(secret: IntegrationSecret, currentPassword: string, value: string) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/integration-secrets/${encodeURIComponent(secret.slug)}`, {
        body: JSON.stringify({ currentPassword, secret: value }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const body = (await response.json().catch(() => null)) as ApiError | null;
      setFeedback(response.ok
        ? {
            type: "success",
            message: response.status === 202
              ? "Alteração pendente: confirme pelo e-mail antes de ela valer."
              : "Integração salva.",
          }
        : { type: "error", message: errorMessage(body) });
      if (response.ok) {
        await load();
      }
    });
  }

  function remove(secret: IntegrationSecret, currentPassword: string) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/integration-secrets/${encodeURIComponent(secret.slug)}`, {
        body: JSON.stringify({ currentPassword }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      const body = (await response.json().catch(() => null)) as ApiError | null;
      setFeedback(response.ok
        ? {
            type: "success",
            message: response.status === 202
              ? "Remoção pendente: confirme pelo e-mail antes de ela valer."
              : "Credencial removida do cofre.",
          }
        : { type: "error", message: errorMessage(body) });
      if (response.ok) {
        await load();
      }
    });
  }

  const body = (
    <>
      {variant === "plain" ? null : (
        <div>
          <h2 className="text-[1.85rem] font-semibold uppercase leading-none tracking-[0.12em]" style={{ fontFamily: "var(--font-admin-display)" }}>
            Credenciais de integração
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#231f20]/72">
            Os valores nunca são exibidos novamente. Para editar uma credencial, informe sua senha atual.
          </p>
        </div>
      )}

      {feedback ? <FormFeedback feedback={feedback} /> : null}
      {loading ? <p className="text-sm text-[#231f20]/70">Carregando integrações...</p> : null}
      {!loading && items.length === 0 ? <p className="text-sm text-[#231f20]/70">Nenhuma integração está disponível neste ambiente.</p> : null}
      {items.map((item) => (
        <IntegrationSecretForm
          disabled={isPending}
          item={item}
          key={item.slug}
          onRemove={remove}
          onSave={save}
        />
      ))}
    </>
  );

  if (variant === "plain") {
    return <div className="space-y-5">{body}</div>;
  }

  return (
    <Panel className="max-w-3xl">
      <div className="border-b-2 border-[#231f20] bg-[#231f20] px-5 py-3 text-brand-yellow md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em]">Integrações</p>
      </div>
      <div className="space-y-5 px-5 py-6 md:px-6 md:py-7">{body}</div>
    </Panel>
  );
}

function IntegrationSecretForm({
  disabled,
  item,
  onRemove,
  onSave,
}: {
  disabled: boolean;
  item: IntegrationSecret;
  onRemove: (item: IntegrationSecret, currentPassword: string) => void;
  onSave: (item: IntegrationSecret, currentPassword: string, value: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [value, setValue] = useState("");

  return (
    <form
      className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[4px_4px_0px_#1a1a1a]"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(item, currentPassword, value);
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold">{item.label}</h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-[#231f20]/60">{item.class}</p>
        </div>
        <p className="text-sm text-[#231f20]/70">
          {item.configured ? `Configurada${item.last4 ? ` · termina em ${item.last4}` : ""}` : "Não configurada"}
        </p>
      </div>

      {item.source === "env" ? (
        <p className="mt-4 border-l-4 border-brand-yellow bg-[#fff8c4] p-3 text-sm leading-5">
          O ambiente está no comando. Um valor salvo aqui ficará ignorado até a variável de ambiente ser removida.
        </p>
      ) : null}
      {item.class === "pagamento" ? (
        <p className="mt-4 border-l-4 border-[#b91c1c] bg-[#fff1f1] p-3 text-sm leading-5">
          Alterações de pagamento só passam a valer após a confirmação pelo link enviado por e-mail.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ProfileFormField
          autoComplete="new-password"
          label="Nova credencial"
          onChange={setValue}
          type="password"
          value={value}
        />
        <ProfileFormField
          autoComplete="current-password"
          label="Sua senha atual"
          onChange={setCurrentPassword}
          type="password"
          value={currentPassword}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="h-10 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-xs font-black uppercase tracking-widest text-brand-yellow disabled:opacity-60" disabled={disabled || !value || !currentPassword} type="submit">
          Salvar
        </button>
        {item.configured ? (
          <button className="h-10 border-2 border-[#b91c1c] px-4 text-xs font-black uppercase tracking-widest text-[#b91c1c] disabled:opacity-60" disabled={disabled || !currentPassword} onClick={() => onRemove(item, currentPassword)} type="button">
            Remover do cofre
          </button>
        ) : null}
      </div>
    </form>
  );
}
