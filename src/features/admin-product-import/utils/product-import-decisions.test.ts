import { describe, expect, it } from "vitest";

import { productImportPreviewResponse, productImportResultResponse } from "../../../../test/msw/handlers/admin-product-import";
import { parseProductImportPreview, parseProductImportResult } from "../services/admin-product-import-client";
import {
  filterImportRows,
  productImportCounts,
  productImportErrorReportCsv,
  productImportTemplateCsv,
  rowWillEnter,
} from "./product-import-decisions";

const DECISIONS_TEST_DUPLICATE_LINE = 4;

function preview() {
  return parseProductImportPreview(productImportPreviewResponse());
}

describe("decisões da conferência de importação de produtos", () => {
  it("novo e incompleto entram; duplicado só quando o admin pede; repetida e erro nunca", () => {
    const rows = preview().rows;
    const none = new Set<number>();
    expect(rows.filter((row) => rowWillEnter(row, none)).map((row) => row.line)).toEqual([2, 3]);
    expect(rows.filter((row) => rowWillEnter(row, new Set([DECISIONS_TEST_DUPLICATE_LINE, 5, 6]))).map((row) => row.line)).toEqual([2, 3, 4]);
  });

  it("as quatro contagens somam o total e acompanham a decisão do duplicado", () => {
    const rows = preview().rows;
    expect(productImportCounts(rows, new Set())).toEqual({ entram: 2, incompletosEntram: 1, duplicadosFora: 1, repetidas: 1, erros: 1 });
    expect(productImportCounts(rows, new Set([DECISIONS_TEST_DUPLICATE_LINE]))).toEqual({
      entram: 3,
      incompletosEntram: 1,
      duplicadosFora: 0,
      repetidas: 1,
      erros: 1,
    });
  });

  it("filtra por recorte", () => {
    const rows = preview().rows;
    expect(filterImportRows(rows, "duplicados", new Set()).map((row) => row.line)).toEqual([DECISIONS_TEST_DUPLICATE_LINE]);
    expect(filterImportRows(rows, "erros", new Set()).map((row) => row.line)).toEqual([6]);
    expect(filterImportRows(rows, "todas", new Set())).toHaveLength(5);
  });

  it("relatório de erros traz as colunas do arquivo e o motivo de cada linha que fica de fora", () => {
    const csv = productImportErrorReportCsv(preview(), new Set()).split("\n");
    expect(csv[0]).toBe("nome;categoria;subcategorias;preco_regular;peso_kg;linha;situacao;motivo");
    expect(csv).toHaveLength(4);
    expect(csv[1]).toContain("Já existe no catálogo: Dichavador Neon (PPL-011849).");
    expect(csv[2]).toContain("Igual à linha 2");
    expect(csv[3]).toContain("Categoria “filtro” não existe");
  });

  it("duplicado pedido pelo admin sai do relatório de erros", () => {
    const csv = productImportErrorReportCsv(preview(), new Set([DECISIONS_TEST_DUPLICATE_LINE]));
    expect(csv).not.toContain("Dichavador Neon");
  });

  it("modelo CSV começa pelos cabeçalhos obrigatórios e tem a mesma largura em toda linha", () => {
    const [header, ...examples] = productImportTemplateCsv().split("\n");
    expect(header.startsWith("nome;categoria;subcategorias;preco_regular")).toBe(true);
    expect(examples).toHaveLength(3);
    expect(examples.every((line) => line.split(";").length === header.split(";").length)).toBe(true);
  });
});

describe("leitura das respostas da importação", () => {
  it("recusa prévia sem token", () => {
    expect(() => parseProductImportPreview({ ...productImportPreviewResponse(), token: "" })).toThrow();
  });

  it("recusa situação desconhecida", () => {
    const response = productImportPreviewResponse();
    response.rows[0].status = "aplicado";
    expect(() => parseProductImportPreview(response)).toThrow();
  });

  it("lê o resultado com criados, ignorados e erros", () => {
    const result = parseProductImportResult(productImportResultResponse([DECISIONS_TEST_DUPLICATE_LINE]));
    expect(result.lot).toBe("L-0001");
    expect(result.created.map((item) => item.sku)).toEqual(["PPL-015192", "PPL-015193", "PPL-015194"]);
    expect(result.ignored.map((item) => item.status)).toEqual(["repetida"]);
    expect(result.errors).toHaveLength(1);
  });
});
