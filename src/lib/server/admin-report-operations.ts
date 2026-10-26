import "server-only";

import { wpRest } from "@/lib/server/wp-rest";
import type { ReportOperation, ReportOperationStatus } from "@/types/admin-report-operations";

const STATUSES = new Set<ReportOperationStatus>(["running", "done", "partial", "empty", "failed"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function count(value: unknown): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function params(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function parseOperation(value: unknown): ReportOperation | null {
  if (!isRecord(value) || !Number.isSafeInteger(value.id)) return null;
  const status = text(value.status) as ReportOperationStatus;
  if (!STATUSES.has(status) || (value.kind !== "export" && value.kind !== "import")) return null;
  return {
    id: Number(value.id),
    kind: value.kind,
    report: text(value.report),
    title: text(value.title),
    params: params(value.params),
    status,
    rows: count(value.rows),
    created: count(value.created),
    ignored: count(value.ignored),
    errors: count(value.errors),
    lot: typeof value.lot === "string" ? value.lot : null,
    error: typeof value.error === "string" ? value.error : null,
    at: text(value.at),
    byName: text(value.byName),
  };
}

/**
 * Últimas exportações e lotes de importação, do mais novo para o mais antigo.
 *
 * O WordPress é a fonte e exige `manage_options`. A leitura é `no-store`: depois de uma
 * exportação ou de um lote, o `router.refresh()` precisa enxergar a linha nova.
 * Falha de leitura devolve lista vazia — a atividade é apoio, não pode derrubar a página.
 */
export async function getAdminReportOperations(accessToken: string, limit = 6): Promise<ReportOperation[]> {
  const result = await wpRest<unknown>(`/papelito/v1/admin/reports/operations?limit=${limit}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!result.ok || !isRecord(result.data) || !Array.isArray(result.data.items)) return [];
  return result.data.items.map(parseOperation).filter((item): item is ReportOperation => item !== null);
}
