"use client";

import { Check, Copy, Files, Info, ShieldAlert, TriangleAlert, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ProductImportPreview, ProductImportRow } from "@/features/admin-product-import/types/admin-product-import";
import {
  filterImportRows,
  PRODUCT_IMPORT_FILTERS,
  productImportCounts,
  type ProductImportFilter,
} from "@/features/admin-product-import/utils/product-import-decisions";

import { FOCUS_RING, StatusChip } from "../../primitives";
import { importRowStatus } from "./report-status";

type ProductImportReviewProps = {
  /** Aceite de reimportar um arquivo que já gerou lote. */
  acknowledged: boolean;
  /** Linhas duplicadas que o admin decidiu cadastrar mesmo assim. */
  createLines: ReadonlySet<number>;
  /** Recorte ativo da tabela. */
  filter: ProductImportFilter;
  onAcknowledge: (value: boolean) => void;
  onFilter: (filter: ProductImportFilter) => void;
  onToggleCreate: (line: number, create: boolean) => void;
  preview: ProductImportPreview;
};

const BRAZILIAN_DATE = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const CURRENCY = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });

/**
 * Conferência da planilha antes do cadastro: quantas linhas entram, o que fica de fora e por
 * quê, e a decisão sobre cada produto que já existe no catálogo. Nada aqui grava.
 */
export function ProductImportReview({
  acknowledged,
  createLines,
  filter,
  onAcknowledge,
  onFilter,
  onToggleCreate,
  preview,
}: Readonly<ProductImportReviewProps>) {
  const counts = productImportCounts(preview.rows, createLines);
  const rows = filterImportRows(preview.rows, filter, createLines);

  return (
    <div className="grid gap-4">
      <RepeatedFileAlert acknowledged={acknowledged} onAcknowledge={onAcknowledge} preview={preview} />
      <dl className="grid grid-cols-2 gap-0.5 border-2 border-[#1a1a1a] bg-[#1a1a1a]/10 sm:grid-cols-4">
        <CountCell icon={Check} label="Entram" value={counts.entram} />
        <CountCell icon={Copy} label="Já existem, fora" value={counts.duplicadosFora} />
        <CountCell icon={Files} label="Repetidas" value={counts.repetidas} />
        <CountCell critical icon={X} label="Com erro" value={counts.erros} />
      </dl>
      <DuplicatesNotice total={preview.summary.duplicado} />
      <div className="border-2 border-[#1a1a1a] bg-white">
        <FilterTabs createLines={createLines} filter={filter} onFilter={onFilter} rows={preview.rows} />
        <RowsTable createLines={createLines} onToggleCreate={onToggleCreate} rows={rows} />
      </div>
      <p className="flex items-start gap-2 text-sm leading-6 text-[#231f20]/72">
        <Info aria-hidden className="mt-1 size-3.5 shrink-0" strokeWidth={2.4} />
        <span>
          Tudo entra como <strong className="font-black text-[#1a1a1a]">rascunho</strong>: a imagem é obrigatória na vitrine e não vem pela planilha. O
          SKU (PPL-…) é gerado no cadastro.
        </span>
      </p>
    </div>
  );
}

type CountCellProps = {
  critical?: boolean;
  icon: LucideIcon;
  label: string;
  value: number;
};

function CountCell({ critical = false, icon: Icon, label, value }: Readonly<CountCellProps>) {
  return (
    <div className="bg-white px-4 py-2.5">
      <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/62">
        <Icon aria-hidden className="size-3.5" strokeWidth={2.4} />
        {label}
      </dt>
      <dd className={["mt-0.5 text-[26px] font-semibold leading-tight", critical ? "text-[#c0392b]" : "text-[#1a1a1a]"].join(" ")} data-numeric style={{ fontFamily: "var(--font-admin-display)" }}>
        {value.toLocaleString("pt-BR")}
      </dd>
    </div>
  );
}

function RepeatedFileAlert({
  acknowledged,
  onAcknowledge,
  preview,
}: Readonly<{ acknowledged: boolean; onAcknowledge: (value: boolean) => void; preview: ProductImportPreview }>) {
  const previous = preview.alreadyImported;
  if (!previous) return null;
  return (
    <div className="flex items-start gap-2.5 border-2 border-[#c0392b] bg-white px-4 py-3 text-sm leading-6" role="alert">
      <ShieldAlert aria-hidden className="mt-1 size-4 shrink-0 text-[#c0392b]" strokeWidth={2.4} />
      <div>
        <p className="font-black text-[#c0392b]">Este arquivo já foi importado.</p>
        <p className="text-[#1a1a1a]">
          Lote {previous.lot}, em {BRAZILIAN_DATE.format(new Date(previous.at))}, com {previous.created} produto{previous.created === 1 ? "" : "s"}. As
          linhas que ele criou aparecem agora como “Já existe”.
        </p>
        <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2.5 font-semibold text-[#1a1a1a]">
          <input
            checked={acknowledged}
            className="size-4 accent-[#1a1a1a]"
            onChange={(event) => onAcknowledge(event.target.checked)}
            type="checkbox"
          />
          <span>Entendo e quero importar este arquivo de novo</span>
        </label>
      </div>
    </div>
  );
}

function DuplicatesNotice({ total }: Readonly<{ total: number }>) {
  if (total === 0) return null;
  return (
    <p className="flex items-start gap-2.5 border-2 border-[#1a1a1a] bg-white px-4 py-3 text-sm leading-6 text-[#1a1a1a]">
      <Copy aria-hidden className="mt-1 size-4 shrink-0" strokeWidth={2.4} />
      <span>
        <strong className="font-black">
          {total === 1 ? "1 linha tem" : `${total} linhas têm`} nome e categoria iguais a um produto do catálogo.
        </strong>{" "}
        Elas não entram, a não ser que você escolha “Cadastrar mesmo assim” — o produto existente nunca é alterado.
      </span>
    </p>
  );
}

function FilterTabs({
  createLines,
  filter,
  onFilter,
  rows,
}: Readonly<{ createLines: ReadonlySet<number>; filter: ProductImportFilter; onFilter: (filter: ProductImportFilter) => void; rows: readonly ProductImportRow[] }>) {
  return (
    <div aria-label="Filtrar linhas" className="flex overflow-x-auto border-b-2 border-[#1a1a1a] [scrollbar-width:none]" role="tablist">
      {PRODUCT_IMPORT_FILTERS.map((item) => {
        const selected = item.key === filter;
        return (
          <button
            aria-selected={selected}
            className={[
              "relative inline-flex min-h-11 shrink-0 items-center gap-2 px-4 text-[11px] font-black uppercase tracking-[0.16em]",
              selected ? "text-[#1a1a1a] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-1.5 after:border-t-2 after:border-[#1a1a1a] after:bg-brand-yellow" : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]",
              FOCUS_RING,
            ].join(" ")}
            key={item.key}
            onClick={() => onFilter(item.key)}
            role="tab"
            type="button"
          >
            {item.label}
            <span className="font-(family-name:--font-admin-mono) opacity-70" data-numeric>
              {filterImportRows(rows, item.key, createLines).length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RowsTable({
  createLines,
  onToggleCreate,
  rows,
}: Readonly<{ createLines: ReadonlySet<number>; onToggleCreate: (line: number, create: boolean) => void; rows: readonly ProductImportRow[] }>) {
  if (rows.length === 0) {
    return (
      <div className="m-4 border-2 border-dashed border-[#1a1a1a] bg-[#faf8f2] px-6 py-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">Nenhuma linha neste filtro</p>
        <p className="mt-2 text-sm leading-6 text-[#231f20]/64">Troque o filtro acima para ver as outras linhas do arquivo.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]">
            <th className="border-b-2 border-[#1a1a1a] bg-[#f7f2e7] px-3 py-2.5">Linha</th>
            <th className="border-b-2 border-[#1a1a1a] bg-[#f7f2e7] px-3 py-2.5">Produto</th>
            <th className="hidden border-b-2 border-[#1a1a1a] bg-[#f7f2e7] px-3 py-2.5 md:table-cell">Categoria</th>
            <th className="hidden border-b-2 border-[#1a1a1a] bg-[#f7f2e7] px-3 py-2.5 text-right md:table-cell">Preço</th>
            <th className="border-b-2 border-[#1a1a1a] bg-[#f7f2e7] px-3 py-2.5">Situação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ImportRowItem chosen={createLines.has(row.line)} key={row.line} onToggleCreate={onToggleCreate} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImportRowItem({
  chosen,
  onToggleCreate,
  row,
}: Readonly<{ chosen: boolean; onToggleCreate: (line: number, create: boolean) => void; row: ProductImportRow }>) {
  return (
    <tr className="border-b-2 border-[#1a1a1a]/10 align-top hover:bg-[#fffdf5]">
      <td className="w-px whitespace-nowrap px-3 py-2.5 font-(family-name:--font-admin-mono) text-xs text-[#1a1a1a]/60" data-numeric>
        {row.line}
      </td>
      <td className="min-w-52 px-3 py-2.5">
        <p className={row.name ? "font-bold text-[#1a1a1a]" : "font-bold text-[#c0392b]"}>{row.name || "(sem nome)"}</p>
        <RowIssues row={row} />
        <DuplicateDecision chosen={chosen} onToggleCreate={onToggleCreate} row={row} />
      </td>
      <td className="hidden px-3 py-2.5 md:table-cell">
        <RowCategory row={row} />
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-(family-name:--font-admin-mono) text-xs md:table-cell" data-numeric>
        <RowPrice row={row} />
      </td>
      <td className="px-3 py-2.5">
        <StatusChip className="whitespace-nowrap" compact {...importRowStatus(row, chosen)} />
      </td>
    </tr>
  );
}

function RowIssues({ row }: Readonly<{ row: ProductImportRow }>) {
  const notes = [...row.issues];
  if (row.status === "repetida" && row.repeatOf) notes.push({ field: "nome", level: "info", message: `Igual à linha ${row.repeatOf}; só a primeira entra.` });
  if (row.duplicateOf) notes.push({ field: "nome", level: "warn", message: `Já existe: ${row.duplicateOf.name} (${row.duplicateOf.sku}).` });
  if (notes.length === 0) return null;
  return (
    <ul className="mt-1 grid gap-1">
      {notes.map((issue) => (
        <li
          className={["flex items-start gap-1.5 text-xs leading-5", issue.level === "error" ? "font-semibold text-[#c0392b]" : "text-[#1a1a1a]/78"].join(" ")}
          key={`${issue.field}-${issue.message}`}
        >
          <IssueIcon level={issue.level} />
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}

function IssueIcon({ level }: Readonly<{ level: string }>) {
  if (level === "error") return <X aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.4} />;
  if (level === "warn") return <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.4} />;
  return <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.4} />;
}

function DuplicateDecision({
  chosen,
  onToggleCreate,
  row,
}: Readonly<{ chosen: boolean; onToggleCreate: (line: number, create: boolean) => void; row: ProductImportRow }>) {
  if (row.status !== "duplicado") return null;
  return (
    <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-xs font-semibold text-[#1a1a1a]">
      <input checked={chosen} className="size-4 accent-[#1a1a1a]" onChange={(event) => onToggleCreate(row.line, event.target.checked)} type="checkbox" />
      <span>É outro produto — cadastrar mesmo assim</span>
    </label>
  );
}

function RowCategory({ row }: Readonly<{ row: ProductImportRow }>) {
  if (!row.category) return <span className="font-semibold text-[#c0392b]">—</span>;
  return (
    <>
      <p className="text-[#1a1a1a]">{row.category.name}</p>
      {row.subcategories.length ? <p className="text-xs text-[#231f20]/64">{row.subcategories.join(", ")}</p> : null}
    </>
  );
}

function RowPrice({ row }: Readonly<{ row: ProductImportRow }>) {
  if (row.price === null) return <span className="text-[#c0392b]">—</span>;
  return (
    <>
      <span>{CURRENCY.format(row.price)}</span>
      {row.salePrice === null ? null : <span className="block text-[#231f20]/64">promo {CURRENCY.format(row.salePrice)}</span>}
    </>
  );
}
