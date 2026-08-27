"use client";

import { Plus, Trash2 } from "lucide-react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import { InfoTooltip } from "@/components/layout/admin-panel/sections/products/components/form-fields";
import { formatCep } from "@/features/revendedor/utils/revendedor-formatters";
import {
  type CoverageBlock,
  type CoverageRangeValue,
  CUSTOM_COVERAGE_PRESET_ID,
  EMPTY_COVERAGE_PRESET_ID,
  BRAZIL_COVERAGE_PRESETS,
  COVERAGE_PRESET_OPTIONS,
  COVERAGE_TOOLTIP_TEXT,
  buildCoverageBlocksFromRanges,
  createEmptyCoverageRange,
  flattenCoverageBlocks,
  getCoveragePresetById,
} from "@/features/vendor-coverage/coverage-presets";

type VendorCoverageRangesFieldProps = {
  addButtonLabel?: string;
  maxError?: string;
  minError?: string;
  mode?: "multi" | "single";
  onChangeRanges: (ranges: CoverageRangeValue[]) => void;
  ranges: CoverageRangeValue[];
  required?: boolean;
  variant: "revendedor-dark" | "vendor-create" | "vendor-panel";
};

export function VendorCoverageRangesField({
  addButtonLabel = "Faixa de CEP",
  maxError,
  minError,
  mode = "multi",
  onChangeRanges,
  ranges,
  required = false,
  variant,
}: VendorCoverageRangesFieldProps) {
  const blocks = buildCoverageBlocksFromRanges(ranges, mode);

  function updateBlocks(nextBlocks: CoverageBlock[]) {
    onChangeRanges(flattenCoverageBlocks(nextBlocks));
  }

  function updateBlockPreset(blockIndex: number, presetId: string) {
    const preset = getCoveragePresetById(presetId);
    const nextBlocks = blocks.map((block, currentIndex) => {
      if (currentIndex !== blockIndex) {
        return block;
      }

      if (!preset || preset.isCustom) {
        return {
          presetId: CUSTOM_COVERAGE_PRESET_ID,
          ranges: [createEmptyCoverageRange()],
        };
      }

      return {
        presetId: preset.id,
        ranges: preset.ranges.map((range) => ({ ...range })),
      };
    });

    updateBlocks(nextBlocks);
  }

  function updateCustomRange(blockIndex: number, key: keyof CoverageRangeValue, value: string) {
    const nextBlocks = blocks.map((block, currentIndex) => {
      if (currentIndex !== blockIndex) {
        return block;
      }

      return {
        ...block,
        ranges: block.ranges.map((range, rangeIndex) =>
          rangeIndex === 0 ? { ...range, [key]: formatCep(value) } : range,
        ),
      };
    });

    updateBlocks(nextBlocks);
  }

  function addBlock() {
    updateBlocks([
      ...blocks,
      {
        presetId: CUSTOM_COVERAGE_PRESET_ID,
        ranges: [createEmptyCoverageRange()],
      },
    ]);
  }

  function removeBlock(blockIndex: number) {
    const nextBlocks = blocks.filter((_, currentIndex) => currentIndex !== blockIndex);
    updateBlocks(nextBlocks.length > 0 ? nextBlocks : [{ presetId: EMPTY_COVERAGE_PRESET_ID, ranges: [] }]);
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        const preset = getCoveragePresetById(block.presetId) ?? BRAZIL_COVERAGE_PRESETS.at(-1)!;
        const isCustom = preset.isCustom === true;

        return (
          <div className="space-y-3" key={`${block.presetId}-${blockIndex}`}>
            <div className={mode === "multi" ? "grid gap-3 md:grid-cols-[1fr_auto] md:items-end" : ""}>
              <CoveragePresetSelect
                blockIndex={blockIndex}
                isRequired={required && blockIndex === 0}
                onChange={updateBlockPreset}
                value={block.presetId}
                variant={variant}
              />
              {mode === "multi" ? (
                <RemoveButton
                  disabled={false}
                  onClick={() => removeBlock(blockIndex)}
                  variant={variant}
                />
              ) : null}
            </div>

            {block.ranges.map((range, rangeIndex) => {
              const suffix = block.ranges.length > 1 ? ` ${rangeIndex + 1}` : "";
              const currentMinError = isCustom && rangeIndex === 0 ? minError : undefined;
              const currentMaxError = isCustom && rangeIndex === 0 ? maxError : undefined;

              return (
                <div className="grid gap-3 md:grid-cols-2" key={`${blockIndex}-${rangeIndex}`}>
                  <CoverageInput
                    error={currentMinError}
                    label={`CEP inicial${suffix}`}
                    onChange={(value) => updateCustomRange(blockIndex, "minCep", value)}
                    readOnly={!isCustom}
                    value={range.minCep}
                    variant={variant}
                  />
                  <CoverageInput
                    error={currentMaxError}
                    label={`CEP final${suffix}`}
                    onChange={(value) => updateCustomRange(blockIndex, "maxCep", value)}
                    readOnly={!isCustom}
                    value={range.maxCep}
                    variant={variant}
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      {mode === "multi" ? (
        <AddButton label={addButtonLabel} onClick={addBlock} variant={variant} />
      ) : null}
    </div>
  );
}

function CoveragePresetSelect({
  blockIndex,
  isRequired,
  onChange,
  value,
  variant,
}: {
  blockIndex: number;
  isRequired: boolean;
  onChange: (blockIndex: number, presetId: string) => void;
  value: string;
  variant: VendorCoverageRangesFieldProps["variant"];
}) {
  const label = `Região de cobertura por CEP${blockIndex > 0 ? ` ${blockIndex + 1}` : ""}${isRequired ? " *" : ""}`;

  if (variant === "vendor-create") {
    return (
      <CheckoutCustomSelect
        iconClassName="text-[#1a1a1a]"
        label={
          <span className="flex h-4 items-center gap-1.5">
            <span>{label}</span>
            <InfoTooltip text={COVERAGE_TOOLTIP_TEXT} />
          </span>
        }
        labelClassName="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
        listClassName="z-[90] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
        onChange={(presetId) => onChange(blockIndex, presetId)}
        optionClassName="tracking-normal"
        options={COVERAGE_PRESET_OPTIONS}
        placeholder="Selecione uma região"
        selectedValueClassName="text-[#1a1a1a]"
        triggerClassName="!h-11 w-full rounded-none !border-2 !border-[#1a1a1a] bg-white px-3 text-sm tracking-normal text-[#1a1a1a] focus:!border-[#1a1a1a]"
        value={value}
      />
    );
  }

  if (variant === "revendedor-dark") {
    return (
      <CheckoutCustomSelect
        iconClassName="text-white/60"
        label={
          <span className="flex items-center gap-1.5">
            <span>{label}</span>
            <InfoTooltip text={COVERAGE_TOOLTIP_TEXT} />
          </span>
        }
        labelClassName="text-[11px] font-black uppercase tracking-[0.24em] text-white/45"
        listClassName="!border-white/10 !bg-[#2b2527] shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
        onChange={(presetId) => onChange(blockIndex, presetId)}
        optionClassName="rounded-none"
        options={COVERAGE_PRESET_OPTIONS}
        placeholder="Selecione uma região"
        placeholderClassName="text-white/45"
        selectedOptionClassName="!bg-brand-yellow !text-brand-dark"
        selectedValueClassName="text-white"
        triggerClassName="h-12 rounded-xl border border-white/20 bg-white/10 focus:border-brand-yellow"
        unselectedOptionClassName="!text-white hover:!bg-white/10"
        value={value}
      />
    );
  }

  return (
    <CheckoutCustomSelect
      label={
        <span className="flex items-center gap-1.5">
          <span>{label}</span>
          <InfoTooltip text={COVERAGE_TOOLTIP_TEXT} />
        </span>
      }
      labelClassName="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark/50"
      listClassName="z-[90] rounded-[14px] border border-brand-dark/12 bg-white shadow-[0_12px_28px_rgba(35,31,32,0.12)]"
      onChange={(presetId) => onChange(blockIndex, presetId)}
      options={COVERAGE_PRESET_OPTIONS}
      placeholder="Selecione uma região"
      triggerClassName="h-12 rounded-[12px] border border-brand-dark/12 bg-[#fbf7ef] px-4 text-sm font-semibold text-brand-dark focus:border-brand-dark"
      value={value}
    />
  );
}

function CoverageInput({
  error,
  label,
  onChange,
  readOnly,
  value,
  variant,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  value: string;
  variant: VendorCoverageRangesFieldProps["variant"];
}) {
  const inputId = `${variant}-${label.toLowerCase().replace(/\s+/g, "-")}`;

  if (variant === "vendor-create") {
    return (
      <label className="block">
        <span className="flex h-4 items-center gap-1.5 text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]">
          {label}
        </span>
        <input
          className={[
            "mt-2 h-11 w-full rounded-none border-2 px-3 text-sm outline-none transition focus:ring-0",
            readOnly
              ? "cursor-not-allowed border-dashed border-[#1a1a1a]/25 bg-[#1a1a1a]/5 text-[#1a1a1a]/40"
              : error
                ? "border-[#c0392b] bg-white text-[#1a1a1a] focus:border-[#1a1a1a]"
                : "border-[#1a1a1a] bg-white text-[#1a1a1a] focus:border-[#1a1a1a]",
          ].join(" ")}
          inputMode="numeric"
          onChange={(event) => onChange(event.target.value)}
          placeholder={label.includes("final") ? "99999-999" : "00000-000"}
          readOnly={readOnly}
          value={value}
        />
        {error ? <span className="mt-1 block text-[11px] font-semibold text-[#c0392b]">{error}</span> : null}
      </label>
    );
  }

  if (variant === "revendedor-dark") {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest text-white/70" htmlFor={inputId}>
          {label}
        </label>
        <div
          className={[
            "flex h-12 items-center rounded-xl border px-4 transition",
            readOnly ? "border-white/10 bg-white/5" : "bg-white/10",
            error ? "border-red-400 focus-within:border-red-400" : "border-white/20 focus-within:border-brand-yellow",
          ].join(" ")}
        >
          <input
            className={[
              "w-full border-0 bg-transparent text-sm tracking-[-0.1504px] outline-none",
              readOnly ? "cursor-not-allowed text-white/60" : "text-white placeholder:text-white/30",
            ].join(" ")}
            id={inputId}
            inputMode="numeric"
            onChange={(event) => onChange(event.target.value)}
            placeholder={label.includes("final") ? "99999-999" : "00000-000"}
            readOnly={readOnly}
            value={value}
          />
        </div>
        <span className="min-h-5 text-[11px] tracking-[0.05px] text-red-300">{error ?? ""}</span>
      </div>
    );
  }

  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark/50">
        {label}
      </span>
      <input
        className={[
          "mt-2 h-12 w-full rounded-[12px] border px-4 text-sm font-semibold outline-none transition",
          readOnly
            ? "cursor-not-allowed border-brand-dark/8 bg-[#f2eee6] text-brand-dark/45"
            : error
              ? "border-rose-300 bg-[#fbf7ef] text-brand-dark focus:border-rose-500"
              : "border-brand-dark/12 bg-[#fbf7ef] text-brand-dark focus:border-brand-dark",
        ].join(" ")}
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        placeholder={label.includes("final") ? "99999-999" : "00000-000"}
        readOnly={readOnly}
        value={value}
      />
      {error ? <span className="mt-1 block text-[11px] font-semibold text-rose-700">{error}</span> : null}
    </label>
  );
}

function RemoveButton({
  disabled,
  onClick,
  variant,
}: {
  disabled: boolean;
  onClick: () => void;
  variant: VendorCoverageRangesFieldProps["variant"];
}) {
  const className =
    variant === "vendor-panel"
      ? "self-end inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-[12px] border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      : "self-end inline-flex h-11 w-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#c0392b] transition hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <button
      aria-label="Remover faixa"
      className={className}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Trash2 className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}

function AddButton({
  label,
  onClick,
  variant,
}: {
  label: string;
  onClick: () => void;
  variant: VendorCoverageRangesFieldProps["variant"];
}) {
  const className =
    variant === "vendor-panel"
      ? "inline-flex h-10 cursor-pointer items-center gap-2 rounded-[12px] border border-dashed border-brand-dark/16 bg-white px-3 text-xs font-black uppercase tracking-widest text-brand-dark transition hover:bg-brand-yellow"
      : "inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-dashed border-[#1a1a1a] bg-white px-3 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-brand-yellow";

  return (
    <button className={className} onClick={onClick} type="button">
      <Plus className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  );
}
