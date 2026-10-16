"use client";

import type { SkuImportResult as SkuImportResultData, SkuImportResultRow } from "@/features/vendor-sku-import/types/vendor-sku-import";

import { SKU_IMPORT_RESULT_LABELS, SKU_IMPORT_RESULT_TONES } from "./sku-import-labels";

const CELL = "border-b border-[#1a1a1a]/12 px-3 py-2.5 align-top text-sm";

function ResultChange({ row }: Readonly<{ row: SkuImportResultRow }>) {
  if (row.targets.length === 0) {
    return <span className="text-xs leading-5 text-[#231f20]/70">{row.reason || "—"}</span>;
  }
  return (
    <ul className="space-y-0.5 text-xs">
      {row.targets.map((target) => (
        <li key={target.productId}>
          <span className="font-semibold">{target.name}</span>{" "}
          <span className="font-mono">{target.oldCode ?? "—"} → {target.newCode ?? "SKU Papelito"}</span>
        </li>
      ))}
    </ul>
  );
}

type SkuImportResultProps = {
  /** Resultado devolvido pela confirmação. */
  result: SkuImportResultData;
  /** Linhas ignoradas pelo vendor na prévia, que não foram enviadas. */
  ignored: number;
};

/**
 * Resumo por linha do que a confirmação gravou de fato.
 * Linha recusada, em conflito ou alterada desde a prévia aparece com o motivo, sem selo de sucesso.
 */
export function SkuImportResult({ ignored, result }: Readonly<SkuImportResultProps>) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#231f20]/75">
        {result.rows.length} {result.rows.length === 1 ? "linha enviada" : "linhas enviadas"} · {ignored}{" "}
        {ignored === 1 ? "ignorada" : "ignoradas"} na prévia.
      </p>
      <div className="max-h-[50vh] overflow-auto border-2 border-[#1a1a1a] bg-white">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-1 bg-[#faf8f2]">
            <tr>
              {["Linha", "Planilha", "Resultado", "Alteração"].map((header) => (
                <th className="border-b-2 border-[#1a1a1a] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]" key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.line}>
                <td className={`${CELL} font-mono text-xs text-[#231f20]/62`}>{row.line}</td>
                <td className={CELL}>
                  <p className="font-semibold text-[#1a1a1a]">{row.description}</p>
                  <p className="font-mono text-xs text-[#231f20]/62">{row.code}</p>
                </td>
                <td className={CELL}>
                  <span className={`inline-flex whitespace-nowrap border-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${SKU_IMPORT_RESULT_TONES[row.status]}`}>
                    {SKU_IMPORT_RESULT_LABELS[row.status]}
                  </span>
                </td>
                <td className={CELL}>
                  <ResultChange row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
