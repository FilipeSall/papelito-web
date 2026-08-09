"use client";

import { Loader2, Save, TicketCheck } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";

import { formatBRL } from "@/lib/format-currency";

import { Panel } from "../../primitives";

type FreeShippingThresholdSettingsProps = {
  initialMinimumOrderCents: number | null;
  initialIssue?: string;
  onSaved: (minimumOrderCents: number) => void;
};

function formatCentsForInput(minimumOrderCents: number | null) {
  if (!minimumOrderCents || minimumOrderCents <= 0) return "";
  return (minimumOrderCents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseBRLCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!/^(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{1,2})?$/.test(normalized)) return null;

  const [whole, decimal = ""] = normalized.split(",");
  const cents = Number(whole.replaceAll(".", "")) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function FreeShippingThresholdSettings({
  initialMinimumOrderCents,
  initialIssue,
  onSaved,
}: FreeShippingThresholdSettingsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(initialIssue ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMinimumOrderCents, setCurrentMinimumOrderCents] = useState(initialMinimumOrderCents);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minimumOrderCents = parseBRLCents(new FormData(event.currentTarget).get("minimumOrder"));

    if (minimumOrderCents === null) {
      setError("Informe um valor monetário positivo no formato 99,00.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/shipping/free-shipping-threshold", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ minimumOrderCents }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        minimumOrderCents?: unknown;
      };

      if (!response.ok) {
        setError(payload.message ?? "Não foi possível salvar o valor mínimo.");
        return;
      }

      if (
        typeof payload.minimumOrderCents !== "number" ||
        !Number.isSafeInteger(payload.minimumOrderCents) ||
        payload.minimumOrderCents <= 0
      ) {
        setError("Resposta inválida ao salvar o valor mínimo.");
        return;
      }

      if (inputRef.current) {
        inputRef.current.value = formatCentsForInput(payload.minimumOrderCents);
      }
      setCurrentMinimumOrderCents(payload.minimumOrderCents);
      onSaved(payload.minimumOrderCents);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o valor mínimo.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Panel className="overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-end md:justify-between md:px-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <TicketCheck className="h-5 w-5 text-[#6a5f00]" strokeWidth={2} />
              <h2 className="text-base font-semibold text-[#1e1c10]">Frete grátis via cupom</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#4b4731]">
              Defina o valor mínimo do pedido para elegibilidade ao cupom manual de frete grátis.
              A cotação dos Correios não é alterada automaticamente.
            </p>
          </div>

          <div className="w-full md:max-w-66">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#4b4731]" htmlFor="free-shipping-minimum">
              Pedido mínimo
            </label>
            <div className="flex gap-2">
              <input
                aria-describedby={error ? "free-shipping-minimum-error" : "free-shipping-minimum-help"}
                aria-invalid={Boolean(error)}
                className="h-10 min-w-0 flex-1 rounded-[12px] border border-[#231f20]/15 bg-white px-3 text-sm text-[#1e1c10] outline-none transition focus:border-[#6a5f00] focus:ring-2 focus:ring-[#fee400]/70"
                defaultValue={formatCentsForInput(initialMinimumOrderCents)}
                disabled={isSaving}
                id="free-shipping-minimum"
                inputMode="decimal"
                name="minimumOrder"
                placeholder="99,00"
                ref={inputRef}
                type="text"
              />
              <button
                className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[12px] bg-[#1e1c10] px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#fee400] transition hover:bg-[#1e1c10]/90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#4b4731]" id="free-shipping-minimum-help">
              Exibido como {formatBRL((currentMinimumOrderCents ?? 0) / 100)} quando salvo.
            </p>
          </div>
        </div>

        {error ? (
          <p className="border-t border-[#fecaca] bg-[#fff1f2] px-5 py-3 text-sm text-[#b91c1c] md:px-6" id="free-shipping-minimum-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Panel>
  );
}
