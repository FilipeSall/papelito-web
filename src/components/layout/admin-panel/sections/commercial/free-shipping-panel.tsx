"use client";

import { Globe2, Loader2, MapPin, Plus, Save, Trash2, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";

import type {
  FreeShippingThreshold,
  FreeShippingZipRange,
} from "@/features/shipping/services/get-free-shipping-threshold";
import { formatBRL } from "@/lib/format-currency";

import {
  AdminToast,
  FOCUS_RING,
  InlineAlert,
  PrimaryButton,
  SectionHeading,
  useAdminToast,
} from "../../primitives";

import { formatCentsForInput, parseBRLCents } from "./money";

const MAX_RANGES = 50;

type RangeDraft = {
  key: string;
  maxCep: string;
  minCep: string;
};

type FreeShippingPanelProps = {
  initialIssues: string[];
  initialThreshold: FreeShippingThreshold | null;
};

function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "").slice(0, 8);
}

/** Máscara de exibição. O valor que vai para o backend é sempre `onlyDigits`. */
function maskCep(value: string): string {
  const digits = onlyDigits(value);

  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/**
 * As chaves derivam de `useId` mais a posição inicial, e nunca de um contador de módulo.
 *
 * Um contador em nível de módulo avança no processo do servidor e outra vez no navegador, então o
 * `id` do campo saía diferente nos dois lados e a hidratação quebrava sem erro visível na tela.
 */
function toDrafts(prefix: string, ranges: FreeShippingZipRange[]): RangeDraft[] {
  return ranges.map((range, index) => ({
    key: `${prefix}-${index}`,
    maxCep: maskCep(range.maxCep),
    minCep: maskCep(range.minCep),
  }));
}

function describeRegions(count: number): string {
  if (count === 0) {
    return "todo o Brasil";
  }

  return count === 1 ? "1 região" : `${count} regiões`;
}

export function FreeShippingPanel({
  initialIssues,
  initialThreshold,
}: Readonly<FreeShippingPanelProps>) {
  const router = useRouter();
  const idPrefix = useId().replaceAll(":", "");
  const [minimum, setMinimum] = useState(
    formatCentsForInput(initialThreshold?.minimumOrderCents ?? null),
  );
  const [drafts, setDrafts] = useState<RangeDraft[]>(() =>
    toDrafts(idPrefix, initialThreshold?.zipRanges ?? []),
  );
  // Só avança em interação do usuário, que é sempre no cliente.
  const nextIndexRef = useRef(initialThreshold?.zipRanges.length ?? 0);
  const [savedState, setSavedState] = useState<FreeShippingThreshold | null>(initialThreshold);
  const [error, setError] = useState<string | null>(initialIssues[0] ?? null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [, startTransition] = useTransition();
  const { dismissToast, isVisible, showToast, toast } = useAdminToast();

  function updateDraft(key: string, field: "maxCep" | "minCep", value: string) {
    setDrafts((previous) =>
      previous.map((draft) => (draft.key === key ? { ...draft, [field]: maskCep(value) } : draft)),
    );
    setRowErrors((previous) => {
      if (!previous[key]) {
        return previous;
      }

      const next = { ...previous };
      delete next[key];

      return next;
    });
  }

  function addRange() {
    if (drafts.length >= MAX_RANGES) {
      setError(`O limite é de ${MAX_RANGES} faixas de CEP.`);

      return;
    }

    setError(null);
    setDrafts((previous) => [
      ...previous,
      { key: `${idPrefix}-${nextIndexRef.current++}`, maxCep: "", minCep: "" },
    ]);
  }

  function removeRange(key: string) {
    setDrafts((previous) => previous.filter((draft) => draft.key !== key));
    setRowErrors((previous) => {
      const next = { ...previous };
      delete next[key];

      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const minimumOrderCents = parseBRLCents(minimum);

    if (minimumOrderCents === null) {
      setError("Informe um valor monetário positivo no formato 99,00.");

      return;
    }

    const nextRowErrors: Record<string, string> = {};
    const zipRanges: FreeShippingZipRange[] = [];

    for (const draft of drafts) {
      const minCep = onlyDigits(draft.minCep);
      const maxCep = onlyDigits(draft.maxCep);

      if (minCep.length !== 8 || maxCep.length !== 8) {
        nextRowErrors[draft.key] = "Informe os oito dígitos do CEP inicial e do final.";
        continue;
      }

      if (Number(minCep) > Number(maxCep)) {
        nextRowErrors[draft.key] = "O CEP final precisa ser maior ou igual ao inicial.";
        continue;
      }

      zipRanges.push({ maxCep, minCep });
    }

    setRowErrors(nextRowErrors);

    if (Object.keys(nextRowErrors).length > 0) {
      setError("Corrija as faixas marcadas antes de salvar.");

      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/shipping/free-shipping-threshold", {
        body: JSON.stringify({ minimumOrderCents, zipRanges }),
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: "PUT",
      });
      const payload = (await response.json().catch(() => null)) as
        | (FreeShippingThreshold & { message?: string })
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Não foi possível salvar a regra de frete grátis.");

        return;
      }

      if (!payload || typeof payload.minimumOrderCents !== "number") {
        setError("Resposta inválida ao salvar a regra de frete grátis.");

        return;
      }

      const saved: FreeShippingThreshold = {
        minimumOrderCents: payload.minimumOrderCents,
        zipRanges: Array.isArray(payload.zipRanges) ? payload.zipRanges : [],
      };

      setSavedState(saved);
      setMinimum(formatCentsForInput(saved.minimumOrderCents));
      nextIndexRef.current = saved.zipRanges.length;
      setDrafts(toDrafts(idPrefix, saved.zipRanges));
      showToast({
        description: `Pedidos de ${formatBRL(saved.minimumOrderCents / 100)} para ${describeRegions(saved.zipRanges.length)} passam a ter o frete abatido.`,
        title: "Regra de frete grátis salva",
      });
      startTransition(() => router.refresh());
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Não foi possível salvar a regra de frete grátis.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const savedRegions = savedState?.zipRanges.length ?? 0;

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
            Salvar regra
          </PrimaryButton>
        }
        description="Valor mínimo e regiões formam uma regra só, aplicada no cálculo do carrinho e reconferida no pagamento."
        title="Frete grátis"
      />

      <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 w-full bg-brand-yellow" />

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b-2 border-[#1a1a1a] px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
          <Truck aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          {savedState ? (
            <>
              <span>Frete grátis a partir de</span>
              <span data-numeric>{formatBRL(savedState.minimumOrderCents / 100)}</span>
              <span aria-hidden>·</span>
              <span>{describeRegions(savedRegions)}</span>
            </>
          ) : (
            <span>Regra de frete grátis indisponível</span>
          )}
        </p>

        <div className="space-y-5 px-5 py-5 md:px-6">
          <div className="max-w-xs">
            <label
              className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
              htmlFor="free-shipping-minimum"
            >
              <span className="flex h-4 items-center">Subtotal mínimo (R$)</span>
            </label>
            <input
              className={[
                "mt-2 h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
                FOCUS_RING,
              ].join(" ")}
              disabled={isSaving}
              id="free-shipping-minimum"
              inputMode="decimal"
              onChange={(event) => setMinimum(event.target.value)}
              placeholder="99,00"
              value={minimum}
            />
            <p className="mt-2 text-xs leading-5 text-[#231f20]/64">
              O benefício entra sozinho quando o subtotal alcança esse valor e existe uma modalidade
              de entrega escolhida.
            </p>
          </div>

          <div className="border-t-2 border-[#1a1a1a]/10 pt-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
                  <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
                  Regiões elegíveis
                </span>
                <p className="mt-2 max-w-xl text-xs leading-5 text-[#231f20]/70">
                  {drafts.length === 0
                    ? "Sem nenhuma faixa cadastrada o frete grátis vale para todo o Brasil — é o comportamento atual."
                    : "Só CEPs dentro de uma destas faixas recebem o frete grátis automático."}
                </p>
              </div>
              <button
                className={[
                  "inline-flex h-11 items-center gap-2 border-2 border-dashed border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
                  FOCUS_RING,
                ].join(" ")}
                disabled={isSaving || drafts.length >= MAX_RANGES}
                onClick={addRange}
                type="button"
              >
                <Plus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                Adicionar faixa
              </button>
            </div>

            {drafts.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 border-2 border-dashed border-[#1a1a1a] bg-white px-4 py-5 text-xs font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
                <Globe2 aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                Sem restrição regional
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {drafts.map((draft, index) => {
                  const rowError = rowErrors[draft.key];
                  const label = `Faixa ${index + 1}`;

                  return (
                    <li
                      className="border-2 border-[#1a1a1a] bg-white px-4 py-4"
                      key={draft.key}
                    >
                      <div className="flex flex-wrap items-end gap-3">
                        <span className="flex h-11 items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/60">
                          <MapPin aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                          {label}
                        </span>

                        <div className="min-w-0 flex-[1_1_10rem]">
                          <label
                            className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
                            htmlFor={`${draft.key}-min`}
                          >
                            <span className="flex h-4 items-center">CEP inicial</span>
                          </label>
                          <input
                            aria-describedby={rowError ? `${draft.key}-error` : undefined}
                            aria-invalid={Boolean(rowError)}
                            className={[
                              "mt-2 h-11 w-full rounded-none border-2 bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
                              rowError ? "border-[#c0392b]" : "border-[#1a1a1a]",
                              FOCUS_RING,
                            ].join(" ")}
                            disabled={isSaving}
                            id={`${draft.key}-min`}
                            inputMode="numeric"
                            onChange={(event) => updateDraft(draft.key, "minCep", event.target.value)}
                            placeholder="70000-000"
                            value={draft.minCep}
                          />
                        </div>

                        <div className="min-w-0 flex-[1_1_10rem]">
                          <label
                            className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
                            htmlFor={`${draft.key}-max`}
                          >
                            <span className="flex h-4 items-center">CEP final</span>
                          </label>
                          <input
                            aria-describedby={rowError ? `${draft.key}-error` : undefined}
                            aria-invalid={Boolean(rowError)}
                            className={[
                              "mt-2 h-11 w-full rounded-none border-2 bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
                              rowError ? "border-[#c0392b]" : "border-[#1a1a1a]",
                              FOCUS_RING,
                            ].join(" ")}
                            disabled={isSaving}
                            id={`${draft.key}-max`}
                            inputMode="numeric"
                            onChange={(event) => updateDraft(draft.key, "maxCep", event.target.value)}
                            placeholder="70999-999"
                            value={draft.maxCep}
                          />
                        </div>

                        <button
                          aria-label={`Remover ${label.toLowerCase()}`}
                          className={[
                            "inline-flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#c0392b] transition hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-45",
                            FOCUS_RING,
                          ].join(" ")}
                          disabled={isSaving}
                          onClick={() => removeRange(draft.key)}
                          type="button"
                        >
                          <Trash2 aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                        </button>
                      </div>

                      {rowError ? (
                        <p
                          className="mt-3 text-xs font-bold text-[#c0392b]"
                          id={`${draft.key}-error`}
                          role="alert"
                        >
                          ⚠ {rowError}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {error ? <InlineAlert tone="critical">⚠ {error}</InlineAlert> : null}

      <p className="text-xs leading-5 text-[#231f20]/64">
        As regiões governam só o frete grátis automático. Um cupom com frete grátis foi concedido
        caso a caso e continua valendo em qualquer CEP.
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
