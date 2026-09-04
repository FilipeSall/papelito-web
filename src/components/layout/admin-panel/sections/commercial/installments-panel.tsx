"use client";

import { CreditCard, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import type { PaymentConfig } from "@/features/rich-text/services/get-payment-config";
import { formatBRL } from "@/lib/format-currency";
import { MAX_INSTALLMENTS } from "@/lib/installments";

import {
  AdminToast,
  FOCUS_RING,
  InlineAlert,
  PrimaryButton,
  SectionHeading,
} from "../../primitives";

import { formatCentsForInput, parseBRLCents } from "./money";
import { useAdminToast } from "./use-admin-toast";

type InstallmentsPanelProps = {
  initialConfig: PaymentConfig | null;
  initialIssues: string[];
};

const FIELD_CLASS =
  "mt-2 h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40";

function parsePositiveInteger(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value.trim())) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function InstallmentsPanel({
  initialConfig,
  initialIssues,
}: Readonly<InstallmentsPanelProps>) {
  const router = useRouter();
  const [config, setConfig] = useState<PaymentConfig | null>(initialConfig);
  const [maxInstallments, setMaxInstallments] = useState(
    initialConfig ? String(initialConfig.maxInstallments) : "",
  );
  const [minimum, setMinimum] = useState(
    formatCentsForInput(initialConfig?.installmentMinimumCents ?? null),
  );
  const [error, setError] = useState<string | null>(initialIssues[0] ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [, startTransition] = useTransition();
  const { dismissToast, isVisible, showToast, toast } = useAdminToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedInstallments = parsePositiveInteger(maxInstallments);
    const installmentMinimumCents = parseBRLCents(minimum);

    if (
      parsedInstallments === null ||
      parsedInstallments > MAX_INSTALLMENTS ||
      installmentMinimumCents === null
    ) {
      setError(
        `Informe de 1 a ${MAX_INSTALLMENTS} parcelas e um valor monetário positivo no formato 99,00.`,
      );

      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/payment-config", {
        body: JSON.stringify({
          installmentMinimumCents,
          maxInstallments: parsedInstallments,
        }),
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: "PUT",
      });
      const payload = (await response.json().catch(() => null)) as
        | (PaymentConfig & { message?: string })
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Não foi possível salvar a configuração de parcelamento.");

        return;
      }

      if (
        !payload ||
        typeof payload.maxInstallments !== "number" ||
        !Number.isSafeInteger(payload.maxInstallments) ||
        payload.maxInstallments <= 0 ||
        typeof payload.installmentMinimumCents !== "number" ||
        !Number.isSafeInteger(payload.installmentMinimumCents) ||
        payload.installmentMinimumCents <= 0
      ) {
        setError("Resposta inválida ao salvar a configuração de parcelamento.");

        return;
      }

      const saved: PaymentConfig = {
        installmentMinimumCents: payload.installmentMinimumCents,
        maxInstallments: payload.maxInstallments,
      };

      setConfig(saved);
      setMaxInstallments(String(saved.maxInstallments));
      setMinimum(formatCentsForInput(saved.installmentMinimumCents));
      showToast({
        description: `Checkout em até ${saved.maxInstallments}x, com parcela a partir de ${formatBRL(saved.installmentMinimumCents / 100)}.`,
        title: "Parcelamento salvo",
      });
      startTransition(() => router.refresh());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar a configuração de parcelamento.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <SectionHeading
        action={
          <PrimaryButton disabled={isSaving} type="submit">
            {isSaving ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={2.4} />
            ) : (
              <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            )}
            Salvar parcelamento
          </PrimaryButton>
        }
        description={`Limites usados no checkout e nas mensagens da faixa promocional. O teto do sistema é de ${MAX_INSTALLMENTS} parcelas.`}
        title="Parcelamento"
      />

      <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 w-full bg-brand-yellow" />

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b-2 border-[#1a1a1a] px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
          <CreditCard aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          {config ? (
            <>
              <span>Até</span>
              <span data-numeric>{config.maxInstallments}x</span>
              <span aria-hidden>·</span>
              <span>parcela mínima de</span>
              <span data-numeric>{formatBRL(config.installmentMinimumCents / 100)}</span>
            </>
          ) : (
            <span>Configuração de parcelamento indisponível</span>
          )}
        </p>

        <div className="grid gap-5 px-5 py-5 md:max-w-2xl md:grid-cols-2 md:px-6">
          <div>
            <label
              className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
              htmlFor="max-installments"
            >
              <span className="flex h-4 items-center">Máximo de parcelas</span>
            </label>
            <input
              className={[FIELD_CLASS, FOCUS_RING].join(" ")}
              disabled={isSaving}
              id="max-installments"
              inputMode="numeric"
              onChange={(event) => setMaxInstallments(event.target.value)}
              placeholder="6"
              value={maxInstallments}
            />
          </div>

          <div>
            <label
              className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
              htmlFor="installment-minimum"
            >
              <span className="flex h-4 items-center">Valor mínimo da parcela (R$)</span>
            </label>
            <input
              className={[FIELD_CLASS, FOCUS_RING].join(" ")}
              disabled={isSaving}
              id="installment-minimum"
              inputMode="decimal"
              onChange={(event) => setMinimum(event.target.value)}
              placeholder="1,00"
              value={minimum}
            />
          </div>
        </div>
      </section>

      {error ? <InlineAlert tone="critical">⚠ {error}</InlineAlert> : null}

      <p className="text-xs leading-5 text-[#231f20]/64">
        O checkout reduz o número de parcelas sozinho quando o total do pedido não alcança o mínimo
        por parcela.
      </p>

      {toast ? (
        <AdminToast
          description={toast.description}
          onClose={dismissToast}
          title={toast.title}
          visible={isVisible}
        />
      ) : null}
    </form>
  );
}
