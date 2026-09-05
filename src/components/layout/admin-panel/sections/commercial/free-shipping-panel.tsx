"use client";

import { Globe2, Loader2, MapPin, Plus, Save, Trash2, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState, useTransition, type FormEvent } from "react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import { formatCep, normalizeCep } from "@/features/revendedor/utils/revendedor-formatters";
import type {
  FreeShippingThreshold,
  FreeShippingZipRange,
} from "@/features/shipping/services/get-free-shipping-threshold";
import {
  type CoverageRangeValue,
  CUSTOM_COVERAGE_PRESET_ID,
  EMPTY_COVERAGE_PRESET_ID,
  REGION_COVERAGE_PRESET_OPTIONS,
  buildCoverageBlocksFromRanges,
  createEmptyCoverageRange,
  formatCoverageRangesSummary,
  getCoveragePresetById,
} from "@/features/vendor-coverage/coverage-presets";
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

/**
 * Uma abrangência é uma região pronta ou uma faixa digitada à mão.
 *
 * `presetId` guarda qual: `custom` para faixa manual, `empty` para região ainda não escolhida e o
 * id da UF para região pronta. Só o rascunho conhece essa distinção — o backend continua recebendo
 * a lista plana de faixas, e a região é redescoberta na leitura por `buildCoverageBlocksFromRanges`.
 */
type ScopeDraft = {
  key: string;
  presetId: string;
  ranges: CoverageRangeValue[];
};

function isRegionScope(scope: ScopeDraft): boolean {
  return scope.presetId !== CUSTOM_COVERAGE_PRESET_ID;
}

/**
 * As chaves derivam de `useId` mais a posição inicial, e nunca de um contador de módulo.
 *
 * Um contador em nível de módulo avança no processo do servidor e outra vez no navegador, então o
 * `id` do campo saía diferente nos dois lados e a hidratação quebrava sem erro visível na tela.
 */
function toScopeDrafts(prefix: string, ranges: FreeShippingZipRange[]): ScopeDraft[] {
  if (ranges.length === 0) {
    return [];
  }

  return buildCoverageBlocksFromRanges(ranges, "multi").map((block, index) => ({
    key: `${prefix}-${index}`,
    presetId: block.presetId,
    ranges: block.ranges.length > 0 ? block.ranges : [createEmptyCoverageRange()],
  }));
}

function countDraftRanges(scopes: ScopeDraft[]): number {
  return scopes.reduce((total, scope) => total + (scope.ranges.length > 0 ? scope.ranges.length : 1), 0);
}

function describeScopeCount(count: number): string {
  if (count === 0) {
    return "todo o Brasil";
  }

  return count === 1 ? "1 região" : `${count} regiões`;
}

function describeSavedScopes(ranges: FreeShippingZipRange[]): string[] {
  if (ranges.length === 0) {
    return [];
  }

  return buildCoverageBlocksFromRanges(ranges, "multi").map((block) => {
    const preset = getCoveragePresetById(block.presetId);

    return preset && preset.isCustom !== true
      ? preset.label
      : formatCoverageRangesSummary(block.ranges);
  });
}

function scopeLabel(scope: ScopeDraft, index: number): string {
  const preset = getCoveragePresetById(scope.presetId);

  return preset && preset.isCustom !== true ? preset.label : `Faixa manual ${index + 1}`;
}

/**
 * Sobreposição não impede salvar: `papelito_shipping_cep_allows_free_shipping()` resolve as faixas
 * por união, então um CEP coberto duas vezes segue coberto uma. O aviso existe só para o
 * administrador não achar que cadastrou duas regras com efeitos diferentes.
 */
function describeOverlaps(scopes: ScopeDraft[]): string | null {
  const entries = scopes.flatMap((scope, index) =>
    scope.ranges.flatMap((range) => {
      const minCep = normalizeCep(range.minCep);
      const maxCep = normalizeCep(range.maxCep);

      if (minCep === "" || maxCep === "" || Number(minCep) > Number(maxCep)) {
        return [];
      }

      return [{ index, label: scopeLabel(scope, index), max: Number(maxCep), min: Number(minCep) }];
    }),
  );

  const pairs = new Set<string>();

  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      const first = entries[left];
      const second = entries[right];

      if (first.index === second.index) {
        continue;
      }

      if (first.min <= second.max && second.min <= first.max) {
        pairs.add(`${first.label} e ${second.label}`);
      }
    }
  }

  return pairs.size === 0 ? null : [...pairs].join("; ");
}

type FreeShippingPanelProps = {
  initialIssues: string[];
  initialThreshold: FreeShippingThreshold | null;
};

export function FreeShippingPanel({
  initialIssues,
  initialThreshold,
}: Readonly<FreeShippingPanelProps>) {
  const router = useRouter();
  const idPrefix = useId().replaceAll(":", "");
  const [minimum, setMinimum] = useState(
    formatCentsForInput(initialThreshold?.minimumOrderCents ?? null),
  );
  const [drafts, setDrafts] = useState<ScopeDraft[]>(() =>
    toScopeDrafts(idPrefix, initialThreshold?.zipRanges ?? []),
  );
  // Só avança em interação do usuário, que é sempre no cliente.
  const nextIndexRef = useRef(toScopeDrafts(idPrefix, initialThreshold?.zipRanges ?? []).length);
  const [savedState, setSavedState] = useState<FreeShippingThreshold | null>(initialThreshold);
  const [error, setError] = useState<string | null>(initialIssues[0] ?? null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [, startTransition] = useTransition();
  const { dismissToast, isVisible, showToast, toast } = useAdminToast();

  const draftRangeCount = countDraftRanges(drafts);
  const overlapWarning = useMemo(() => describeOverlaps(drafts), [drafts]);

  function clearRowError(key: string) {
    setRowErrors((previous) => {
      if (!previous[key]) {
        return previous;
      }

      const next = { ...previous };
      delete next[key];

      return next;
    });
  }

  function replaceScope(key: string, update: (scope: ScopeDraft) => ScopeDraft) {
    setDrafts((previous) => previous.map((scope) => (scope.key === key ? update(scope) : scope)));
    clearRowError(key);
  }

  function setScopeMode(key: string, mode: "manual" | "region") {
    setError(null);
    replaceScope(key, (scope) =>
      mode === "manual"
        ? { ...scope, presetId: CUSTOM_COVERAGE_PRESET_ID, ranges: [createEmptyCoverageRange()] }
        : { ...scope, presetId: EMPTY_COVERAGE_PRESET_ID, ranges: [] },
    );
  }

  function selectScopeRegion(key: string, presetId: string) {
    const preset = getCoveragePresetById(presetId);

    if (!preset || preset.isCustom === true) {
      return;
    }

    const current = drafts.find((scope) => scope.key === key);
    const currentCount = current ? (current.ranges.length > 0 ? current.ranges.length : 1) : 0;

    if (draftRangeCount - currentCount + preset.ranges.length > MAX_RANGES) {
      setError(`O limite é de ${MAX_RANGES} faixas de CEP.`);

      return;
    }

    setError(null);
    replaceScope(key, (scope) => ({
      ...scope,
      presetId: preset.id,
      ranges: preset.ranges.map((range) => ({ ...range })),
    }));
  }

  function updateManualRange(key: string, field: keyof CoverageRangeValue, value: string) {
    replaceScope(key, (scope) => ({
      ...scope,
      ranges: [{ ...(scope.ranges[0] ?? createEmptyCoverageRange()), [field]: formatCep(value) }],
    }));
  }

  function addScope() {
    if (draftRangeCount >= MAX_RANGES) {
      setError(`O limite é de ${MAX_RANGES} faixas de CEP.`);

      return;
    }

    setError(null);
    setDrafts((previous) => [
      ...previous,
      {
        key: `${idPrefix}-${nextIndexRef.current++}`,
        presetId: EMPTY_COVERAGE_PRESET_ID,
        ranges: [],
      },
    ]);
  }

  function removeScope(key: string) {
    setDrafts((previous) => previous.filter((scope) => scope.key !== key));
    clearRowError(key);
  }

  /**
   * Região pronta grava as faixas do preset, nunca as do rascunho.
   *
   * O rascunho carrega uma cópia só para exibir; se a definição da UF mudar no módulo compartilhado,
   * o que vai para o banco continua sendo a definição vigente e não uma cópia envelhecida na tela.
   */
  function collectZipRanges(): { rowErrors: Record<string, string>; zipRanges: FreeShippingZipRange[] } {
    const nextRowErrors: Record<string, string> = {};
    const zipRanges: FreeShippingZipRange[] = [];
    const usedRegions = new Set<string>();

    drafts.forEach((scope, index) => {
      if (!isRegionScope(scope)) {
        const minCep = normalizeCep(scope.ranges[0]?.minCep ?? "");
        const maxCep = normalizeCep(scope.ranges[0]?.maxCep ?? "");

        if (minCep === "" || maxCep === "") {
          nextRowErrors[scope.key] = "Informe os oito dígitos do CEP inicial e do final.";

          return;
        }

        if (Number(minCep) > Number(maxCep)) {
          nextRowErrors[scope.key] = "O CEP final precisa ser maior ou igual ao inicial.";

          return;
        }

        zipRanges.push({ maxCep, minCep });

        return;
      }

      if (scope.presetId === EMPTY_COVERAGE_PRESET_ID) {
        nextRowErrors[scope.key] = "Selecione uma região ou troque para faixa manual.";

        return;
      }

      const preset = getCoveragePresetById(scope.presetId);

      if (!preset || preset.ranges.length === 0) {
        nextRowErrors[scope.key] = "Esta região não tem faixa de CEP configurada.";

        return;
      }

      if (usedRegions.has(preset.id)) {
        nextRowErrors[scope.key] = `A região ${preset.label} já está na abrangência ${index}.`;

        return;
      }

      usedRegions.add(preset.id);

      for (const range of preset.ranges) {
        zipRanges.push({ maxCep: normalizeCep(range.maxCep), minCep: normalizeCep(range.minCep) });
      }
    });

    return { rowErrors: nextRowErrors, zipRanges };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const minimumOrderCents = parseBRLCents(minimum);

    if (minimumOrderCents === null) {
      setError("Informe um valor monetário positivo no formato 99,00.");

      return;
    }

    const { rowErrors: nextRowErrors, zipRanges } = collectZipRanges();

    setRowErrors(nextRowErrors);

    if (Object.keys(nextRowErrors).length > 0) {
      setError("Corrija as abrangências marcadas antes de salvar.");

      return;
    }

    if (zipRanges.length > MAX_RANGES) {
      setError(`O limite é de ${MAX_RANGES} faixas de CEP.`);

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
      const savedDrafts = toScopeDrafts(idPrefix, saved.zipRanges);

      setSavedState(saved);
      setMinimum(formatCentsForInput(saved.minimumOrderCents));
      nextIndexRef.current = savedDrafts.length;
      setDrafts(savedDrafts);
      showToast({
        description: `Pedidos de ${formatBRL(saved.minimumOrderCents / 100)} para ${describeScopeCount(savedDrafts.length)} passam a ter o frete abatido.`,
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

  const savedScopes = describeSavedScopes(savedState?.zipRanges ?? []);

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

        <div className="border-b-2 border-[#1a1a1a] px-5 py-4">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
            <Truck aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
            {savedState ? (
              <>
                <span>Frete grátis a partir de</span>
                <span data-numeric>{formatBRL(savedState.minimumOrderCents / 100)}</span>
                <span aria-hidden>·</span>
                <span>{describeScopeCount(savedScopes.length)}</span>
              </>
            ) : (
              <span>Regra de frete grátis indisponível</span>
            )}
          </p>

          {savedScopes.length > 0 ? (
            <p className="mt-2 text-xs leading-5 text-[#231f20]/64">
              Abrangência salva: {savedScopes.join(" · ")}
            </p>
          ) : null}
        </div>

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
                    ? "Sem nenhuma abrangência cadastrada o frete grátis vale para todo o Brasil — é o comportamento atual."
                    : "Escolha uma região pronta para usar a faixa de CEP oficial dela, ou digite uma faixa própria."}
                </p>
              </div>
              <button
                className={[
                  "inline-flex h-11 items-center gap-2 border-2 border-dashed border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
                  FOCUS_RING,
                ].join(" ")}
                disabled={isSaving || draftRangeCount >= MAX_RANGES}
                onClick={addScope}
                type="button"
              >
                <Plus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                Adicionar abrangência
              </button>
            </div>

            {drafts.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 border-2 border-dashed border-[#1a1a1a] bg-white px-4 py-5 text-xs font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
                <Globe2 aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                Sem restrição regional
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {drafts.map((scope, index) => (
                  <ScopeRow
                    error={rowErrors[scope.key]}
                    index={index}
                    isSaving={isSaving}
                    key={scope.key}
                    onRemove={() => removeScope(scope.key)}
                    onSelectRegion={(presetId) => selectScopeRegion(scope.key, presetId)}
                    onSetMode={(mode) => setScopeMode(scope.key, mode)}
                    onUpdateManualRange={(field, value) => updateManualRange(scope.key, field, value)}
                    scope={scope}
                  />
                ))}
              </ul>
            )}

            {overlapWarning ? (
              <p className="mt-3 text-xs leading-5 text-[#231f20]/70">
                As abrangências {overlapWarning} se sobrepõem. O CEP repetido continua elegível uma
                vez só — remova a duplicata se ela não foi intencional.
              </p>
            ) : null}
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

type ScopeRowProps = {
  error?: string;
  index: number;
  isSaving: boolean;
  onRemove: () => void;
  onSelectRegion: (presetId: string) => void;
  onSetMode: (mode: "manual" | "region") => void;
  onUpdateManualRange: (field: keyof CoverageRangeValue, value: string) => void;
  scope: ScopeDraft;
};

function ScopeRow({
  error,
  index,
  isSaving,
  onRemove,
  onSelectRegion,
  onSetMode,
  onUpdateManualRange,
  scope,
}: Readonly<ScopeRowProps>) {
  const position = index + 1;
  const isRegion = isRegionScope(scope);
  const preset = isRegion ? getCoveragePresetById(scope.presetId) : null;
  const selectedRegionId = preset && preset.isCustom !== true ? preset.id : "";
  const errorId = error ? `${scope.key}-error` : undefined;

  return (
    <li className="border-2 border-[#1a1a1a] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a]/10 px-4 py-3">
        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/60">
          <MapPin aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          Abrangência {position}
          <span
            className={[
              "border-2 border-[#1a1a1a] px-2 py-0.5 text-[9px] tracking-[0.14em] text-[#1a1a1a]",
              isRegion ? "bg-brand-yellow" : "bg-[#f2eee6]",
            ].join(" ")}
          >
            {isRegion ? "Região pronta" : "Faixa manual"}
          </span>
        </span>

        <div className="flex items-center gap-2">
          <div
            aria-label={`Tipo de abrangência ${position}`}
            className="inline-flex border-2 border-[#1a1a1a]"
            role="group"
          >
            <ModeButton
              disabled={isSaving}
              isActive={isRegion}
              label="Região pronta"
              onClick={() => onSetMode("region")}
            />
            <ModeButton
              className="border-l-2 border-[#1a1a1a]"
              disabled={isSaving}
              isActive={!isRegion}
              label="Faixa manual"
              onClick={() => onSetMode("manual")}
            />
          </div>

          <button
            aria-label={`Remover abrangência ${position}`}
            className={[
              "inline-flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#c0392b] transition hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-45",
              FOCUS_RING,
            ].join(" ")}
            disabled={isSaving}
            onClick={onRemove}
            type="button"
          >
            <Trash2 aria-hidden className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {isRegion ? (
          <div className="max-w-md">
            <CheckoutCustomSelect
              anchoredMenu
              disabled={isSaving}
              label={<span className="flex h-4 items-center">Região</span>}
              labelClassName="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
              listClassName="z-[90] rounded-none border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
              onChange={onSelectRegion}
              optionClassName="tracking-normal"
              options={REGION_COVERAGE_PRESET_OPTIONS}
              placeholder="Selecione uma região"
              searchPlaceholder="Buscar região"
              searchable
              selectedValueClassName="text-[#1a1a1a]"
              triggerClassName="!h-11 w-full rounded-none !border-2 !border-[#1a1a1a] bg-white px-3 text-sm tracking-normal text-[#1a1a1a]"
              value={selectedRegionId}
              wrapperClassName="!gap-0"
            />

            {preset && preset.ranges.length > 0 ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#231f20]/64">
                <span className="shrink-0 font-black uppercase tracking-[0.14em] text-[#231f20]/70">
                  Faixa automática de CEP
                </span>
                <span data-numeric>{formatCoverageRangesSummary(preset.ranges)}</span>
              </p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-[#231f20]/64">
                Escolher a região preenche sozinha a faixa de CEP oficial dela.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <ManualCepInput
              describedBy={errorId}
              disabled={isSaving}
              hasError={Boolean(error)}
              id={`${scope.key}-min`}
              label="CEP inicial"
              onChange={(value) => onUpdateManualRange("minCep", value)}
              placeholder="70000-000"
              value={scope.ranges[0]?.minCep ?? ""}
            />
            <ManualCepInput
              describedBy={errorId}
              disabled={isSaving}
              hasError={Boolean(error)}
              id={`${scope.key}-max`}
              label="CEP final"
              onChange={(value) => onUpdateManualRange("maxCep", value)}
              placeholder="70999-999"
              value={scope.ranges[0]?.maxCep ?? ""}
            />
          </div>
        )}

        {error ? (
          <p className="mt-3 text-xs font-bold text-[#c0392b]" id={errorId} role="alert">
            ⚠ {error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function ModeButton({
  className = "",
  disabled,
  isActive,
  label,
  onClick,
}: Readonly<{
  className?: string;
  disabled: boolean;
  isActive: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      aria-pressed={isActive}
      className={[
        "inline-flex h-9 items-center px-3 text-[10px] font-black uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-45",
        isActive ? "bg-[#1a1a1a] text-white" : "bg-white text-[#1a1a1a] hover:bg-brand-yellow",
        className,
        FOCUS_RING,
      ].join(" ")}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ManualCepInput({
  describedBy,
  disabled,
  hasError,
  id,
  label,
  onChange,
  placeholder,
  value,
}: Readonly<{
  describedBy?: string;
  disabled: boolean;
  hasError: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}>) {
  return (
    <div className="min-w-0 flex-[1_1_10rem]">
      <label
        className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
        htmlFor={id}
      >
        <span className="flex h-4 items-center">{label}</span>
      </label>
      <input
        aria-describedby={describedBy}
        aria-invalid={hasError}
        className={[
          "mt-2 h-11 w-full rounded-none border-2 bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
          hasError ? "border-[#c0392b]" : "border-[#1a1a1a]",
          FOCUS_RING,
        ].join(" ")}
        disabled={disabled}
        id={id}
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}
