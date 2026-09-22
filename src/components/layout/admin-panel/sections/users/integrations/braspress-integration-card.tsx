"use client";

import { CircleAlert, CircleCheck, CircleDashed, CirclePause, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import { hardDangerActionClass, hardSecondaryActionClass } from "@/components/ui/hard-actions";
import { HardSwitch } from "@/components/ui/hard-switch";
import {
  adminBraspressIntegrationState,
  type AdminBraspressIntegrationState,
} from "@/features/vendor-settings/utils/admin-braspress-integration-state";
import type { AdminVendorIntegration } from "@/lib/server/admin-vendor-integrations";
import { formatCep } from "@/lib/validation/brazilian-documents";

import { formatCnpj } from "../../accounts/accounts-config";
import { StatusChip, type StatusTone } from "../../accounts/status-chip";

import {
  BraspressCredentialModal,
  type BraspressCredentialForm,
} from "./braspress-credential-modal";

type Feedback = { text: string; tone: "error" | "success" };

const CHIP_TONE: Record<AdminBraspressIntegrationState["tone"], StatusTone> = {
  attention: "critical",
  neutral: "neutral",
  positive: "positive",
};

const LABEL_CLASS = "text-[10px] font-black tracking-[0.18em] text-[#1a1a1a]/52 uppercase";

function chipIcon(state: AdminBraspressIntegrationState, enabled: boolean) {
  if (state.tone === "attention") return CircleAlert;
  if (state.tone === "positive") return CircleCheck;

  return enabled ? CircleDashed : CirclePause;
}

/** Uma linha do quadro de fatos da integração, sempre com rótulo acima do valor. */
function Fact({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="border-2 border-[#1a1a1a] bg-white px-3 py-3">
      <p className={LABEL_CLASS}>{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#231f20]">{value}</p>
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

/**
 * Cartão da integração Braspress de um vendor, na aba administrativa.
 *
 * O interruptor grava direto: é o mesmo `enabled` que o vendor controla no
 * painel dele, é reversível com outro clique e fica na trilha de auditoria —
 * confirmar cada troca só atrasaria a operação. Remover, que apaga a credencial
 * cifrada, passa por confirmação porque não tem volta.
 *
 * A credencial nunca chega até aqui: o cartão sabe apenas que ela existe.
 */
export function BraspressIntegrationCard({
  integration,
  vendorId,
  vendorName,
}: Readonly<{
  integration: AdminVendorIntegration;
  vendorId: number;
  vendorName: string;
}>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const endpoint = `/api/admin/vendors/${vendorId}/integrations/braspress`;
  const state = adminBraspressIntegrationState(integration);
  const busy = submitting || isPending || integration.loadFailed;

  async function mutate(method: "DELETE" | "PUT", body: Record<string, unknown> | null, success: string) {
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(endpoint, {
        body: body === null ? undefined : JSON.stringify(body),
        headers: body === null ? undefined : { "Content-Type": "application/json" },
        method,
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? `Erro ${response.status}`);
      }

      setCredentialOpen(false);
      setRemoveOpen(false);
      setFeedback({ text: success, tone: "success" });
      startTransition(() => router.refresh());
    } catch (error) {
      setFeedback({ text: errorMessage(error), tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  function toggleEnabled(next: boolean) {
    void mutate(
      "PUT",
      { enabled: next, originCep: integration.config.originCep },
      next
        ? "Braspress ligada para esta loja."
        : "Braspress desligada para esta loja. A credencial continua guardada.",
    );
  }

  function saveCredential(form: BraspressCredentialForm) {
    void mutate(
      "PUT",
      {
        enabled: integration.enabled,
        originCep: form.originCep,
        password: form.password,
        username: form.username,
      },
      "Credencial Braspress salva.",
    );
  }

  return (
    <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a]">
            <Truck aria-hidden className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-base font-black tracking-tight text-[#231f20] uppercase">
              {integration.label}
            </h3>
            <p className={LABEL_CLASS}>Transportadora</p>
          </div>
        </div>
        <StatusChip
          icon={chipIcon(state, integration.enabled)}
          label={state.label}
          tone={CHIP_TONE[state.tone]}
        />
      </div>

      <p className="mt-4 text-xs leading-5 font-semibold text-[#231f20]/68">{state.description}</p>

      {feedback ? (
        <p
          className={[
            "mt-4 border-2 px-4 py-3 text-sm font-semibold",
            feedback.tone === "success"
              ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]"
              : "border-[#c0392b] bg-[#c0392b]/10 text-[#7a3428]",
          ].join(" ")}
          role="status"
        >
          {feedback.text}
        </p>
      ) : null}

      {integration.credentialsConfigured ? (
        <>
          <dl className="mt-4 grid gap-3 md:grid-cols-3">
            <Fact
              label="CNPJ remetente"
              value={
                integration.config.senderCnpj ? formatCnpj(integration.config.senderCnpj) : "—"
              }
            />
            <Fact
              label="CEP de origem"
              value={
                integration.config.originCep ? formatCep(integration.config.originCep) : "—"
              }
            />
            <Fact label="Credenciais" value="Configuradas" />
          </dl>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-2 border-[#1a1a1a] bg-white px-4 py-3">
            <div>
              <p className="text-sm font-black text-[#231f20]">Braspress no checkout desta loja</p>
              <p className="text-xs font-semibold text-[#231f20]/62">
                O vendor também controla este interruptor no painel dele.
              </p>
            </div>
            <HardSwitch
              ariaLabel="Braspress no checkout desta loja"
              checked={integration.enabled}
              disabled={busy}
              onChange={toggleEnabled}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              aria-haspopup="dialog"
              className={hardSecondaryActionClass}
              disabled={busy}
              onClick={() => setCredentialOpen(true)}
              type="button"
            >
              Alterar credencial
            </button>
            <button
              aria-haspopup="dialog"
              className={hardDangerActionClass}
              disabled={busy}
              onClick={() => setRemoveOpen(true)}
              type="button"
            >
              Remover integração
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            aria-haspopup="dialog"
            className={hardSecondaryActionClass}
            disabled={busy}
            onClick={() => setCredentialOpen(true)}
            type="button"
          >
            Adicionar integração
          </button>
        </div>
      )}

      {credentialOpen ? (
        <BraspressCredentialModal
          integration={integration}
          onClose={() => setCredentialOpen(false)}
          onSubmit={saveCredential}
          open
          submitting={submitting}
          vendorName={vendorName}
        />
      ) : null}

      <ConfirmModal
        confirmLabel="Confirmar remoção"
        description={`A credencial criptografada de ${vendorName} é apagada e a Braspress deixa de ser oferecida no checkout desta loja. Para voltar a cotar, o contrato precisa ser cadastrado de novo.`}
        isSubmitting={submitting}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => void mutate("DELETE", null, "Integração Braspress removida.")}
        open={removeOpen}
        title="Remover integração Braspress"
        tone="danger"
      />
    </div>
  );
}
