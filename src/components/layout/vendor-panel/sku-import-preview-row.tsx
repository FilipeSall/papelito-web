"use client";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import type {
  SkuImportFamily,
  SkuImportPreviewRow,
  SkuImportStatus,
} from "@/features/vendor-sku-import/types/vendor-sku-import";
import { skuImportOptions } from "@/features/vendor-sku-import/utils/sku-import-decisions";

import { SKU_IMPORT_STATUS_LABELS, SKU_IMPORT_STATUS_TONES } from "./sku-import-labels";

const IGNORE_VALUE = "";
const CELL = "border-b border-[#1a1a1a]/12 px-3 py-3 align-top text-sm";

type SkuImportPreviewRowProps = {
  /** Linha marcada em conflito pelas escolhas atuais do vendor. */
  conflicting: boolean;
  /** Linha da prévia. */
  row: SkuImportPreviewRow;
  /** Família escolhida; `null` quando a linha está ignorada. */
  selected: SkuImportFamily | null;
  /** Registra a escolha do vendor para a linha. */
  onDecide: (line: number, familyId: number | null) => void;
};

/** Selo de status de uma linha da prévia. */
export function SkuImportStatusBadge({ status }: Readonly<{ status: SkuImportStatus }>) {
  return (
    <span className={`inline-flex whitespace-nowrap border-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${SKU_IMPORT_STATUS_TONES[status]}`}>
      {SKU_IMPORT_STATUS_LABELS[status]}
    </span>
  );
}

function uniqueCodes(family: SkuImportFamily | null) {
  if (!family) return "—";
  const codes = [...new Set(family.targets.map((target) => target.currentCode ?? target.papelitoSku ?? "—"))];
  return codes.join(", ");
}

function SkuImportFamilyChoice({ onDecide, row, selected }: Readonly<Omit<SkuImportPreviewRowProps, "conflicting">>) {
  const options = skuImportOptions(row);
  if (options.length === 0) {
    return <span className="text-[#231f20]/55">—</span>;
  }
  return (
    <select
      aria-label={`Produto para a linha ${row.line}`}
      className={[
        "w-full min-w-48 border-2 border-[#1a1a1a] bg-white px-2 py-1.5 text-sm text-[#1a1a1a]",
        FOCUS_RING,
      ].join(" ")}
      onChange={(event) => onDecide(row.line, event.target.value === IGNORE_VALUE ? null : Number(event.target.value))}
      value={selected ? String(selected.familyId) : IGNORE_VALUE}
    >
      <option value={IGNORE_VALUE}>Ignorar linha</option>
      {options.map((family) => (
        <option key={family.familyId} value={family.familyId}>
          {family.name}
        </option>
      ))}
    </select>
  );
}

function SkuImportVariants({ family }: Readonly<{ family: SkuImportFamily | null }>) {
  if (!family || family.targets.length < 2) return null;
  return (
    <p className="mt-1 text-xs text-[#231f20]/62">
      {family.targets.length} variações: {family.targets.map((target) => target.name.replace(`${family.name} - `, "")).join(", ")}
    </p>
  );
}

/**
 * Linha da prévia: descrição da planilha, produto escolhido, SKU atual e novo, status.
 * O `select` é a única forma de aplicar ou ignorar; revisão começa ignorada.
 */
export function SkuImportPreviewRowView({ conflicting, onDecide, row, selected }: Readonly<SkuImportPreviewRowProps>) {
  const shown = selected ?? row.family ?? row.candidates[0] ?? null;
  const status: SkuImportStatus = conflicting ? "conflict" : row.status;
  const muted = row.status === "up_to_date" ? "bg-[#eeece5]/60" : "";
  const reason = conflicting ? "Outra linha escolhida disputa este produto ou este código." : row.reason;

  return (
    <tr className={muted}>
      <td className={`${CELL} font-mono text-xs text-[#231f20]/62`}>{row.line}</td>
      <td className={CELL}>
        <p className="font-semibold text-[#1a1a1a]">{row.description}</p>
        {row.subgroup ? <p className="mt-0.5 text-xs text-[#231f20]/55">{row.subgroup}</p> : null}
      </td>
      <td className={CELL}>
        <SkuImportFamilyChoice onDecide={onDecide} row={row} selected={selected} />
        <SkuImportVariants family={shown} />
      </td>
      <td className={`${CELL} font-mono text-xs`}>{uniqueCodes(shown)}</td>
      <td className={`${CELL} font-mono text-xs font-bold`}>{row.code || "—"}</td>
      <td className={CELL}>
        <SkuImportStatusBadge status={status} />
        {reason ? <p className="mt-1 max-w-56 text-xs leading-5 text-[#231f20]/70">{reason}</p> : null}
      </td>
    </tr>
  );
}
