"use client";

import { CreditCard, Loader2, Save } from "lucide-react";
import { type FormEvent, useState } from "react";

import type { PaymentConfig } from "@/features/rich-text/services/get-payment-config";
import { MAX_INSTALLMENTS } from "@/lib/installments";

import { Panel } from "../../primitives";

type InstallmentSettingsProps = {
  initialConfig: PaymentConfig | null;
  initialIssue?: string;
  onSaved: (config: PaymentConfig) => void;
};

function formatCents(minimumCents: number | null) {
  if (!minimumCents || minimumCents <= 0) return "";
  return (minimumCents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parsePositiveInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseBRLCents(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!/^(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{1,2})?$/.test(normalized)) return null;
  const [whole, decimal = ""] = normalized.split(",");
  const cents = Number(whole.replaceAll(".", "")) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function InstallmentSettings({ initialConfig, initialIssue, onSaved }: InstallmentSettingsProps) {
  const [error, setError] = useState(initialIssue ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<PaymentConfig | null>(initialConfig);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const maxInstallments = parsePositiveInteger(formData.get("maxInstallments"));
    const installmentMinimumCents = parseBRLCents(formData.get("installmentMinimum"));

    if (maxInstallments === null || maxInstallments > MAX_INSTALLMENTS || installmentMinimumCents === null) {
      setError(`Informe de 1 a ${MAX_INSTALLMENTS} parcelas e um valor monetário positivo no formato 99,00.`);
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/payment-config", {
        body: JSON.stringify({ maxInstallments, installmentMinimumCents }),
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: "PUT",
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message = typeof payload === "object" && payload !== null && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "Não foi possível salvar a configuração de parcelamento.";
        setError(message);
        return;
      }

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("maxInstallments" in payload) ||
        !("installmentMinimumCents" in payload) ||
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

      const saved = {
        maxInstallments: payload.maxInstallments,
        installmentMinimumCents: payload.installmentMinimumCents,
      };
      setConfig(saved);
      onSaved(saved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a configuração de parcelamento.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Panel className="overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-5 px-5 py-5 md:px-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[#6a5f00]" strokeWidth={2} />
              <h2 className="text-base font-semibold text-[#1e1c10]">Configuração de parcelamento</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#4b4731]">
              Defina os limites usados no checkout e nas mensagens dinâmicas da faixa promocional. O limite máximo é de {MAX_INSTALLMENTS} parcelas.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,12rem)_minmax(0,14rem)_auto] md:items-end">
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#4b4731]" htmlFor="max-installments">
              Máximo de parcelas
              <input
                className="h-10 w-full rounded-[12px] border border-[#231f20]/15 bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#1e1c10] outline-none transition focus:border-[#6a5f00] focus:ring-2 focus:ring-[#fee400]/70"
                defaultValue={config?.maxInstallments ?? ""}
                disabled={isSaving}
                id="max-installments"
                inputMode="numeric"
                name="maxInstallments"
                placeholder="6"
                type="text"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#4b4731]" htmlFor="installment-minimum">
              Valor mínimo da parcela
              <input
                className="h-10 w-full rounded-[12px] border border-[#231f20]/15 bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#1e1c10] outline-none transition focus:border-[#6a5f00] focus:ring-2 focus:ring-[#fee400]/70"
                defaultValue={formatCents(config?.installmentMinimumCents ?? null)}
                disabled={isSaving}
                id="installment-minimum"
                inputMode="decimal"
                name="installmentMinimum"
                placeholder="1,00"
                type="text"
              />
            </label>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-[#1e1c10] px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#fee400] transition hover:bg-[#1e1c10]/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </button>
          </div>
          <p className="text-xs text-[#4b4731]">
            O checkout reduz automaticamente o número de parcelas quando o total do pedido não atinge o mínimo por parcela.
          </p>
        </div>
        {error ? <p className="border-t border-[#fecaca] bg-[#fff1f2] px-5 py-3 text-sm text-[#b91c1c] md:px-6" role="alert">{error}</p> : null}
      </form>
    </Panel>
  );
}
