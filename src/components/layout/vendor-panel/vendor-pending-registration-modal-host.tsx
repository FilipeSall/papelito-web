"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { VendorFormSections } from "@/components/shared/vendor-form/vendor-form-sections";
import {
  VENDOR_PENDING_FIELD_LABELS,
  isVendorPendingFieldKey,
  type VendorPendingFieldKey,
} from "@/features/revendedor/constants/pending-registration";
import type { VendorPendingRegistrationResponse } from "@/features/revendedor/types/revendedor-application";
import { useVendorForm } from "@/features/vendor-registration/hooks/use-vendor-form";
import {
  buildVendorRegistrationPayload,
  createVendorFormValuesFromRegistration,
  validateVendorFormValues,
} from "@/features/vendor-registration/vendor-form-values";
import { useAuthSession } from "@/hooks/use-auth-session";

type VendorPendingRegistrationModalHostProps = {
  dismissible?: boolean;
  mode?: "modal" | "page";
  returnTo?: string;
};

type MessageTone = "error" | "success";

type SecondaryActionProps = {
  busy: boolean;
  dismissible: boolean;
  onDismiss: () => void;
  onReturn: () => void;
  showReturn: boolean;
};

const SECONDARY_BUTTON_CLASS =
  "inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Rotulo do botao principal nos tres estados possiveis da submissao.
 *
 * O redirecionamento para o painel espera o layout do vendor renderizar no servidor, entao o
 * botao continua anunciando trabalho em curso depois que a gravacao terminou.
 */
function saveButtonLabel(saving: boolean, navigating: boolean): string {
  if (saving) return "Salvando...";
  if (navigating) return "Abrindo painel...";

  return "Salvar cadastro";
}

function toPendingFieldKeyList(value: unknown): VendorPendingFieldKey[] {
  return Array.isArray(value)
    ? value.filter(
        (field): field is VendorPendingFieldKey =>
          typeof field === "string" && isVendorPendingFieldKey(field),
      )
    : [];
}

function overlayClassName(isPageMode: boolean): string {
  return isPageMode
    ? "space-y-4 md:space-y-5"
    : "fixed inset-0 z-80 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8";
}

function panelClassName(isPageMode: boolean): string {
  const variant = isPageMode
    ? "shadow-[8px_8px_0px_rgba(35,31,32,0.08)]"
    : "max-w-5xl shadow-[8px_8px_0px_#1a1a1a]";

  return `relative w-full border-2 border-[#1a1a1a] bg-[#faf8f2] ${variant}`;
}

function PendingRegistrationLoading() {
  return (
    <div className="px-6 py-8">
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] px-5 py-4 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
        Carregando cadastro complementar...
      </div>
    </div>
  );
}

/**
 * Acao secundaria do cabecalho: fechar o modal ou voltar ao painel.
 *
 * O onboarding em pagina nao e dispensavel, entao so oferece a saida depois que nao ha mais
 * campo pendente — antes disso o vendor nao tem para onde voltar.
 */
function HeaderSecondaryAction({
  busy,
  dismissible,
  onDismiss,
  onReturn,
  showReturn,
}: SecondaryActionProps) {
  if (dismissible) {
    return (
      <button
        aria-label="Fechar"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-transparent text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
        disabled={busy}
        onClick={onDismiss}
        type="button"
      >
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>
    );
  }

  if (!showReturn) return null;

  return (
    <button className={SECONDARY_BUTTON_CLASS} disabled={busy} onClick={onReturn} type="button">
      Voltar
    </button>
  );
}

function PendingRegistrationHeader({
  hasPendingFields,
  ...secondaryAction
}: SecondaryActionProps & { hasPendingFields: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-5">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
          Cadastro complementar do vendor
        </p>
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
          Complete ou ajuste seus dados
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1a1a1a]/70">
          {hasPendingFields
            ? "Seu cadastro foi iniciado pelo time Papelito. Revise os dados preenchidos, ajuste o que for necessário e complete as pendências obrigatorias para liberar suas vendas no marketplace."
            : "Revise os dados cadastrais e financeiros usados no onboarding do recebedor antes de voltar ao painel."}
        </p>
      </div>
      <HeaderSecondaryAction {...secondaryAction} />
    </div>
  );
}

function PendingFieldsChips({ pendingFields }: { pendingFields: VendorPendingFieldKey[] }) {
  if (pendingFields.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {pendingFields.map((field) => (
        <span
          className="border-2 border-[#1a1a1a] bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1a1a1a]"
          key={field}
        >
          {VENDOR_PENDING_FIELD_LABELS[field]}
        </span>
      ))}
    </div>
  );
}

function PendingFieldsNotice({ pendingFields }: { pendingFields: VendorPendingFieldKey[] }) {
  return (
    <div className="border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
      <p className="font-black uppercase tracking-[0.16em]">Campos pendentes agora</p>
      <p className="mt-2 leading-6 text-[#1a1a1a]/80">
        {pendingFields.length > 0
          ? "Enquanto este cadastro permanecer incompleto, sua conta continua bloqueada para receber pedidos e vender."
          : "Seu cadastro esta completo. Qualquer ajuste salvo aqui passa a ser a fonte de verdade do onboarding do vendor."}
      </p>
      <PendingFieldsChips pendingFields={pendingFields} />
    </div>
  );
}

function FormErrorAlert({ formError }: { formError: string | null }) {
  if (!formError) return null;

  return (
    <div className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3" role="alert">
      <p className="text-sm font-bold text-[#c0392b]">⚠ {formError}</p>
    </div>
  );
}

function StatusMessage({ message, tone }: { message: string | null; tone: MessageTone }) {
  if (!message) return null;

  const toneClass =
    tone === "error"
      ? "border-[#c0392b] bg-[#c0392b]/10 text-[#c0392b]"
      : "border-[#1a1a1a] bg-brand-yellow/40 text-[#1a1a1a]";

  return (
    <div aria-live="polite" className={`border-2 px-4 py-3 text-sm font-bold ${toneClass}`}>
      {message}
    </div>
  );
}

function FooterSecondaryAction({
  busy,
  dismissible,
  onDismiss,
  onReturn,
  showReturn,
}: SecondaryActionProps) {
  if (dismissible) {
    return (
      <button className={SECONDARY_BUTTON_CLASS} disabled={busy} onClick={onDismiss} type="button">
        Pular por agora
      </button>
    );
  }

  if (!showReturn) return null;

  return (
    <button className={SECONDARY_BUTTON_CLASS} disabled={busy} onClick={onReturn} type="button">
      Voltar ao painel
    </button>
  );
}

function PendingRegistrationFooter({
  navigating,
  onSave,
  saving,
  ...secondaryAction
}: SecondaryActionProps & { navigating: boolean; onSave: () => void; saving: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 border-t-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-4">
      <FooterSecondaryAction {...secondaryAction} />
      <button
        className="inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={secondaryAction.busy}
        onClick={onSave}
        type="button"
      >
        {saveButtonLabel(saving, navigating)}
      </button>
    </div>
  );
}

export function VendorPendingRegistrationModalHost({
  dismissible = true,
  mode = "modal",
  returnTo,
}: VendorPendingRegistrationModalHostProps = {}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isSessionLoading, isSeller, session } = useAuthSession();
  const [pendingFields, setPendingFields] = useState<VendorPendingFieldKey[] | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>("success");
  const [formError, setFormError] = useState<string | null>(null);
  const [navigating, startNavigation] = useTransition();
  const isPageMode = mode === "page";
  const busy = saving || navigating;

  const clearFeedback = useCallback(() => {
    setFormError(null);
    setMessage(null);
  }, []);

  const controller = useVendorForm({ onDirty: clearFeedback });
  const { resetValues, values } = controller;

  useEffect(() => {
    setDismissed(false);
    setMessage(null);
    setFormError(null);
  }, [session?.accessToken]);

  useEffect(() => {
    if (isSessionLoading) return;

    if (!isAuthenticated || !isSeller) {
      setPendingFields(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const response = await fetch("/api/vendor/registration-pending", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          if (!cancelled) setPendingFields(null);
          return;
        }

        const payload = (await response.json()) as VendorPendingRegistrationResponse;
        const nextPendingFields = toPendingFieldKeyList(payload.pendingFields);

        if (cancelled) return;

        resetValues(createVendorFormValuesFromRegistration(payload));
        setPendingFields(isPageMode || nextPendingFields.length > 0 ? nextPendingFields : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isPageMode, isSeller, isSessionLoading, resetValues, session?.accessToken]);

  if (loading) return isPageMode ? <PendingRegistrationLoading /> : null;

  if (!pendingFields || dismissed || (!isPageMode && pendingFields.length === 0)) {
    return null;
  }

  const currentPendingFields = pendingFields;

  function pendingFieldError(field: VendorPendingFieldKey) {
    return currentPendingFields.includes(field) ? VENDOR_PENDING_FIELD_LABELS[field] : undefined;
  }

  /**
   * Recarrega a casca do painel antes de sair do formulario.
   *
   * O aviso de pendencia e as marcas da navegacao sao renderizados no layout do vendor, que a
   * navegacao entre rotas irmas reaproveita; sem o `refresh` antes do `push` o vendor volta ao
   * painel com o alerta que acabou de resolver.
   */
  function refreshPanelShell() {
    startNavigation(() => {
      router.refresh();

      if (returnTo) {
        router.push(returnTo);
      }
    });
  }

  /**
   * Volta ao painel sem salvar, mantendo os botoes travados enquanto a rota nao troca.
   */
  function goToPanel() {
    if (!returnTo) return;

    startNavigation(() => {
      router.push(returnTo);
    });
  }

  async function save() {
    if (saving) return;

    const validation = validateVendorFormValues(values, "vendor-self");

    if (validation) {
      setFormError(validation);
      setMessage(null);
      return;
    }

    setSaving(true);
    setFormError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/vendor/registration-pending", {
        body: JSON.stringify(buildVendorRegistrationPayload(values)),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const body = (await response.json().catch(() => null)) as
        | VendorPendingRegistrationResponse
        | { message?: string }
        | null;

      if (!response.ok) {
        setMessageTone("error");
        setMessage(
          body && "message" in body
            ? (body.message ?? "Não foi possível salvar agora.")
            : "Não foi possível salvar agora.",
        );
        return;
      }

      const nextPendingFields = toPendingFieldKeyList(
        body && "pendingFields" in body ? body.pendingFields : [],
      );

      if (!body || !("draft" in body) || !body.draft) {
        setMessageTone("success");
        setMessage("Cadastro salvo.");
        refreshPanelShell();
        return;
      }

      resetValues(createVendorFormValuesFromRegistration(body));

      if (nextPendingFields.length === 0) {
        setMessageTone("success");
        setMessage("Cadastro complementar concluido. Sua conta foi liberada para vender.");
        setPendingFields(isPageMode ? [] : null);
        refreshPanelShell();
        return;
      }

      setPendingFields(nextPendingFields);
      setMessageTone("success");
      setMessage(`Cadastro salvo. Ainda faltam ${nextPendingFields.length} campos obrigatórios.`);
    } catch {
      setMessageTone("error");
      setMessage("Erro de rede ao salvar o cadastro.");
    } finally {
      setSaving(false);
    }
  }

  const secondaryAction: SecondaryActionProps = {
    busy,
    dismissible,
    onDismiss: () => setDismissed(true),
    onReturn: goToPanel,
    showReturn: Boolean(returnTo) && currentPendingFields.length === 0,
  };

  return (
    <div className={overlayClassName(isPageMode)}>
      <div className={panelClassName(isPageMode)}>
        <div className="h-2 w-full bg-brand-yellow" />

        <PendingRegistrationHeader
          {...secondaryAction}
          hasPendingFields={currentPendingFields.length > 0}
        />

        <div className="space-y-6 px-6 py-5">
          <PendingFieldsNotice pendingFields={currentPendingFields} />

          <VendorFormSections
            controller={controller}
            fieldError={pendingFieldError}
            mode="vendor-self"
          />

          <FormErrorAlert formError={formError} />

          <StatusMessage message={message} tone={messageTone} />
        </div>

        <PendingRegistrationFooter
          {...secondaryAction}
          navigating={navigating}
          onSave={() => {
            void save();
          }}
          saving={saving}
        />
      </div>
    </div>
  );
}
