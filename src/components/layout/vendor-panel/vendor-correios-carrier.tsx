"use client";

import { useEffect, useState, useTransition } from "react";

import type { VendorBraspressIntegration } from "@/features/vendor-settings/types/vendor-braspress";
import type { VendorCorreiosPreference } from "@/features/vendor-settings/types/vendor-correios";
import { readBraspressIntegration } from "@/features/vendor-settings/utils/braspress-integration-payload";
import { readCorreiosPreference } from "@/features/vendor-settings/utils/read-correios-preference";

import { CarrierRouteRow } from "./carrier-route-row";
import { FeedbackBanner, type FeedbackState } from "./feedback-banner";

/** Por que os Correios estão travados: Braspress sem cadastro ou ainda não liberada pela Papelito. */
export type CorreiosLockReason = "unconfigured" | "unreleased";

const LOCKED_MESSAGE: Record<CorreiosLockReason, string> = {
  unconfigured: "Para desabilitar os Correios, configure primeiro sua conta da Braspress.",
  unreleased: "A Braspress ainda não foi liberada para a sua loja. Até lá, os Correios continuam obrigatórios.",
};

const CORREIOS_FALLBACK_MESSAGE =
  "Mesmo desabilitados, os Correios poderão ser utilizados automaticamente caso a Braspress apresente falhas de conexão ou fique indisponível. Isso garante que seus clientes continuem tendo uma opção de entrega.";

const LOCKED_CODE = "papelito_vendor_correios_locked";
const BRASPRESS_ENABLE_FAILURE =
  "Não foi possível habilitar a Braspress, então os Correios continuam habilitados. A loja não pode ficar sem transportadora.";
const NETWORK_FAILURE = "Não foi possível falar com o servidor. Os Correios continuam como estavam.";
const SAVE_FAILURE = "Não foi possível salvar a preferência dos Correios. Os Correios continuam como estavam.";
const UNREAD_AFTER_WRITE =
  "A alteração foi enviada, mas não foi possível ler como os Correios ficaram. Recarregue a página antes de mexer de novo.";
const LOCKED_PREFERENCE: VendorCorreiosPreference = { enabled: true, locked: true };

type FailureKind = "braspress" | "network" | "save" | "unread";

type SaveOutcome =
  | { braspress: VendorBraspressIntegration | null; braspressEnabled: boolean; preference: VendorCorreiosPreference }
  | { error: FailureKind | "locked"; preference?: VendorCorreiosPreference };

const OUTCOME_ERROR: Record<FailureKind, string> = {
  braspress: BRASPRESS_ENABLE_FAILURE,
  network: NETWORK_FAILURE,
  save: SAVE_FAILURE,
  unread: UNREAD_AFTER_WRITE,
};

function failureOutcome(body: unknown): SaveOutcome {
  const code = (body as { code?: unknown } | null)?.code;

  if (code === LOCKED_CODE) return { error: "locked", preference: LOCKED_PREFERENCE };

  const braspressFailed =
    typeof code === "string" &&
    (code.startsWith("papelito_vendor_integration_") || code === "papelito_vendor_correios_braspress_enable_failed");

  return { error: braspressFailed ? "braspress" : "save" };
}

/**
 * Grava a escolha e devolve o estado que o servidor confirmou, nunca o pedido.
 *
 * Desligar os Correios pode ligar a Braspress no servidor, para a loja não ficar
 * sem transportadora; `braspressEnabled` diz como ela ficou. A recusa da regra
 * traz o estado travado junto, para a tela corrigir a trava.
 */
async function saveCorreios(enabled: boolean): Promise<SaveOutcome> {
  try {
    const response = await fetch("/api/vendor/settings", {
      body: JSON.stringify({ correios_enabled: enabled }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) return failureOutcome(body);

    const preference = readCorreiosPreference(body);
    if (!preference) return { error: "unread" };

    const { braspress, braspress_enabled: braspressEnabled } = body as { braspress?: unknown; braspress_enabled?: unknown };

    return { braspress: readBraspressIntegration(braspress), braspressEnabled: braspressEnabled === true, preference };
  } catch {
    return { error: "network" };
  }
}

function statusLabel(preference: VendorCorreiosPreference) {
  if (preference.locked) return "Obrigatórios sem Braspress disponível";

  return preference.enabled ? "Habilitados" : "Desabilitados — só como contingência";
}

function routeRole(preference: VendorCorreiosPreference) {
  if (preference.locked) return "Obrigatórios";

  return preference.enabled ? "No checkout" : "Contingência";
}

function hint(preference: VendorCorreiosPreference, lockReason: CorreiosLockReason, braspressEnabled: boolean) {
  if (preference.locked) return LOCKED_MESSAGE[lockReason];
  if (!preference.enabled) return "Os Correios não aparecem no checkout enquanto a Braspress cotar normalmente.";

  return braspressEnabled
    ? null
    : "Ao desabilitar os Correios, a Braspress é habilitada automaticamente: a loja nunca fica sem transportadora.";
}

function savedMessage(enabled: boolean, switchedBraspress: boolean) {
  if (enabled) return "✓ Correios habilitados. Eles voltam a aparecer no checkout da sua loja.";

  return switchedBraspress
    ? "✓ Correios desabilitados e Braspress habilitada, para a loja não ficar sem transportadora. Os Correios seguem como contingência."
    : "✓ Correios desabilitados. A Braspress passa a ser a transportadora do checkout, com os Correios só como contingência.";
}

type VendorCorreiosCarrierProps = {
  /** Interruptor da Braspress como a tela o mostra agora. */
  braspressEnabled: boolean;
  /** Trava extra de quem contém o cartão, como uma escrita da Braspress em andamento. */
  disabled: boolean;
  /** A leitura inicial falhou: sem estado confiável, o interruptor não é liberado. */
  loadFailed: boolean;
  /** Motivo exibido quando o servidor trava os Correios. */
  lockReason: CorreiosLockReason;
  /** Avisa quem contém o cartão enquanto uma escrita dos Correios está em andamento. */
  onBusyChange: (busy: boolean) => void;
  /**
   * Recebe o estado confirmado pelo servidor; `braspressEnabled` vem `null` quando a escrita falhou.
   * `braspress` é a integração completa que o WordPress devolve quando os Correios mudaram.
   */
  onSaved: (
    preference: VendorCorreiosPreference,
    braspressEnabled: boolean | null,
    braspress: VendorBraspressIntegration | null,
  ) => void;
  preference: VendorCorreiosPreference;
};

/**
 * Interruptor dos Correios da loja, dependente da Braspress disponível.
 *
 * Não há atualização otimista: o interruptor só muda com a confirmação do
 * WordPress, que é quem aplica a regra — inclusive a de ligar a Braspress
 * quando os Correios são desligados com ela desligada. Enquanto a Braspress
 * não está disponível o cartão fica travado em ON e explica por quê.
 */
export function VendorCorreiosCarrier({
  braspressEnabled,
  disabled,
  loadFailed,
  lockReason,
  onBusyChange,
  onSaved,
  preference,
}: Readonly<VendorCorreiosCarrierProps>) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    onBusyChange(pending);
  }, [onBusyChange, pending]);

  const tooltip = preference.locked ? `${LOCKED_MESSAGE[lockReason]} ${CORREIOS_FALLBACK_MESSAGE}` : CORREIOS_FALLBACK_MESSAGE;

  function toggle(next: boolean) {
    setFeedback(null);

    startTransition(async () => {
      const outcome = await saveCorreios(next);

      if ("error" in outcome) {
        if (outcome.preference) onSaved(outcome.preference, null, null);
        const message = outcome.error === "locked" ? LOCKED_MESSAGE[lockReason] : OUTCOME_ERROR[outcome.error];
        setFeedback({ error: true, message: `⚠ ${message}` });
        return;
      }

      onSaved(outcome.preference, outcome.braspressEnabled, outcome.braspress);
      const switchedBraspress = !braspressEnabled && outcome.braspressEnabled;
      setFeedback({ error: false, message: savedMessage(outcome.preference.enabled, switchedBraspress) });
    });
  }

  return (
    <CarrierRouteRow
      carrier="Correios"
      checked={preference.enabled}
      disabled={disabled || loadFailed || pending || preference.locked}
      hint={hint(preference, lockReason, braspressEnabled)}
      id="vendor-correios-enabled"
      onChange={toggle}
      role={routeRole(preference)}
      statusLabel={statusLabel(preference)}
      statusTone="neutral"
      switchTone="positive"
      tooltip={tooltip}
    >
      {feedback ? <FeedbackBanner className="mx-5 mb-4 md:mx-6" feedback={feedback} /> : null}
    </CarrierRouteRow>
  );
}
