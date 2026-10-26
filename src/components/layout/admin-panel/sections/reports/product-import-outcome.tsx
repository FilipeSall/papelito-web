"use client";

import { Ban, Check, Columns3, FileX, TriangleAlert, X } from "lucide-react";

import {
  PRODUCT_IMPORT_TEMPLATE_COLUMNS,
  type ProductImportColumn,
  type ProductImportMissingColumns,
  type ProductImportResult,
} from "@/features/admin-product-import/types/admin-product-import";

import { StatusChip, type StatusShape } from "../../primitives";

const CREATED: StatusShape = { icon: Check, label: "Rascunho", tone: "positive" };
const CREATED_INCOMPLETE: StatusShape = { icon: TriangleAlert, label: "Rascunho incompleto", tone: "pending" };
const NOT_CREATED: StatusShape = { icon: X, label: "Não cadastrado", tone: "critical" };
const IGNORED: StatusShape = { icon: Ban, label: "Ignorado", tone: "neutral" };

const FIELD_LABELS = new Map(PRODUCT_IMPORT_TEMPLATE_COLUMNS.map((column) => [column.key, column.label]));

/**
 * Recusa da planilha antes da conferência: arquivo ilegível ou sem as colunas obrigatórias.
 * Quando faltam colunas, mostra o cabeçalho lido e para onde cada coluna iria.
 */
export function ProductImportFileError({ message, missingColumns }: Readonly<{ message: string; missingColumns: ProductImportMissingColumns | null }>) {
  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-2.5 border-2 border-[#c0392b] bg-white px-4 py-3 text-sm leading-6" role="alert">
        {missingColumns ? (
          <Columns3 aria-hidden className="mt-1 size-4 shrink-0 text-[#c0392b]" strokeWidth={2.4} />
        ) : (
          <FileX aria-hidden className="mt-1 size-4 shrink-0 text-[#c0392b]" strokeWidth={2.4} />
        )}
        <div>
          <p className="font-black text-[#c0392b]">{message}</p>
          <p className="text-[#1a1a1a]">Nenhum produto foi lido. Corrija o arquivo, ou baixe o modelo CSV, e envie de novo.</p>
        </div>
      </div>
      {missingColumns ? <ColumnsTable columns={missingColumns.columns} /> : null}
    </div>
  );
}

function ColumnsTable({ columns }: Readonly<{ columns: ProductImportColumn[] }>) {
  return (
    <div className="overflow-x-auto border-2 border-[#1a1a1a] bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#f7f2e7] text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]">
            <th className="border-b-2 border-[#1a1a1a] px-3 py-2.5">Coluna no arquivo</th>
            <th className="border-b-2 border-[#1a1a1a] px-3 py-2.5">Vai para</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((column, index) => (
            <tr className="border-b-2 border-[#1a1a1a]/10" key={`${column.header}-${index}`}>
              <td className="px-3 py-2.5 font-(family-name:--font-admin-mono) text-xs">{column.header || "(vazia)"}</td>
              <td className="px-3 py-2.5">
                {column.field ? (
                  <StatusChip compact icon={Check} label={FIELD_LABELS.get(column.field) ?? column.field} tone="positive" />
                ) : (
                  <span className="text-xs text-[#231f20]/64">Sem correspondência no modelo; seria ignorada.</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Resultado do lote cadastrado: cada linha do arquivo com o SKU criado ou o motivo de ter ficado
 * de fora.
 */
export function ProductImportResultView({ result }: Readonly<{ result: ProductImportResult }>) {
  return (
    <div className="grid gap-4">
      <output className="flex items-start gap-2.5 border-2 border-[#1a1a1a] bg-brand-yellow px-4 py-3 text-sm leading-6 text-[#1a1a1a]">
        <Check aria-hidden className="mt-1 size-4 shrink-0" strokeWidth={2.4} />
        <span>
          <strong className="font-black">Lote {result.lot} cadastrado.</strong> {result.created.length}{" "}
          {result.created.length === 1 ? "produto entrou" : "produtos entraram"} em Produtos como rascunho.
        </span>
      </output>
      <div className="overflow-x-auto border-2 border-[#1a1a1a] bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]">
              <th className="border-b-2 border-[#1a1a1a] bg-[#f7f2e7] px-3 py-2.5">Linha</th>
              <th className="border-b-2 border-[#1a1a1a] bg-[#f7f2e7] px-3 py-2.5">Produto</th>
              <th className="border-b-2 border-[#1a1a1a] bg-[#f7f2e7] px-3 py-2.5">SKU</th>
              <th className="border-b-2 border-[#1a1a1a] bg-[#f7f2e7] px-3 py-2.5">Situação</th>
            </tr>
          </thead>
          <tbody>
            {result.created.map((item) => (
              <ResultRow key={item.line} line={item.line} name={item.name} sku={item.sku} status={item.incomplete ? CREATED_INCOMPLETE : CREATED} />
            ))}
            {result.errors.map((item) => (
              <ResultRow detail={item.issues.map((issue) => issue.message).join(" · ")} key={item.line} line={item.line} name={item.name} status={NOT_CREATED} />
            ))}
            {result.ignored.map((item) => (
              <ResultRow detail={item.status === "repetida" ? "Repetida no arquivo." : "Já existe no catálogo."} key={item.line} line={item.line} name={item.name} status={IGNORED} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ResultRowProps = {
  detail?: string;
  line: number;
  name: string;
  sku?: string;
  status: StatusShape;
};

function ResultRow({ detail, line, name, sku, status }: Readonly<ResultRowProps>) {
  return (
    <tr className="border-b-2 border-[#1a1a1a]/10 align-top">
      <td className="w-px px-3 py-2.5 font-(family-name:--font-admin-mono) text-xs text-[#1a1a1a]/60" data-numeric>
        {line}
      </td>
      <td className="px-3 py-2.5">
        <p className="font-bold text-[#1a1a1a]">{name || "(sem nome)"}</p>
        {detail ? <p className="mt-0.5 text-xs leading-5 text-[#231f20]/72">{detail}</p> : null}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 font-(family-name:--font-admin-mono) text-xs">{sku ?? "—"}</td>
      <td className="px-3 py-2.5">
        <StatusChip className="whitespace-nowrap" compact {...status} />
      </td>
    </tr>
  );
}
