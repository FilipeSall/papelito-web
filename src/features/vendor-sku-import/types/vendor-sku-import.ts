/** Status de uma linha na prévia, decidido pelo WordPress; o painel só exibe. */
export type SkuImportStatus =
  | "exact"
  | "synonym"
  | "review"
  | "not_found"
  | "conflict"
  | "invalid"
  | "duplicate"
  | "up_to_date";

/** Item do estoque que recebe o código: produto simples, kit ou variação. */
export type SkuImportTarget = {
  productId: number;
  name: string;
  /** SKU fixo da Papelito, só para conferência. */
  papelitoSku: string | null;
  /** Código do vendor visto na prévia; volta na confirmação para detectar alteração concorrente. */
  currentCode: string | null;
  /** Valor que será gravado; `null` quando o código da planilha é o próprio SKU da Papelito. */
  newCode: string | null;
};

/** Produto do catálogo associado à linha, com os itens que serão alterados. */
export type SkuImportFamily = {
  familyId: number;
  name: string;
  targets: SkuImportTarget[];
};

/** Linha da planilha já associada ao catálogo. */
export type SkuImportPreviewRow = {
  line: number;
  description: string;
  subgroup: string;
  code: string;
  status: SkuImportStatus;
  reason: string;
  /** Associação automática (exata, sinônimo, conflito ou já atualizada). */
  family: SkuImportFamily | null;
  /** Sugestões para revisão humana; nunca escolhidas automaticamente. */
  candidates: SkuImportFamily[];
};

/** Totais da prévia por status e quantidade de itens que mudariam automaticamente. */
export type SkuImportPreviewSummary = Record<SkuImportStatus, number> & {
  total: number;
  changes: number;
};

/** Prévia completa devolvida pelo upload direto. */
export type SkuImportPreview = {
  summary: SkuImportPreviewSummary;
  rows: SkuImportPreviewRow[];
};

/** Linha enviada na confirmação; o WordPress refaz a associação e não confia nela. */
export type SkuImportConfirmRow = {
  line: number;
  description: string;
  subgroup: string;
  code: string;
  family_id: number;
  expected: { product_id: number; current_code: string | null }[];
};

/** Resultado efetivamente gravado de cada linha confirmada. */
export type SkuImportResultStatus = "applied" | "up_to_date" | "stale" | "rejected" | "conflict" | "duplicate";

/** Linha do resultado da confirmação. */
export type SkuImportResultRow = {
  line: number;
  description: string;
  code: string;
  status: SkuImportResultStatus;
  reason: string;
  targets: { productId: number; name: string; oldCode: string | null; newCode: string | null }[];
};

/** Resultado da confirmação: só conta como gravado o que o COMMIT confirmou. */
export type SkuImportResult = {
  batchId: string;
  updatedItems: number;
  rows: SkuImportResultRow[];
};

/** Todos os status da prévia, na ordem em que o painel os resume. */
export const SKU_IMPORT_STATUSES: readonly SkuImportStatus[] = [
  "exact",
  "synonym",
  "review",
  "not_found",
  "conflict",
  "invalid",
  "duplicate",
  "up_to_date",
];

/** Todos os status do resultado da confirmação. */
export const SKU_IMPORT_RESULT_STATUSES: readonly SkuImportResultStatus[] = [
  "applied",
  "up_to_date",
  "stale",
  "rejected",
  "conflict",
  "duplicate",
];

/** Extensões aceitas; a validação real do formato é do WordPress. */
export const SKU_IMPORT_ACCEPT = ".csv,.xlsx";

/** Limite do arquivo, igual ao do WordPress. */
export const SKU_IMPORT_MAX_BYTES = 2 * 1024 * 1024;

/** Limite de linhas por confirmação, igual ao do WordPress. */
export const SKU_IMPORT_MAX_ROWS = 2000;
