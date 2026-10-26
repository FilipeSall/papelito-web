import {
  PRODUCT_IMPORT_EXAMPLE_ROWS,
  PRODUCT_IMPORT_TEMPLATE_COLUMNS,
  type ProductImportPreview,
  type ProductImportRow,
} from "../types/admin-product-import";

/** Recortes da tabela de conferência. */
export const PRODUCT_IMPORT_FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "entram", label: "Entram" },
  { key: "duplicados", label: "Já existem" },
  { key: "repetidas", label: "Repetidas" },
  { key: "erros", label: "Com erro" },
] as const;

/** Chave de um recorte da tabela de conferência. */
export type ProductImportFilter = (typeof PRODUCT_IMPORT_FILTERS)[number]["key"];

/** Contagens da conferência já com as decisões do admin aplicadas; os quatro grupos somam o total. */
export type ProductImportCounts = {
  entram: number;
  incompletosEntram: number;
  duplicadosFora: number;
  repetidas: number;
  erros: number;
};

/**
 * Diz se a linha entra no lote: nova, incompleta ou duplicada que o admin pediu para criar.
 * Linha repetida no arquivo e linha com erro nunca entram.
 */
export function rowWillEnter(row: ProductImportRow, createLines: ReadonlySet<number>): boolean {
  if (row.status === "novo" || row.status === "incompleto") return true;
  return row.status === "duplicado" && createLines.has(row.line);
}

/** Conta a conferência com as decisões atuais, para o botão e os indicadores. */
export function productImportCounts(rows: readonly ProductImportRow[], createLines: ReadonlySet<number>): ProductImportCounts {
  const counts: ProductImportCounts = { entram: 0, incompletosEntram: 0, duplicadosFora: 0, repetidas: 0, erros: 0 };
  for (const row of rows) {
    if (rowWillEnter(row, createLines)) {
      counts.entram += 1;
      if (row.incomplete) counts.incompletosEntram += 1;
    } else if (row.status === "duplicado") {
      counts.duplicadosFora += 1;
    } else if (row.status === "repetida") {
      counts.repetidas += 1;
    } else {
      counts.erros += 1;
    }
  }
  return counts;
}

/** Linhas de um recorte da tabela. */
export function filterImportRows(
  rows: readonly ProductImportRow[],
  filter: ProductImportFilter,
  createLines: ReadonlySet<number>,
): ProductImportRow[] {
  switch (filter) {
    case "entram":
      return rows.filter((row) => rowWillEnter(row, createLines));
    case "duplicados":
      return rows.filter((row) => row.status === "duplicado");
    case "repetidas":
      return rows.filter((row) => row.status === "repetida");
    case "erros":
      return rows.filter((row) => row.status === "erro");
    default:
      return [...rows];
  }
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[;"\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csvLine(cells: ReadonlyArray<string | number>): string {
  return cells.map(csvCell).join(";");
}

function leftOutReason(row: ProductImportRow): string {
  if (row.status === "repetida") return `Igual à linha ${row.repeatOf ?? "anterior"}; só a primeira entra.`;
  if (row.status === "duplicado") {
    return row.duplicateOf ? `Já existe no catálogo: ${row.duplicateOf.name} (${row.duplicateOf.sku}).` : "Já existe no catálogo.";
  }
  return row.issues.filter((issue) => issue.level === "error").map((issue) => issue.message).join(" | ");
}

function leftOutLabel(row: ProductImportRow): string {
  if (row.status === "repetida") return "Repetida";
  if (row.status === "duplicado") return "Já existe";
  return "Com erro";
}

/**
 * CSV das linhas que ficam de fora, com as colunas originais do arquivo mais linha, situação e
 * motivo — pronto para corrigir e reenviar. Usa `;`, o separador do Excel em português.
 */
export function productImportErrorReportCsv(preview: ProductImportPreview, createLines: ReadonlySet<number>): string {
  const header = csvLine([...preview.headers, "linha", "situacao", "motivo"]);
  const lines = preview.rows
    .filter((row) => !rowWillEnter(row, createLines))
    .map((row) => csvLine([...preview.headers.map((_, index) => row.cells[index] ?? ""), row.line, leftOutLabel(row), leftOutReason(row)]));
  return [header, ...lines].join("\n");
}

/** Modelo CSV com os cabeçalhos aceitos e as linhas de exemplo de `PRODUCT_IMPORT_EXAMPLE_ROWS`. */
export function productImportTemplateCsv(): string {
  return [csvLine(PRODUCT_IMPORT_TEMPLATE_COLUMNS.map((column) => column.key)), ...PRODUCT_IMPORT_EXAMPLE_ROWS.map(csvLine)].join("\n");
}

/**
 * Baixa um CSV gerado no navegador, com BOM para o Excel abrir os acentos certos.
 * Só funciona no cliente.
 */
export function downloadCsv(fileName: string, content: string): void {
  const url = URL.createObjectURL(new Blob(["﻿", content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
