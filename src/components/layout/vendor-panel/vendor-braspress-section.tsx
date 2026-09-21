"use client";

import { type ComponentProps, useState, useTransition } from "react";
import { Building2, KeyRound, LockKeyhole, MapPin, type LucideIcon } from "lucide-react";

import { InfoTooltip } from "@/components/layout/admin-panel/sections/products/components/form-fields";
import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";
import { AnchoredSection } from "@/components/ui/anchored-sections";
import type { VendorBraspressIntegration } from "@/features/vendor-settings/types/vendor-braspress";
import {
  braspressErrorMessage,
  type BraspressAction,
} from "@/features/vendor-settings/utils/braspress-error-message";
import {
  braspressIntegrationState,
  type BraspressStateTone,
} from "@/features/vendor-settings/utils/braspress-integration-status";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";

type FormState = {
  enabled: boolean;
  originCep: string;
  username: string;
  password: string;
  currentPassword: string;
};

function initialForm(integration: VendorBraspressIntegration): FormState {
  return {
    enabled: integration.enabled,
    originCep: integration.config.originCep,
    username: "",
    password: "",
    currentPassword: "",
  };
}

const TONE_CLASS: Record<BraspressStateTone, string> = {
  attention: "text-[#c0392b]",
  neutral: "text-[#1a1a1a]/65",
  positive: "text-[#1a1a1a]",
};

function savedMessage(integration: VendorBraspressIntegration) {
  if (integration.status === "unconfigured") {
    return "Configuração salva. Falta informar usuário, senha e o CEP de origem para a Braspress ficar pronta.";
  }

  if (!integration.enabled) {
    return "Configuração salva. A Braspress continua desabilitada e não é oferecida no checkout desta loja.";
  }

  if (integration.status === "ready") {
    return "Integração Braspress salva. Ela ainda não aparece no checkout: a conta é ativada sozinha na primeira cotação que der certo.";
  }

  return "Integração Braspress salva. As credenciais não são exibidas novamente.";
}

async function readError(response: Response, action: BraspressAction) {
  const body = (await response.json().catch(() => null)) as { code?: string } | null;

  return braspressErrorMessage({ code: body?.code, status: response.status }, action);
}

function formatCnpj(value: string) {
  if (value.length !== 14) return value;

  return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`;
}

type BraspressFieldProps = ComponentProps<typeof ProfileFormField> & {
  helpText: string;
  icon: LucideIcon;
};

function BraspressField({ helpText, icon: Icon, ...props }: Readonly<BraspressFieldProps>) {
  return (
    <ProfileFormField
      {...props}
      labelAccessory={<InfoTooltip text={helpText} />}
      startAdornment={<Icon className="h-4 w-4" strokeWidth={2.25} />}
    />
  );
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

  const state = braspressIntegrationState(integration);
  const disabled = initialIntegration.loadFailed || pending;
  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!form.currentPassword) {
      setFeedback({ error: true, message: "⚠ Confirme sua senha atual para salvar a integração." });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/vendor/braspress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          setFeedback({ error: true, message: `⚠ ${await readError(response, "save")}` });
          return;
        }

        const saved = {
          ...((await response.json().catch(() => null)) as VendorBraspressIntegration),
          loadFailed: false,
        };

        setIntegration(saved);
        setForm((current) => ({ ...current, username: "", password: "", currentPassword: "" }));
        setFeedback({ error: false, message: `✓ ${savedMessage(saved)}` });
      } catch {
        setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Tente novamente." });
      }
    });
  }

  function removeIntegration() {
    if (!form.currentPassword) {
      setFeedback({ error: true, message: "⚠ Confirme sua senha atual para remover a integração." });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/vendor/braspress", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: form.currentPassword }),
        });

        if (!response.ok) {
          setFeedback({ error: true, message: `⚠ ${await readError(response, "remove")}` });
          return;
        }

        const next = {
          ...((await response.json().catch(() => null)) as VendorBraspressIntegration),
          loadFailed: false,
        };
        setIntegration(next);
        setForm(initialForm(next));
        setRemoving(false);
        setFeedback({ error: false, message: "✓ Integração Braspress e credenciais removidas." });
      } catch {
        setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Tente novamente." });
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
            <p className={`text-xs font-black ${TONE_CLASS[state.tone]}`}>{state.label}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <label
              className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#1a1a1a]"
              htmlFor="vendor-braspress-enabled"
            >
              <input
                checked={form.enabled}
                className="cursor-pointer accent-brand-yellow disabled:cursor-not-allowed"
                disabled={disabled}
                id="vendor-braspress-enabled"
                onChange={(event) => setField("enabled", event.target.checked)}
                type="checkbox"
              />
              Habilitar Braspress
            </label>
            <InfoTooltip text="Ative somente depois de informar o contrato e a embalagem da sua loja. Sem todos os requisitos, a Braspress não aparece no checkout." />
          </div>
          <p className="w-full text-xs leading-5 font-semibold text-[#1a1a1a]/65">{state.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <BraspressField disabled disabledClassName="disabled:cursor-not-allowed disabled:border-[#a8a29e] disabled:bg-[#eeece5] disabled:text-[#57534e]" helpText="É o CNPJ da sua loja, o mesmo que emite a nota. Para alterar, mude o cadastro." icon={Building2} inputClassName="border-[#a8a29e] bg-[#eeece5] text-[#57534e]" inputMode="numeric" label="CNPJ remetente" placeholder="Complete o CNPJ no cadastro da sua loja" value={formatCnpj(integration.config.senderCnpj)} />
          <BraspressField disabled={disabled} helpText="CEP do local de onde a Braspress coleta os pedidos desta loja, conforme o seu contrato. Em branco, usamos o CEP do cadastro." icon={MapPin} inputMode="numeric" label="CEP de origem" onChange={(value) => setField("originCep", value)} value={form.originCep} />
        </div>

        <div className="grid gap-4 border-2 border-dashed border-[#1a1a1a]/35 p-4 md:grid-cols-2">
          <p className="text-xs font-semibold text-[#1a1a1a]/65 md:col-span-2">
            {integration.credentialsConfigured
              ? "Credencial salva. Deixe usuário e senha em branco para mantê-la; preencha os dois para substituí-la."
              : "Informe o usuário e a senha do contrato da sua loja com a Braspress."}
          </p>
          <BraspressField autoComplete="username" disabled={disabled} helpText="Usuário da API fornecido para o contrato desta loja. Ele não será exibido depois de salvo." icon={KeyRound} label={integration.credentialsConfigured ? "Novo usuário Braspress" : "Usuário Braspress"} onChange={(value) => setField("username", value)} value={form.username} />
          <BraspressField autoComplete="new-password" disabled={disabled} helpText="Senha da API. É criptografada e nunca volta para a tela depois de salva." icon={LockKeyhole} label={integration.credentialsConfigured ? "Nova senha Braspress" : "Senha Braspress"} onChange={(value) => setField("password", value)} type="password" value={form.password} />
          <BraspressField autoComplete="current-password" disabled={disabled} helpText="Sua senha Papelito confirma alterações de credencial e remoção da integração." icon={LockKeyhole} label="Sua senha atual" onChange={(value) => setField("currentPassword", value)} type="password" value={form.currentPassword} />
        </div>

        <p className="text-xs leading-5 font-semibold text-[#1a1a1a]/65">
          Usuário e senha são criptografados e nunca voltam para este formulário. Não há cotação de teste ao salvar.
        </p>
        {initialIntegration.loadFailed ? <p className="text-sm font-semibold text-[#c0392b]">Não foi possível ler a configuração atual. Recarregue a página antes de alterar dados.</p> : null}
        <div className="flex flex-wrap items-center gap-4">
          <button className="inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled} type="submit">
            {pending ? "Salvando..." : "Salvar Braspress"}
          </button>
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
