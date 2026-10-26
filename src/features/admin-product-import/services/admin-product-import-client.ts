import { DirectUploadError, uploadDirectFile } from "@/lib/client/direct-upload";

import {
  PRODUCT_IMPORT_STATUSES,
  type ProductImportColumn,
  type ProductImportConfirmation,
  type ProductImportCreated,
  type ProductImportExisting,
  type ProductImportIssue,
  type ProductImportLeftOut,
  type ProductImportMissingColumns,
  type ProductImportPreview,
  type ProductImportPreviousLot,
  type ProductImportResult,
  type ProductImportRow,
  type ProductImportStatus,
  type ProductImportSummary,
} from "../types/admin-product-import";

const INVALID_PREVIEW = "A conferência da planilha veio num formato inesperado.";
const INVALID_RESULT = "O resultado da importação veio num formato inesperado.";
const ISSUE_LEVELS = new Set(["error", "warn", "info"]);

type Json = Record<string, unknown>;

/**
 * Falha da importação com o que a tela precisa para reagir: o código do WordPress (ex.:
 * `papelito_product_import_repeated_file`) e, na falta de colunas, o cabeçalho que foi lido.
 */
export class ProductImportError extends Error {
  readonly code: string | null;
  readonly status: number;
  readonly missingColumns: ProductImportMissingColumns | null;

  constructor(message: string, status: number, code: string | null, missingColumns: ProductImportMissingColumns | null = null) {
    super(message);
    this.name = "ProductImportError";
    this.code = code;
    this.status = status;
    this.missingColumns = missingColumns;
  }
}

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInt(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function count(value: unknown): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}

function money(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function list(value: unknown, message: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(message);
  return value;
}

function isStatus(value: unknown): value is ProductImportStatus {
  return typeof value === "string" && (PRODUCT_IMPORT_STATUSES as readonly string[]).includes(value);
}

function parseIssue(value: unknown): ProductImportIssue {
  if (!isRecord(value)) throw new Error(INVALID_PREVIEW);
  const level = ISSUE_LEVELS.has(text(value.level)) ? (value.level as ProductImportIssue["level"]) : "error";
  return { field: text(value.field), level, message: text(value.message) };
}

function parseExisting(value: unknown): ProductImportExisting | null {
  if (!isRecord(value) || !isPositiveInt(value.id)) return null;
  return { id: value.id, sku: text(value.sku), name: text(value.name) };
}

function parseCategory(value: unknown): ProductImportRow["category"] {
  return isRecord(value) ? { slug: text(value.slug), name: text(value.name) } : null;
}

function parseRow(value: unknown): ProductImportRow {
  if (!isRecord(value) || !isPositiveInt(value.line) || !isStatus(value.status)) throw new Error(INVALID_PREVIEW);
  return {
    line: value.line,
    cells: list(value.cells, INVALID_PREVIEW).map(text),
    name: text(value.name),
    category: parseCategory(value.category),
    subcategories: list(value.subcategories, INVALID_PREVIEW).map(text),
    price: money(value.price),
    salePrice: money(value.salePrice),
    incomplete: value.incomplete === true,
    status: value.status,
    issues: list(value.issues, INVALID_PREVIEW).map(parseIssue),
    repeatOf: isPositiveInt(value.repeatOf) ? value.repeatOf : null,
    duplicateOf: parseExisting(value.duplicateOf),
  };
}

function parseSummary(value: unknown): ProductImportSummary {
  if (!isRecord(value)) throw new Error(INVALID_PREVIEW);
  return {
    novo: count(value.novo),
    incompleto: count(value.incompleto),
    duplicado: count(value.duplicado),
    repetida: count(value.repetida),
    erro: count(value.erro),
    total: count(value.total),
  };
}

function parseColumn(value: unknown): ProductImportColumn {
  if (!isRecord(value)) throw new Error(INVALID_PREVIEW);
  return { header: text(value.header), field: typeof value.field === "string" ? value.field : null };
}

function parsePreviousLot(value: unknown): ProductImportPreviousLot | null {
  if (!isRecord(value) || typeof value.lot !== "string") return null;
  return { lot: value.lot, at: text(value.at), created: count(value.created) };
}

/** Converte a resposta da prévia; formato inesperado vira erro em vez de tela quebrada. */
export function parseProductImportPreview(value: unknown): ProductImportPreview {
  if (!isRecord(value) || typeof value.token !== "string" || value.token === "") throw new Error(INVALID_PREVIEW);
  return {
    token: value.token,
    fileName: text(value.fileName),
    headers: list(value.headers, INVALID_PREVIEW).map(text),
    columns: list(value.columns, INVALID_PREVIEW).map(parseColumn),
    alreadyImported: parsePreviousLot(value.alreadyImported),
    summary: parseSummary(value.summary),
    rows: list(value.rows, INVALID_PREVIEW).map(parseRow),
  };
}

function parseCreated(value: unknown): ProductImportCreated {
  if (!isRecord(value) || !isPositiveInt(value.line) || !isPositiveInt(value.productId)) throw new Error(INVALID_RESULT);
  return {
    line: value.line,
    productId: value.productId,
    sku: text(value.sku),
    name: text(value.name),
    incomplete: value.incomplete === true,
  };
}

function parseLeftOut(value: unknown): ProductImportLeftOut {
  if (!isRecord(value) || !isPositiveInt(value.line) || !isStatus(value.status)) throw new Error(INVALID_RESULT);
  return {
    line: value.line,
    name: text(value.name),
    status: value.status,
    issues: list(value.issues, INVALID_RESULT).map(parseIssue),
  };
}

/** Converte a resposta da confirmação. */
export function parseProductImportResult(value: unknown): ProductImportResult {
  if (!isRecord(value) || typeof value.lot !== "string") throw new Error(INVALID_RESULT);
  return {
    lot: value.lot,
    operationId: count(value.operationId),
    created: list(value.created, INVALID_RESULT).map(parseCreated),
    ignored: list(value.ignored, INVALID_RESULT).map(parseLeftOut),
    errors: list(value.errors, INVALID_RESULT).map(parseLeftOut),
  };
}

function parseMissingColumns(data: unknown): ProductImportMissingColumns | null {
  if (!isRecord(data) || !Array.isArray(data.missing) || !Array.isArray(data.columns)) return null;
  return { missing: data.missing.map(text), columns: data.columns.map(parseColumn) };
}

/**
 * Envia a planilha direto ao WordPress e devolve a conferência. Nada é gravado no catálogo:
 * o WordPress só lê, valida e guarda a prévia por 30 minutos atrás do token.
 */
export async function previewProductImport(file: File): Promise<ProductImportPreview> {
  try {
    return parseProductImportPreview(await uploadDirectFile<unknown>("admin-product-import", file));
  } catch (error) {
    if (error instanceof DirectUploadError) {
      throw new ProductImportError(error.message, error.status, error.code, parseMissingColumns(error.data));
    }
    throw error;
  }
}

/**
 * Confirma a conferência e cria o lote. O WordPress refaz a análise contra o catálogo do
 * momento; o lote entra inteiro ou não entra.
 */
export async function confirmProductImport(confirmation: ProductImportConfirmation): Promise<ProductImportResult> {
  const response = await fetch("/api/admin/products/import", {
    body: JSON.stringify(confirmation),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = isRecord(payload) ? payload : {};
    throw new ProductImportError(text(body.message) || "Não foi possível cadastrar os produtos.", response.status, text(body.code) || null);
  }
  return parseProductImportResult(payload);
}
