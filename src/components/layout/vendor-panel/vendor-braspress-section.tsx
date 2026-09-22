"use client";

import { type ComponentProps, useState, useTransition } from "react";
import { Building2, KeyRound, LockKeyhole, MapPin, type LucideIcon } from "lucide-react";

import { InfoTooltip } from "@/components/layout/admin-panel/sections/products/components/form-fields";
import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";
import { AnchoredSection } from "@/components/ui/anchored-sections";
import { hardDangerActionClass, hardSecondaryActionClass } from "@/components/ui/hard-actions";
import { HardSwitch } from "@/components/ui/hard-switch";
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
import { VendorReauthModal, type VendorReauthTone } from "./vendor-reauth-modal";

type FormState = {
  enabled: boolean;
  originCep: string;
  password: string;
  username: string;
};

/** Por que a senha da conta está sendo pedida agora. */
type ReauthIntent = "remove" | "reveal" | "save";

function initialForm(integration: VendorBraspressIntegration): FormState {
  return {
    enabled: integration.enabled,
    originCep: integration.config.originCep,
    password: "",
    username: "",
  };
}

const TONE_CLASS: Record<BraspressStateTone, string> = {
  attention: "text-[#c0392b]",
  neutral: "text-[#1a1a1a]/65",
  positive: "text-[#1a1a1a]",
};

const EXPIRED_TICKET_CODE = "papelito_vendor_integration_reauth_ticket_invalid";

const REAUTH_COPY: Record<
  ReauthIntent,
  { confirmLabel: string; description: string; title: string; tone: VendorReauthTone }
> = {
  remove: {
    confirmLabel: "Confirmar remoção",
    description:
      "A credencial criptografada é apagada e a Braspress deixa de ser oferecida no checkout da sua loja. Para voltar a cotar, você cadastra o contrato de novo.",
    title: "Remover integração",
    tone: "danger",
  },
  reveal: {
    confirmLabel: "Confirmar senha",
    description:
      "Trocar a credencial da Braspress é uma alteração sensível, e a credencial salva nunca volta para a tela. Confirme sua senha para liberar o formulário.",
    title: "Confirme sua senha",
    tone: "default",
  },
  save: {
    confirmLabel: "Confirmar e salvar",
    description:
      "Confirme sua senha para gravar a credencial da Braspress. Ela é criptografada e não aparece mais nesta tela depois de salva.",
    title: "Confirme sua senha",
    tone: "default",
  },
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

const UNREAD_AFTER_WRITE: Record<BraspressAction, string> = {
  reauth: "A confirmação foi aceita, mas não foi possível ler como a Braspress ficou. Recarregue a página antes de mexer de novo.",
  remove:
    "A remoção foi aceita, mas não foi possível ler como a Braspress ficou. Recarregue a página antes de mexer de novo.",
  save: "A alteração foi aceita, mas não foi possível ler como a Braspress ficou. Recarregue a página antes de mexer de novo.",
};

/**
 * Integração devolvida por uma escrita aceita, ou `null` quando o corpo não é um
 * objeto utilizável. Um 200 ilegível não é verdade sobre a loja: adotá-lo apagaria
 * `status`, `enabled` e `config` do estado da tela, que passaria a dizer
 * "Desabilitada" — e a quebrar no render por falta de `config`.
 */
async function readIntegration(response: Response): Promise<VendorBraspressIntegration | null> {
  const body: unknown = await response.json().catch(() => null);

  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;

  return body as VendorBraspressIntegration;
}

/** Código do erro devolvido pela rota, que é o que a tela traduz — nunca a `message`. */
async function readErrorCode(response: Response): Promise<string | undefined> {
  const body = (await response.json().catch(() => null)) as { code?: string } | null;

  return body?.code;
}

/** Escrita da integração; a rota do Next é a mesma para gravar e para remover. */
function mutateBraspress(method: "DELETE" | "PUT", body: Record<string, unknown>) {
  return fetch("/api/vendor/braspress", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
  });
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

/**
 * Estado da credencial já salva, com as duas ações que ela admite.
 *
 * Substitui o formulário de troca enquanto ele não foi liberado: a credencial é
 * write-only, então não há o que exibir aqui além do fato de existir.
 */
function BraspressConnectedPanel({
  disabled,
  onEdit,
  onRemove,
}: Readonly<{ disabled: boolean; onEdit: () => void; onRemove: () => void }>) {
  return (
    <div className="border-2 border-[#1a1a1a] bg-white p-4 shadow-[4px_4px_0px_#1a1a1a]">
      <div className="flex items-center gap-2">
        <span aria-hidden className="h-3 w-3 rotate-45 bg-brand-yellow" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          Credencial Braspress
        </h3>
      </div>
      <p className="mt-2 text-xs leading-5 font-semibold text-[#1a1a1a]/65">
        Usuário e senha estão salvos e criptografados. Eles nunca voltam para esta tela — para trocar
        de contrato, cadastre o par novo.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          aria-haspopup="dialog"
          className={hardSecondaryActionClass}
          disabled={disabled}
          onClick={onEdit}
          type="button"
        >
          Alterar dados Braspress
        </button>
        <button
          aria-haspopup="dialog"
          className={hardDangerActionClass}
          disabled={disabled}
          onClick={onRemove}
          type="button"
        >
          Remover integração
        </button>
      </div>
    </div>
  );
}

/** Par usuário/senha do contrato com a Braspress, sempre write-only. */
function BraspressCredentialFields({
  disabled,
  onChange,
  password,
  replacing,
  username,
}: Readonly<{
  disabled: boolean;
  onChange: (field: "password" | "username", value: string) => void;
  password: string;
  replacing: boolean;
  username: string;
}>) {
  return (
    <div className="grid gap-4 border-2 border-dashed border-[#1a1a1a]/35 p-4 md:grid-cols-2">
      <p className="text-xs font-semibold text-[#1a1a1a]/65 md:col-span-2">
        {replacing
          ? "Informe o par novo. Ele substitui a credencial salva assim que você salvar."
          : "Informe o usuário e a senha do contrato da sua loja com a Braspress."}
      </p>
      <BraspressField
        autoComplete="username"
        disabled={disabled}
        helpText="Usuário da API fornecido para o contrato desta loja. Ele não será exibido depois de salvo."
        icon={KeyRound}
        label={replacing ? "Novo usuário Braspress" : "Usuário Braspress"}
        onChange={(value) => onChange("username", value)}
        value={username}
      />
      <BraspressField
        autoComplete="new-password"
        disabled={disabled}
        helpText="Senha da API. É criptografada e nunca volta para a tela depois de salva."
        icon={LockKeyhole}
        label={replacing ? "Nova senha Braspress" : "Senha Braspress"}
        onChange={(value) => onChange("password", value)}
        type="password"
        value={password}
      />
    </div>
  );
}

/**
 * Configuração da Braspress da loja, em três estados: cadastro inicial, credencial
 * conectada com as ações de alterar e remover, e formulário de troca liberado.
 *
 * Toda mutação que toca a credencial passa antes pelo modal que confirma a senha
 * da conta no servidor; o que atravessa daqui para o backend é o tíquete que ele
 * devolve, nunca a senha. Trocar o CEP de origem ou o interruptor não exige
 * confirmação, porque são reversíveis e visíveis na própria tela.
 */
export function VendorBraspressSection({
  initialIntegration,
}: Readonly<{
  initialIntegration: VendorBraspressIntegration;
}>) {
  const [form, setForm] = useState(() => initialForm(initialIntegration));
  const [integration, setIntegration] = useState(initialIntegration);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [editing, setEditing] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [reauthIntent, setReauthIntent] = useState<ReauthIntent | null>(null);
  const [pending, startTransition] = useTransition();

  const state = braspressIntegrationState(integration);
  const disabled = initialIntegration.loadFailed || pending;
  const showCredentialFields = !integration.credentialsConfigured || editing;
  const idleSubmitLabel = editing ? "Salvar credenciais" : "Salvar Braspress";
  const reauthCopy = REAUTH_COPY[reauthIntent ?? "reveal"];
  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  function markStateUnread(action: BraspressAction) {
    setIntegration((current) => ({ ...current, loadFailed: true }));
    setFeedback({ error: true, message: `⚠ ${UNREAD_AFTER_WRITE[action]}` });
  }

  function adoptSaved(action: BraspressAction, saved: VendorBraspressIntegration) {
    setIntegration(saved);
    setTicket(null);
    setEditing(false);
    setForm(initialForm(saved));
    setFeedback({
      error: false,
      message:
        action === "remove"
          ? "✓ Integração Braspress e credenciais removidas."
          : `✓ ${savedMessage(saved)}`,
    });
  }

  /**
   * Liga ou desliga a Braspress na hora, sem passar pelo botão de salvar.
   *
   * O interruptor é a única coisa nesta tela que promete efeito imediato, e
   * gravá-lo não toca na credencial — por isso não pede confirmação de senha e
   * não espera o formulário. O que o vendor estiver digitando no par
   * usuário/senha é preservado: a resposta traz o estado do servidor, mas o
   * rascunho em tela continua sendo dele.
   */
  function toggleEnabled(next: boolean) {
    setField("enabled", next);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await mutateBraspress("PUT", { enabled: next, originCep: form.originCep });

        if (!response.ok) {
          const code = await readErrorCode(response);
          setField("enabled", !next);
          setFeedback({
            error: true,
            message: `⚠ ${braspressErrorMessage({ code, status: response.status }, "save")}`,
          });
          return;
        }

        const saved = await readIntegration(response);

        if (!saved) {
          markStateUnread("save");
          return;
        }

        setIntegration({ ...saved, loadFailed: false });
        setFeedback({
          error: false,
          message: next
            ? "✓ Braspress habilitada. Ela aparece no checkout quando também houver cobertura de CEP e embalagem cadastrada."
            : "✓ Braspress desabilitada. A credencial continua guardada e você pode habilitar de novo quando quiser.",
        });
      } catch {
        setField("enabled", !next);
        setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Tente novamente." });
      }
    });
  }

  function applyWrite(action: BraspressAction, method: "DELETE" | "PUT", body: Record<string, unknown>) {
    startTransition(async () => {
      try {
        const response = await mutateBraspress(method, body);

        if (!response.ok) {
          const code = await readErrorCode(response);

          if (code === EXPIRED_TICKET_CODE) {
            setTicket(null);
            setReauthIntent(action === "remove" ? "remove" : "save");
            return;
          }

          setFeedback({
            error: true,
            message: `⚠ ${braspressErrorMessage({ code, status: response.status }, action)}`,
          });
          return;
        }

        const saved = await readIntegration(response);

        if (!saved) {
          markStateUnread(action);
          return;
        }

        adoptSaved(action, { ...saved, loadFailed: false });
      } catch {
        setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Tente novamente." });
      }
    });
  }

  function credentialPayload(proof: string) {
    return {
      enabled: form.enabled,
      originCep: form.originCep,
      password: form.password,
      reauthTicket: proof,
      username: form.username,
    };
  }

  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const typedUsername = form.username.trim() !== "";
    const typedPassword = form.password !== "";

    if (typedUsername !== typedPassword) {
      setFeedback({
        error: true,
        message: "⚠ Informe usuário e senha juntos. Deixe os dois em branco para manter a credencial salva.",
      });
      return;
    }

    if (editing && !typedUsername) {
      setFeedback({ error: true, message: "⚠ Informe o par novo ou cancele a alteração." });
      return;
    }

    if (!typedUsername) {
      applyWrite("save", "PUT", { enabled: form.enabled, originCep: form.originCep });
      return;
    }

    if (ticket) {
      applyWrite("save", "PUT", credentialPayload(ticket));
      return;
    }

    setReauthIntent("save");
  }

  function handleTicket(issued: string) {
    const intent = reauthIntent;
    setReauthIntent(null);

    if (intent === "reveal") {
      setFeedback(null);
      setTicket(issued);
      setEditing(true);
      return;
    }

    if (intent === "remove") {
      applyWrite("remove", "DELETE", { reauthTicket: issued });
      return;
    }

    applyWrite("save", "PUT", credentialPayload(issued));
  }

  function cancelEditing() {
    setEditing(false);
    setTicket(null);
    setFeedback(null);
    setForm((current) => ({ ...current, password: "", username: "" }));
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
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-[#1a1a1a]" id="vendor-braspress-enabled-label">
              Habilitar Braspress
            </span>
            <HardSwitch
              ariaLabel="Habilitar Braspress"
              checked={form.enabled}
              disabled={disabled}
              id="vendor-braspress-enabled"
              onChange={toggleEnabled}
            />
            <InfoTooltip text="Ative somente depois de informar o contrato e a embalagem da sua loja. Sem todos os requisitos, a Braspress não aparece no checkout." />
          </div>
          <p className="w-full text-xs leading-5 font-semibold text-[#1a1a1a]/65">{state.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <BraspressField
            disabled
            disabledClassName="disabled:cursor-not-allowed disabled:border-[#a8a29e] disabled:bg-[#eeece5] disabled:text-[#57534e]"
            helpText="É o CNPJ da sua loja, o mesmo que emite a nota. Para alterar, mude o cadastro."
            icon={Building2}
            inputClassName="border-[#a8a29e] bg-[#eeece5] text-[#57534e]"
            inputMode="numeric"
            label="CNPJ remetente"
            placeholder="Complete o CNPJ no cadastro da sua loja"
            value={formatCnpj(integration.config.senderCnpj)}
          />
          <BraspressField
            disabled={disabled}
            helpText="CEP do local de onde a Braspress coleta os pedidos desta loja, conforme o seu contrato. Em branco, usamos o CEP do cadastro."
            icon={MapPin}
            inputMode="numeric"
            label="CEP de origem"
            onChange={(value) => setField("originCep", value)}
            value={form.originCep}
          />
        </div>

        {showCredentialFields ? (
          <BraspressCredentialFields
            disabled={disabled}
            onChange={setField}
            password={form.password}
            replacing={editing}
            username={form.username}
          />
        ) : (
          <BraspressConnectedPanel
            disabled={disabled}
            onEdit={() => setReauthIntent("reveal")}
            onRemove={() => setReauthIntent("remove")}
          />
        )}

        {showCredentialFields ? (
          <p className="text-xs leading-5 font-semibold text-[#1a1a1a]/65">
            Usuário e senha são criptografados e nunca voltam para este formulário. Não há cotação de
            teste ao salvar.
          </p>
        ) : null}
        {initialIntegration.loadFailed ? (
          <p className="text-sm font-semibold text-[#c0392b]">
            Não foi possível ler a configuração atual. Recarregue a página antes de alterar dados.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <button
            className="inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            disabled={disabled}
            type="submit"
          >
            {pending ? "Salvando..." : idleSubmitLabel}
          </button>
          {editing ? (
            <button
              className="cursor-pointer text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={disabled}
              onClick={cancelEditing}
              type="button"
            >
              Cancelar alteração
            </button>
          ) : null}
        </div>
        <FeedbackBanner feedback={feedback} />
      </form>

      <VendorReauthModal
        confirmLabel={reauthCopy.confirmLabel}
        description={reauthCopy.description}
        isSubmitting={pending}
        onClose={() => setReauthIntent(null)}
        onTicket={handleTicket}
        open={reauthIntent !== null}
        title={reauthCopy.title}
        tone={reauthCopy.tone}
      />
    </AnchoredSection>
  );
}
