import type {
  SkuImportConfirmRow,
  SkuImportFamily,
  SkuImportPreviewRow,
  SkuImportResult,
} from "../types/vendor-sku-import";

/** Mensagem pronta para o banner do painel do vendor. */
export type SkuImportFeedback = {
  details?: string[];
  error: boolean;
  hint?: string;
  message: string;
  title: string;
};

/** Família escolhida por linha; `null` é linha ignorada. */
export type SkuImportDecisions = Record<number, number | null>;

const AUTOMATIC = new Set(["exact", "synonym"]);
const DECIDABLE = new Set(["exact", "synonym", "review", "conflict"]);

/**
 * Decisão inicial: só exato e sinônimo começam aplicados.
 * Revisão e conflito começam ignorados — o vendor precisa escolher conscientemente.
 */
export function initialSkuImportDecisions(rows: readonly SkuImportPreviewRow[]): SkuImportDecisions {
  return Object.fromEntries(
    rows.map((row) => [row.line, AUTOMATIC.has(row.status) && row.family ? row.family.familyId : null]),
  );
}

/** Produtos que o vendor pode escolher na linha: o automático e as sugestões de revisão. */
export function skuImportOptions(row: SkuImportPreviewRow): SkuImportFamily[] {
  if (!DECIDABLE.has(row.status)) return [];
  return row.family ? [row.family, ...row.candidates] : row.candidates;
}

/** Família escolhida para a linha, ou `null` quando ignorada ou fora das opções. */
export function selectedSkuImportFamily(
  row: SkuImportPreviewRow,
  decisions: SkuImportDecisions,
): SkuImportFamily | null {
  const familyId = decisions[row.line] ?? null;
  return skuImportOptions(row).find((family) => family.familyId === familyId) ?? null;
}

/** Itens da família cujo código muda de fato. */
export function changedSkuImportTargets(family: SkuImportFamily) {
  return family.targets.filter((target) => target.currentCode !== target.newCode);
}

function addToIndex(index: Map<string, Set<string>>, key: string, value: string) {
  const values = index.get(key) ?? new Set<string>();
  values.add(value);
  index.set(key, values);
}

/**
 * Linhas aplicadas que disputam o mesmo item com códigos diferentes, ou o mesmo código em
 * produtos diferentes. Espelha a regra do WordPress para o vendor resolver antes de enviar.
 */
export function conflictingSkuImportLines(
  rows: readonly SkuImportPreviewRow[],
  decisions: SkuImportDecisions,
): Set<number> {
  const codesByItem = new Map<string, Set<string>>();
  const familiesByCode = new Map<string, Set<string>>();
  const applied = rows.flatMap((row) => {
    const family = selectedSkuImportFamily(row, decisions);
    return family ? [{ row, family }] : [];
  });
  for (const { row, family } of applied) {
    family.targets.forEach((target) => addToIndex(codesByItem, String(target.productId), row.code));
    addToIndex(familiesByCode, row.code, String(family.familyId));
  }
  const lines = new Set<number>();
  for (const { row, family } of applied) {
    const itemClash = family.targets.some((target) => (codesByItem.get(String(target.productId))?.size ?? 0) > 1);
    const codeClash = (familiesByCode.get(row.code)?.size ?? 0) > 1;
    if (itemClash || codeClash) lines.add(row.line);
  }
  return lines;
}

/**
 * Quantidade exata de itens distintos que mudariam com as decisões atuais, sem as linhas em
 * conflito. Item alcançado por duas linhas com o mesmo código (uma cor e a família) conta uma vez.
 */
export function pendingSkuImportChanges(
  rows: readonly SkuImportPreviewRow[],
  decisions: SkuImportDecisions,
  conflicts: ReadonlySet<number>,
): number {
  const items = new Set<number>();
  for (const row of rows) {
    const family = selectedSkuImportFamily(row, decisions);
    if (!family || conflicts.has(row.line)) continue;
    changedSkuImportTargets(family).forEach((target) => items.add(target.productId));
  }
  return items.size;
}

/**
 * Corpo da confirmação: só linhas aplicadas que mudam algo, cada uma com os códigos vistos
 * na prévia para o WordPress recusar o que mudou nesse meio-tempo.
 */
export function buildSkuImportConfirmRows(
  rows: readonly SkuImportPreviewRow[],
  decisions: SkuImportDecisions,
): SkuImportConfirmRow[] {
  return rows.flatMap((row) => {
    const family = selectedSkuImportFamily(row, decisions);
    if (!family || changedSkuImportTargets(family).length === 0) return [];
    return [{
      line: row.line,
      description: row.description,
      subgroup: row.subgroup,
      code: row.code,
      family_id: family.familyId,
      expected: family.targets.map((target) => ({ product_id: target.productId, current_code: target.currentCode })),
    }];
  });
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Mensagem final da importação a partir do que foi gravado de fato.
 * Parcial quando alguma linha confirmada não foi gravada (alterada, recusada ou em conflito).
 */
export function skuImportResultFeedback(result: SkuImportResult): SkuImportFeedback {
  const failed = result.rows.filter((row) => row.status !== "applied" && row.status !== "up_to_date");
  const updated = pluralize(result.updatedItems, "SKU", "SKUs");
  if (failed.length === 0) {
    return {
      error: false,
      title: "Importação concluída",
      message: `Importação concluída! ${updated} ${result.updatedItems === 1 ? "foi atualizado" : "foram atualizados"} com sucesso.`,
    };
  }
  return {
    error: result.updatedItems === 0,
    title: "Importação concluída parcialmente",
    message: `Importação concluída parcialmente: ${updated} ${result.updatedItems === 1 ? "atualizado" : "atualizados"} e ${pluralize(failed.length, "produto não processado", "produtos não processados")}.`,
    details: failed.slice(0, 5).map((row) => `Linha ${row.line}: ${row.reason}`),
  };
}

/** Mensagem genérica de falha, com a etapa em que ela aconteceu. */
export function skuImportFailureFeedback(stage: "read" | "persist", message: string): SkuImportFeedback {
  return {
    error: true,
    title: stage === "read" ? "Erro na leitura da planilha" : "Erro na gravação dos códigos",
    message: "Não foi possível importar a planilha. Verifique o arquivo e tente novamente.",
    hint: message,
  };
}
