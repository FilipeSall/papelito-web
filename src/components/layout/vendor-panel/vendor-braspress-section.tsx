"use client";

import { type ComponentProps, useState, useTransition } from "react";
import { Building2, KeyRound, LockKeyhole, MapPin, type LucideIcon } from "lucide-react";

import { InfoTooltip } from "@/components/layout/admin-panel/sections/products/components/form-fields";
import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";
import { AnchoredSection } from "@/components/ui/anchored-sections";
import { hardDangerActionClass, hardSecondaryActionClass } from "@/components/ui/hard-actions";
import type { VendorBraspressIntegration } from "@/features/vendor-settings/types/vendor-braspress";
import type { VendorCorreiosPreference } from "@/features/vendor-settings/types/vendor-correios";
import {
  braspressErrorMessage,
  type BraspressAction,
} from "@/features/vendor-settings/utils/braspress-error-message";
import {
  braspressIntegrationState,
  type BraspressIntegrationState,
} from "@/features/vendor-settings/utils/braspress-integration-status";

import { CARRIER_ROUTE_COLUMNS, CarrierRouteRow } from "./carrier-route-row";
import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import { type CorreiosLockReason, VendorCorreiosCarrier } from "./vendor-correios-carrier";
import { VendorReauthModal, type VendorReauthTone } from "./vendor-reauth-modal";

type FormState = {
  enabled: boolean;
  originCep: string;
  password: string;
  username: string;
};

function initialForm(integration: VendorBraspressIntegration): FormState {
  return {
    enabled: integration.enabled,
    originCep: integration.config.originCep,
    password: "",
    username: "",
  };
}

const BRASPRESS_ALERT_TITLE = "Ação necessária";

/**
 * Alerta do estado que exige ação do vendor, acima de tudo na seção.
 *
 * Credencial recusada e conta bloqueada tiram a loja do checkout, e a linha de
 * status sozinha não carrega esse peso: o bloco repete o motivo com destaque
 * para o vendor não sair da tela achando que a Braspress está no ar.
 */
function BraspressStateAlert({ state }: Readonly<{ state: BraspressIntegrationState }>) {
  if (state.tone !== "attention") return null;

  return (
    <FeedbackBanner
      feedback={{ error: true, message: state.description, title: BRASPRESS_ALERT_TITLE }}
      live={false}
    />
  );
}

/**
 * Explicação discreta do estado, dentro do cartão do interruptor.
 *
 * Sai de cena quando o alerta assume o mesmo texto, para o vendor não ler a
 * mesma frase duas vezes na mesma dobra.
 */
function braspressStateHint(state: BraspressIntegrationState) {
  return state.tone === "attention" ? null : state.description;
}

const BRASPRESS_TOOLTIP =
  "Ative somente depois de informar o contrato e a embalagem da sua loja. Sem todos os requisitos, a Braspress não aparece no checkout.";

/**
 * Tooltip do interruptor da Braspress, avisando quando desligá-la religa os
 * Correios — a loja nunca fica com as duas transportadoras desligadas.
 */
function braspressTooltip(correiosEnabled: boolean) {
  return correiosEnabled
    ? BRASPRESS_TOOLTIP
    : `${BRASPRESS_TOOLTIP} Com os Correios desabilitados, desabilitar a Braspress habilita os Correios automaticamente.`;
}

/**
 * Confirmação do interruptor, ou `null` quando ligar não deixou a Braspress ativa.
 *
 * Ligada sem contrato, aguardando a primeira cotação ou com a credencial recusada,
 * ela não entra no checkout; o estado na linha já diz isso, e um "✓ habilitada"
 * prometeria o que não aconteceu.
 */
function toggledMessage(next: boolean, correiosRestored: boolean, saved: VendorBraspressIntegration) {
  if (next) {
    return braspressIntegrationState(saved).tone === "positive"
      ? "✓ Braspress habilitada. Ela aparece no checkout quando também houver cobertura de CEP e embalagem cadastrada."
      : null;
  }

  return correiosRestored
    ? "✓ Braspress desabilitada e Correios habilitados, para a loja não ficar sem transportadora. A credencial continua guardada."
    : "✓ Braspress desabilitada. A credencial continua guardada e você pode habilitar de novo quando quiser.";
}

function correiosLockReason(integration: VendorBraspressIntegration): CorreiosLockReason {
  return integration.status === "unconfigured" ? "unconfigured" : "unreleased";
}

/**
 * Papel da Braspress no checkout, na última coluna do quadro de rotas.
 *
 * Ligada e ativa ela é a principal quando os Correios estão desligados; com os
 * dois ligados, divide o checkout. Recusa, desligamento ou leitura falha a tiram.
 */
function braspressRole(integration: VendorBraspressIntegration, state: BraspressIntegrationState, enabled: boolean) {
  if (integration.loadFailed) return "—";
  if (state.tone === "attention" || !enabled) return "Fora do checkout";
  if (integration.status === "unconfigured") return "Sem contrato";
  if (integration.status === "ready") return "Aguardando 1ª cotação";

  return "Principal";
}

const ROUTE_HEADINGS = ["Transportadora", "Checkout", "Estado", "Papel"];

const EXPIRED_TICKET_CODE = "papelito_vendor_integration_reauth_ticket_invalid";

const REMOVE_COPY: { confirmLabel: string; description: string; title: string; tone: VendorReauthTone } = {
  confirmLabel: "Confirmar remoção",
  description:
    "A credencial criptografada é apagada e a Braspress deixa de ser oferecida no checkout da sua loja. Para voltar a cotar, você cadastra o contrato de novo.",
  title: "Remover integração",
  tone: "danger",
};

/**
 * Estados em que a Braspress recusou a conta e a loja fica fora do checkout.
 *
 * A sondagem do salvamento já devolve esse veredito, então a mesma escrita que
 * o vendor acabou de fazer pode voltar recusada.
 */
function isDegraded(integration: VendorBraspressIntegration) {
  return integration.status === "invalid_credentials" || integration.status === "provider_blocked";
}

function savedMessage(integration: VendorBraspressIntegration) {
  if (integration.status === "invalid_credentials") {
    return "A Braspress recusou o usuário e a senha informados. Revise o contrato e salve o par de novo.";
  }

  if (integration.status === "provider_blocked") {
    return "A credencial foi aceita, mas a Braspress recusou o contrato desta loja. Fale com a transportadora.";
  }

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
 * Resposta de uma escrita da Braspress: o estado da integração e o efeito que
 * ele teve sobre os Correios, que destravam ou voltam a ON junto com ela.
 */
type BraspressWriteResult = {
  correios: VendorCorreiosPreference | null;
  integration: VendorBraspressIntegration;
};

/**
 * Integração devolvida por uma escrita aceita, ou `null` quando o corpo não é um
 * objeto utilizável. Um 200 ilegível não é verdade sobre a loja: adotá-lo apagaria
 * `status`, `enabled` e `config` do estado da tela, que passaria a dizer
 * "Desabilitada" — e a quebrar no render por falta de `config`.
 */
async function readIntegration(response: Response): Promise<BraspressWriteResult | null> {
  const body: unknown = await response.json().catch(() => null);

  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;

  const { correios, ...integration } = body as VendorBraspressIntegration & {
    correios?: VendorCorreiosPreference | null;
  };

  return { correios: correios ?? null, integration: { ...integration, loadFailed: false } };
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
    <div className="border-2 border-dashed border-[#1a1a1a]/35 bg-white p-4">
      <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
        <KeyRound aria-hidden="true" className="size-4 text-[#15803d]" strokeWidth={2.4} />
        Credencial Braspress
      </h3>
      <p className="mt-2 text-xs leading-5 font-semibold text-[#1a1a1a]/65">
        Usuário e senha estão salvos e criptografados. Eles nunca voltam para esta tela — para trocar
        de contrato, cadastre o par novo.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
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

type VendorBraspressSectionProps = {
  /** A leitura das configurações falhou: o interruptor dos Correios fica travado. */
  correiosLoadFailed: boolean;
  /** Estado efetivo dos Correios, já com a dependência da Braspress aplicada. */
  initialCorreios: VendorCorreiosPreference;
  initialIntegration: VendorBraspressIntegration;
};

/**
 * Transportadoras da loja: os Correios, travados em ON até a Braspress estar
 * configurada, e a Braspress, em três estados: cadastro inicial, credencial
 * conectada com as ações de alterar e remover, e formulário de troca liberado.
 *
 * Cadastrar, trocar e salvar a credencial não pedem confirmação de senha: o par
 * é write-only e uma troca é corrigível cadastrando o par certo de novo. Só a
 * remoção passa pelo modal, porque apaga o envelope cifrado sem volta.
 */
export function VendorBraspressSection({
  correiosLoadFailed,
  initialCorreios,
  initialIntegration,
}: Readonly<VendorBraspressSectionProps>) {
  const [form, setForm] = useState(() => initialForm(initialIntegration));
  const [integration, setIntegration] = useState(initialIntegration);
  const [correios, setCorreios] = useState(initialCorreios);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [pending, startTransition] = useTransition();
  const [correiosBusy, setCorreiosBusy] = useState(false);

  const state = braspressIntegrationState(integration);
  const disabled = initialIntegration.loadFailed || pending || correiosBusy;
  const showCredentialFields = !integration.credentialsConfigured || editing;
  const idleSubmitLabel = editing ? "Salvar credenciais" : "Salvar Braspress";
  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  function markStateUnread(action: BraspressAction) {
    setIntegration((current) => ({ ...current, loadFailed: true }));
    setFeedback({ error: true, message: `⚠ ${UNREAD_AFTER_WRITE[action]}` });
  }

  function adoptCorreios(next: VendorCorreiosPreference | null) {
    if (next) setCorreios(next);
  }

  /**
   * Adota a escrita dos Correios, que pode ter ligado a Braspress no servidor.
   *
   * Com a integração completa na resposta, adota também o estado de saúde que a
   * sondagem gravou; o rascunho de usuário, senha e CEP em tela continua do vendor.
   */
  function adoptCorreiosWrite(
    next: VendorCorreiosPreference,
    braspressEnabled: boolean | null,
    braspress: VendorBraspressIntegration | null,
  ) {
    setCorreios(next);

    if (braspress) {
      setIntegration(braspress);
      setField("enabled", braspress.enabled);
      return;
    }

    if (braspressEnabled !== true || form.enabled) return;

    setField("enabled", true);
    setIntegration((current) => ({ ...current, enabled: true }));
  }

  function adoptSaved(action: BraspressAction, { correios: nextCorreios, integration: saved }: BraspressWriteResult) {
    adoptCorreios(nextCorreios);
    setIntegration(saved);
    setEditing(false);
    setForm(initialForm(saved));
    const degraded = isDegraded(saved);
    const mark = degraded ? "⚠" : "✓";
    const message =
      action === "remove"
        ? "✓ Integração Braspress e credenciais removidas."
        : `${mark} ${savedMessage(saved)}`;

    setFeedback({ error: degraded, message });
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

        const correiosRestored = !correios.enabled && saved.correios?.enabled === true;
        adoptCorreios(saved.correios);
        setIntegration(saved.integration);
        const message = toggledMessage(next, correiosRestored, saved.integration);
        setFeedback(message ? { error: false, message } : null);
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

          if (code === EXPIRED_TICKET_CODE && action === "remove") {
            setConfirmingRemoval(true);
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

        adoptSaved(action, saved);
      } catch {
        setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Tente novamente." });
      }
    });
  }

  function credentialPayload() {
    return {
      enabled: form.enabled,
      originCep: form.originCep,
      password: form.password,
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

    applyWrite("save", "PUT", credentialPayload());
  }

  function handleRemovalTicket(issued: string) {
    setConfirmingRemoval(false);
    applyWrite("remove", "DELETE", { reauthTicket: issued });
  }

  function cancelEditing() {
    setEditing(false);
    setFeedback(null);
    setForm((current) => ({ ...current, password: "", username: "" }));
  }

  return (
    <AnchoredSection
      bodyClassName="bg-white"
      description="Escolha as transportadoras do checkout da sua loja. A Braspress só aparece quando a integração estiver completa, habilitada e a embalagem aprovada."
      id="transportadoras"
      title="Transportadoras"
    >
      <form onSubmit={submit}>
        <div
          aria-hidden="true"
          className={`hidden gap-x-4 border-b-2 border-[#1a1a1a] px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60 md:grid ${CARRIER_ROUTE_COLUMNS}`}
        >
          {ROUTE_HEADINGS.map((heading) => (
            <span key={heading}>{heading}</span>
          ))}
        </div>

        <div className="divide-y-2 divide-[#1a1a1a]/10">
          <VendorCorreiosCarrier
            braspressEnabled={form.enabled}
            disabled={pending}
            loadFailed={correiosLoadFailed}
            lockReason={correiosLockReason(integration)}
            onBusyChange={setCorreiosBusy}
            onSaved={adoptCorreiosWrite}
            preference={correios}
          />

          <CarrierRouteRow
            carrier="Braspress"
            checked={form.enabled}
            disabled={disabled}
            hint={braspressStateHint(state)}
            id="vendor-braspress-enabled"
            onChange={toggleEnabled}
            role={braspressRole(integration, state, form.enabled)}
            statusLabel={state.label}
            statusTone={state.tone}
            switchTone={state.tone === "positive" ? "positive" : "brand"}
            tooltip={braspressTooltip(correios.enabled)}
          >
            <div className="space-y-4 px-5 pb-5 empty:hidden md:px-6">
              <BraspressStateAlert state={state} />
              {form.enabled ? (
                <div className="space-y-5 border-2 border-[#1a1a1a] bg-[#fbf7ef] p-4 md:p-5">
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
                      onEdit={() => setEditing(true)}
                      onRemove={() => setConfirmingRemoval(true)}
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
                      className="inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-[0.18em] text-white transition-shadow hover:shadow-[3px_3px_0px_#1a1a1a] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none max-sm:w-full"
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
                </div>
              ) : null}
              <FeedbackBanner feedback={feedback} />
            </div>
          </CarrierRouteRow>
        </div>

        <p className="border-t-2 border-[#1a1a1a] bg-[#fbf7ef] px-5 py-4 text-xs leading-5 font-semibold text-[#1a1a1a]/65 md:px-6">
          A loja nunca fica sem transportadora: desligar uma liga a outra, e os Correios entram sozinhos se a
          Braspress falhar.
        </p>
      </form>

      <VendorReauthModal
        confirmLabel={REMOVE_COPY.confirmLabel}
        description={REMOVE_COPY.description}
        isSubmitting={pending}
        onClose={() => setConfirmingRemoval(false)}
        onTicket={handleRemovalTicket}
        open={confirmingRemoval}
        title={REMOVE_COPY.title}
        tone={REMOVE_COPY.tone}
      />
    </AnchoredSection>
  );
}
