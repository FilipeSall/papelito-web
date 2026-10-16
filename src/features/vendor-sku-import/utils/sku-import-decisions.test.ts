import { describe, expect, it } from "vitest";

import { skuImportPreviewResponse } from "../../../../test/msw/handlers/vendor-sku-import";
import { parseSkuImportPreview, parseSkuImportResult } from "../services/vendor-sku-import-client";
import type { SkuImportPreviewRow } from "../types/vendor-sku-import";
import {
  buildSkuImportConfirmRows,
  conflictingSkuImportLines,
  initialSkuImportDecisions,
  pendingSkuImportChanges,
  skuImportResultFeedback,
} from "./sku-import-decisions";

const DECISIONS_TEST_REVIEW_FAMILY = 11772;

function previewRows(): SkuImportPreviewRow[] {
  return parseSkuImportPreview(skuImportPreviewResponse()).rows;
}

describe("decisões da prévia de importação de SKUs", () => {
  it("só exato e sinônimo começam aplicados; revisão começa ignorada", () => {
    const decisions = initialSkuImportDecisions(previewRows());
    expect(decisions).toEqual({ 2: 11768, 3: 11845, 4: null, 5: null, 6: null });
  });

  it("conta os itens que mudam de fato, incluindo cada variação", () => {
    const rows = previewRows();
    const decisions = initialSkuImportDecisions(rows);
    expect(pendingSkuImportChanges(rows, decisions, new Set())).toBe(4);
  });

  it("escolher o candidato da revisão soma a alteração; ignorar a linha automática tira", () => {
    const rows = previewRows();
    const decisions = { ...initialSkuImportDecisions(rows), 4: DECISIONS_TEST_REVIEW_FAMILY, 2: null };
    expect(pendingSkuImportChanges(rows, decisions, new Set())).toBe(4);
    expect(buildSkuImportConfirmRows(rows, decisions).map((row) => row.line)).toEqual([3, 4]);
  });

  it("item alcançado pela linha da cor e pela linha da família conta uma vez", () => {
    const rows = previewRows();
    const family = rows[1].family;
    if (!family) throw new Error("fixture sem família");
    const blue = { ...rows[1], line: 9, family: { ...family, targets: [family.targets[0]] } };
    expect(pendingSkuImportChanges([rows[1], blue], { 3: 11845, 9: 11845 }, new Set())).toBe(3);
  });

  it("família fora das opções da linha é tratada como ignorada", () => {
    const rows = previewRows();
    expect(buildSkuImportConfirmRows(rows, { 4: 99999 })).toEqual([]);
  });

  it("envia os códigos vistos na prévia e preserva zero à esquerda como texto", () => {
    const rows = previewRows();
    rows[0] = { ...rows[0], code: "00585" };
    const [first] = buildSkuImportConfirmRows(rows, { 2: 11768 });
    expect(first).toEqual({
      line: 2,
      description: "SEDA PAPELITO BROWN KING SIZE",
      subgroup: "HEADSHOP - SEDA PAPELITO",
      code: "00585",
      family_id: 11768,
      expected: [{ product_id: 11768, current_code: "SEDA-01" }],
    });
  });

  it("linha já atualizada não é enviada", () => {
    const rows = previewRows();
    expect(buildSkuImportConfirmRows(rows, { 6: 11776 })).toEqual([]);
  });

  it("detecta dois códigos para o mesmo item e o mesmo código em produtos diferentes", () => {
    const rows = previewRows();
    const duplicated = { ...rows[0], line: 9, code: "7265" };
    expect([...conflictingSkuImportLines([...rows, duplicated], { 2: 11768, 9: 11768 })]).toEqual([2, 9]);
    const sameCode = { ...rows[2], code: "585" };
    expect([...conflictingSkuImportLines([rows[0], sameCode], { 2: 11768, 4: DECISIONS_TEST_REVIEW_FAMILY })]).toEqual([2, 4]);
  });
});

describe("mensagem final da importação", () => {
  it("sucesso conta os SKUs efetivamente gravados", () => {
    const result = parseSkuImportResult({
      batch_id: "b", summary: { updated_items: 32 },
      rows: [{ line: 2, description: "x", code: "1", status: "applied", reason: "", targets: [] }],
    });
    expect(skuImportResultFeedback(result)).toMatchObject({
      error: false,
      message: "Importação concluída! 32 SKUs foram atualizados com sucesso.",
    });
  });

  it("parcial informa quantos produtos não foram processados e por quê", () => {
    const result = parseSkuImportResult({
      batch_id: "b", summary: { updated_items: 27 },
      rows: [
        { line: 2, description: "x", code: "1", status: "applied", reason: "", targets: [] },
        { line: 3, description: "y", code: "2", status: "stale", reason: "O código mudou.", targets: [] },
      ],
    });
    expect(skuImportResultFeedback(result)).toMatchObject({
      message: "Importação concluída parcialmente: 27 SKUs atualizados e 1 produto não processado.",
      details: ["Linha 3: O código mudou."],
    });
  });

  it("resultado em formato inesperado é recusado em vez de exibido como sucesso", () => {
    expect(() => parseSkuImportResult({ rows: [] })).toThrow();
    expect(() => parseSkuImportResult({ summary: {}, rows: [{ line: 2, status: "ok", targets: [] }] })).toThrow();
  });
});
