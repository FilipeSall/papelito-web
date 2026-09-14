"use client";

import { useState, useTransition } from "react";

import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";
import { AnchoredSection } from "@/components/ui/anchored-sections";
import type { VendorBraspressIntegration } from "@/features/vendor-settings/types/vendor-braspress";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";

type FormState = VendorBraspressIntegration["config"] & {
  enabled: boolean;
  username: string;
  password: string;
  currentPassword: string;
};

function initialForm(integration: VendorBraspressIntegration): FormState {
  return {
    ...integration.config,
    enabled: integration.enabled,
    username: "",
    password: "",
    currentPassword: "",
  };
}

function statusLabel(status: VendorBraspressIntegration["status"]) {
  if (status === "active") return "Ativa";
  if (status === "ready") return "Pronta para validar";
  if (status === "invalid_credentials") return "Credenciais inválidas";
  return "Não configurada";
}

export function VendorBraspressSection({
  initialIntegration,
}: Readonly<{
  initialIntegration: VendorBraspressIntegration;
}>) {
  const [form, setForm] = useState(() => initialForm(initialIntegration));
  const [integration, setIntegration] = useState(initialIntegration);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [removing, setRemoving] = useState(false);
  const [pending, startTransition] = useTransition();

  const disabled = initialIntegration.loadFailed || pending;
  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!form.currentPassword) {
      setFeedback({ error: true, message: "Confirme sua senha atual para salvar a integração." });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/vendor/braspress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const body = (await response.json().catch(() => null)) as VendorBraspressIntegration & {
          message?: string;
        };

        if (!response.ok) {
          setFeedback({ error: true, message: body?.message ?? "Não foi possível salvar a integração." });
          return;
        }

        setIntegration({ ...body, loadFailed: false });
        setForm((current) => ({ ...current, username: "", password: "", currentPassword: "" }));
        setFeedback({
          error: false,
          message: "Integração Braspress salva. As credenciais não são exibidas novamente.",
        });
      } catch {
        setFeedback({ error: true, message: "Não foi possível falar com o servidor. Tente novamente." });
      }
    });
  }

  function removeIntegration() {
    if (!form.currentPassword) {
      setFeedback({ error: true, message: "Confirme sua senha atual para remover a integração." });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/vendor/braspress", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: form.currentPassword }),
        });
        const body = (await response.json().catch(() => null)) as VendorBraspressIntegration & {
          message?: string;
        };

        if (!response.ok) {
          setFeedback({ error: true, message: body?.message ?? "Não foi possível remover a integração." });
          return;
        }

        const next = { ...body, loadFailed: false };
        setIntegration(next);
        setForm(initialForm(next));
        setRemoving(false);
        setFeedback({ error: false, message: "Integração Braspress e credenciais removidas." });
      } catch {
        setFeedback({ error: true, message: "Não foi possível falar com o servidor. Tente novamente." });
      }
    });
  }

  return (
    <AnchoredSection
      description="Cadastre o contrato da sua loja. A Braspress só aparece no checkout quando a integração estiver completa, habilitada e a embalagem aprovada."
      id="transportadoras"
      title="Transportadoras"
    >
      <form className="space-y-6" onSubmit={submit}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-[#1a1a1a] bg-white p-4 shadow-[4px_4px_0px_#1a1a1a]">
          <div>
            <p className="text-sm font-black text-[#1a1a1a]">Braspress</p>
            <p className="text-xs font-semibold text-[#1a1a1a]/65">{statusLabel(integration.status)}</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-[#1a1a1a]">
            <input
              checked={form.enabled}
              disabled={disabled}
              onChange={(event) => setField("enabled", event.target.checked)}
              type="checkbox"
            />
            Habilitar Braspress
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ProfileFormField disabled={disabled} inputMode="numeric" label="CNPJ remetente" onChange={(value) => setField("senderCnpj", value)} value={form.senderCnpj} />
          <ProfileFormField disabled={disabled} inputMode="numeric" label="CEP de origem" onChange={(value) => setField("originCep", value)} value={form.originCep} />
          <ProfileFormField disabled={disabled} label="Modal (R rodoviário ou A aéreo)" maxLength={1} onChange={(value) => setField("modal", value.toUpperCase())} value={form.modal} />
          <ProfileFormField disabled={disabled} label="Tipo de frete (1 CIF, 2 FOB, 3 consignado)" maxLength={1} onChange={(value) => setField("freightType", value)} value={form.freightType} />
          {form.freightType === "3" ? <ProfileFormField disabled={disabled} inputMode="numeric" label="CNPJ consignatário" onChange={(value) => setField("consigneeCnpj", value)} value={form.consigneeCnpj} /> : null}
          <ProfileFormField disabled={disabled} label="Unidade de peso (kg ou g)" onChange={(value) => setField("weightUnit", value.toLowerCase())} value={form.weightUnit} />
          <ProfileFormField disabled={disabled} label="Fuso da cotação" onChange={(value) => setField("quoteTimezone", value)} placeholder="America/Sao_Paulo" value={form.quoteTimezone} />
          <ProfileFormField disabled={disabled} inputMode="numeric" label="CNPJ tomador do tracking" onChange={(value) => setField("trackingTomadorCnpj", value)} value={form.trackingTomadorCnpj} />
        </div>

        <div className="grid gap-4 border-2 border-dashed border-[#1a1a1a]/35 p-4 md:grid-cols-2">
          <ProfileFormField autoComplete="username" disabled={disabled} label={integration.credentialsConfigured ? "Novo usuário Braspress" : "Usuário Braspress"} onChange={(value) => setField("username", value)} value={form.username} />
          <ProfileFormField autoComplete="new-password" disabled={disabled} label={integration.credentialsConfigured ? "Nova senha Braspress" : "Senha Braspress"} onChange={(value) => setField("password", value)} type="password" value={form.password} />
          <ProfileFormField autoComplete="current-password" disabled={disabled} label="Sua senha atual" onChange={(value) => setField("currentPassword", value)} type="password" value={form.currentPassword} />
        </div>

        <p className="text-xs leading-5 font-semibold text-[#1a1a1a]/65">
          Usuário e senha são criptografados e nunca voltam para este formulário. Não há cotação de teste ao salvar.
        </p>
        {initialIntegration.loadFailed ? <p className="text-sm font-semibold text-[#c0392b]">Não foi possível ler a configuração atual. Recarregue a página antes de alterar dados.</p> : null}
        <div className="flex flex-wrap items-center gap-4">
          <button className="inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled} type="submit">
            {pending ? "Salvando..." : "Salvar Braspress"}
          </button>
          <span className="text-xs font-semibold text-[#1a1a1a]/65">Versão {integration.configurationVersion}</span>
        </div>
        {integration.credentialsConfigured ? (
          <div className="border-2 border-[#c0392b] bg-[#fff5f3] p-4">
            <p className="text-sm font-black text-[#1a1a1a]">Remover integração</p>
            <p className="mt-1 text-xs leading-5 font-semibold text-[#1a1a1a]/65">
              Esta ação apaga as credenciais criptografadas e desativa a Braspress para a sua loja.
            </p>
            {removing ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button className="inline-flex h-10 cursor-pointer items-center justify-center border-2 border-[#c0392b] bg-[#c0392b] px-4 text-[11px] font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled} onClick={removeIntegration} type="button">
                  {pending ? "Removendo..." : "Confirmar remoção"}
                </button>
                <button className="cursor-pointer text-[11px] font-black uppercase tracking-widest text-[#1a1a1a] underline disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled} onClick={() => setRemoving(false)} type="button">
                  Cancelar
                </button>
              </div>
            ) : (
              <button className="mt-4 cursor-pointer text-[11px] font-black uppercase tracking-widest text-[#c0392b] underline disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled} onClick={() => setRemoving(true)} type="button">
                Remover integração e credenciais
              </button>
            )}
          </div>
        ) : null}
        <FeedbackBanner feedback={feedback} />
      </form>
    </AnchoredSection>
  );
}
