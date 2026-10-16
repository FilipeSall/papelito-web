import { uploadDirectFile } from "@/lib/client/direct-upload";

import {
  SKU_IMPORT_RESULT_STATUSES,
  SKU_IMPORT_STATUSES,
  type SkuImportConfirmRow,
  type SkuImportFamily,
  type SkuImportPreview,
  type SkuImportPreviewRow,
  type SkuImportPreviewSummary,
  type SkuImportResult,
  type SkuImportResultRow,
  type SkuImportResultStatus,
  type SkuImportStatus,
  type SkuImportTarget,
} from "../types/vendor-sku-import";

const INVALID_PREVIEW = "A prévia da importação veio num formato inesperado.";
const INVALID_RESULT = "O resultado da importação veio num formato inesperado.";

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInt(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function list(value: unknown, message: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(message);
  return value;
}

function parseTarget(value: unknown): SkuImportTarget {
  if (!isRecord(value) || !isPositiveInt(value.product_id)) throw new Error(INVALID_PREVIEW);
  return {
    productId: value.product_id,
    name: text(value.name),
    papelitoSku: nullableString(value.papelito_sku),
    currentCode: nullableString(value.current_code),
    newCode: nullableString(value.new_code),
  };
}

function parseFamily(value: unknown): SkuImportFamily {
  if (!isRecord(value) || !isPositiveInt(value.family_id)) throw new Error(INVALID_PREVIEW);
  return {
    familyId: value.family_id,
    name: text(value.name),
    targets: list(value.targets, INVALID_PREVIEW).map(parseTarget),
  };
}

function parseStatus(value: unknown): SkuImportStatus {
  const status = SKU_IMPORT_STATUSES.find((item) => item === value);
  if (!status) throw new Error(INVALID_PREVIEW);
  return status;
}

function parsePreviewRow(value: unknown): SkuImportPreviewRow {
  if (!isRecord(value) || !isPositiveInt(value.line)) throw new Error(INVALID_PREVIEW);
  return {
    line: value.line,
    description: text(value.description),
    subgroup: text(value.subgroup),
    code: text(value.code),
    status: parseStatus(value.status),
    reason: text(value.reason),
    family: value.family === null ? null : parseFamily(value.family),
    candidates: list(value.candidates, INVALID_PREVIEW).map(parseFamily),
  };
}

function parseSummary(value: unknown): SkuImportPreviewSummary {
  if (!isRecord(value)) throw new Error(INVALID_PREVIEW);
  const count = (key: string) => (Number.isSafeInteger(value[key]) ? Number(value[key]) : 0);
  const byStatus = Object.fromEntries(SKU_IMPORT_STATUSES.map((status) => [status, count(status)]));
  return { ...(byStatus as Record<SkuImportStatus, number>), total: count("total"), changes: count("changes") };
}

/** Converte a resposta do WordPress na prévia tipada; formato inesperado vira erro. */
export function parseSkuImportPreview(value: unknown): SkuImportPreview {
  if (!isRecord(value)) throw new Error(INVALID_PREVIEW);
  return { summary: parseSummary(value.summary), rows: list(value.rows, INVALID_PREVIEW).map(parsePreviewRow) };
}

function parseResultStatus(value: unknown): SkuImportResultStatus {
  const status = SKU_IMPORT_RESULT_STATUSES.find((item) => item === value);
  if (!status) throw new Error(INVALID_RESULT);
  return status;
}

function parseResultRow(value: unknown): SkuImportResultRow {
  if (!isRecord(value) || !isPositiveInt(value.line)) throw new Error(INVALID_RESULT);
  return {
    line: value.line,
    description: text(value.description),
    code: text(value.code),
    status: parseResultStatus(value.status),
    reason: text(value.reason),
    targets: list(value.targets, INVALID_RESULT).map((target) => {
      if (!isRecord(target) || !isPositiveInt(target.product_id)) throw new Error(INVALID_RESULT);
      return {
        productId: target.product_id,
        name: text(target.name),
        oldCode: nullableString(target.old_code),
        newCode: nullableString(target.new_code),
      };
    }),
  };
}

/** Converte o resultado da confirmação; só `applied` representa gravação confirmada. */
export function parseSkuImportResult(value: unknown): SkuImportResult {
  if (!isRecord(value) || !isRecord(value.summary)) throw new Error(INVALID_RESULT);
  const updated = value.summary.updated_items;
  return {
    batchId: text(value.batch_id),
    updatedItems: Number.isSafeInteger(updated) ? Number(updated) : 0,
    rows: list(value.rows, INVALID_RESULT).map(parseResultRow),
  };
}

/**
 * Envia a planilha direto ao WordPress e devolve a prévia; nada é gravado nessa etapa.
 * Falhas chegam como `DirectUploadError`, com a mensagem de leitura do arquivo.
 */
export async function previewSkuImport(file: File): Promise<SkuImportPreview> {
  return parseSkuImportPreview(await uploadDirectFile<unknown>("vendor-sku-import", file));
}

/**
 * Confirma as linhas escolhidas pelo proxy autenticado.
 * O WordPress revalida cada linha; o resultado diz o que foi gravado de fato.
 */
export async function confirmSkuImport(rows: SkuImportConfirmRow[]): Promise<SkuImportResult> {
  const response = await fetch("/api/vendor/stock/vendor-codes/import", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isRecord(data) && typeof data.message === "string" ? data.message : null;
    throw new Error(message ?? "Não foi possível gravar os códigos. Nenhuma alteração foi salva.");
  }
  return parseSkuImportResult(data);
}
