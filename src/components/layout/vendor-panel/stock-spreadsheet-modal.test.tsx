import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../../../../test/msw/server";
import {
  SKU_IMPORT_UPLOAD_URL,
  skuImportConfirmResponse,
  skuImportPreviewResponse,
} from "../../../../test/msw/handlers/vendor-sku-import";
import { StockSpreadsheetModal } from "./stock-spreadsheet-modal";

const SPREADSHEET_TEST_FILE = "estoque-erp.xlsx";

function renderModal() {
  const onImported = vi.fn();
  const onClose = vi.fn();
  render(<StockSpreadsheetModal onClose={onClose} onImported={onImported} open />);
  return { onClose, onImported, user: userEvent.setup({ applyAccept: false }) };
}

function fileInput() {
  const input = screen.getByTestId("sku-import-dropzone").querySelector("input");
  if (!input) throw new Error("input de arquivo ausente");
  return input;
}

async function openPreview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("tab", { name: "Importar" }));
  await user.upload(fileInput(), new File(["PK"], SPREADSHEET_TEST_FILE));
  await user.click(screen.getByRole("button", { name: "Ver prévia" }));
  await screen.findByRole("table");
}

describe("StockSpreadsheetModal", () => {
  it("abre em Exportar com os mesmos downloads do estoque", () => {
    renderModal();
    expect(screen.getByRole("tab", { name: "Exportar" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("link", { name: /Excel/ })).toHaveAttribute("href", "/api/vendor/stock/export");
    expect(screen.getByRole("link", { name: /CSV/ })).toHaveAttribute("href", "/api/vendor/stock/export?format=csv");
  });

  it("recusa formato não suportado antes de enviar e mostra o nome do arquivo válido", async () => {
    const { user } = renderModal();
    await user.click(screen.getByRole("tab", { name: "Importar" }));

    await user.upload(fileInput(), new File(["%PDF"], "nota.pdf"));
    expect(screen.getByRole("alert")).toHaveTextContent("Envie uma planilha .csv ou .xlsx.");
    expect(screen.getByRole("button", { name: "Ver prévia" })).toBeDisabled();

    await user.upload(fileInput(), new File(["PK"], SPREADSHEET_TEST_FILE));
    expect(screen.getByText(SPREADSHEET_TEST_FILE)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("prévia começa com revisão ignorada e conta só o que muda", async () => {
    const { user } = renderModal();
    await openPreview(user);

    expect(screen.getByText("1 linha precisa", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Produto para a linha 4" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Aplicar 4 alterações" })).toBeEnabled();
    expect(screen.getByText("3 variações: Azul, Rosa, Verde")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Produto para a linha 4" }), "11772");
    expect(screen.getByRole("button", { name: "Aplicar 5 alterações" })).toBeEnabled();

    await user.selectOptions(screen.getByRole("combobox", { name: "Produto para a linha 2" }), "");
    expect(screen.getByRole("button", { name: "Aplicar 4 alterações" })).toBeEnabled();
  });

  it("bloqueia a aplicação quando duas escolhas disputam o mesmo produto", async () => {
    server.use(http.post(SKU_IMPORT_UPLOAD_URL, () => {
      const preview = skuImportPreviewResponse();
      const exact = preview.rows[0].family;
      if (exact) preview.rows[2].candidates = [exact];
      return HttpResponse.json(preview, { status: 201 });
    }));
    const { user } = renderModal();
    await openPreview(user);

    await user.selectOptions(screen.getByRole("combobox", { name: "Produto para a linha 4" }), "11768");
    expect(screen.getByText("Resolva 2 linhas em conflito antes de aplicar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Aplicar/ })).toBeDisabled();
  });

  it("aplica, mostra o resultado por linha e avisa a página com a contagem gravada", async () => {
    let sentLines: number[] = [];
    server.use(http.post("*/api/vendor/stock/vendor-codes/import", async ({ request }) => {
      const body = await request.json() as { rows: Parameters<typeof skuImportConfirmResponse>[0] };
      sentLines = body.rows.map((row) => row.line);
      return HttpResponse.json(skuImportConfirmResponse(body.rows));
    }));
    const { onImported, user } = renderModal();
    await openPreview(user);

    await user.click(screen.getByRole("button", { name: "Aplicar 4 alterações" }));

    await screen.findByRole("button", { name: "Concluir" });
    expect(sentLines).toEqual([2, 3]);
    expect(within(screen.getByRole("table")).getAllByText("Atualizado")).toHaveLength(2);
    expect(onImported).toHaveBeenCalledWith(expect.objectContaining({
      error: false,
      message: "Importação concluída! 4 SKUs foram atualizados com sucesso.",
    }));
  });

  it("resultado parcial não é anunciado como sucesso", async () => {
    const { onImported, user } = renderModal();
    server.use(http.post(SKU_IMPORT_UPLOAD_URL, () => {
      const preview = skuImportPreviewResponse();
      preview.rows[0].code = "STALE";
      return HttpResponse.json(preview, { status: 201 });
    }));
    await openPreview(user);

    await user.click(screen.getByRole("button", { name: "Aplicar 4 alterações" }));

    await screen.findByText("Alterado antes");
    expect(onImported).toHaveBeenCalledWith(expect.objectContaining({
      message: "Importação concluída parcialmente: 3 SKUs atualizados e 1 produto não processado.",
    }));
  });

  it("falha de gravação fica na prévia e diz que nada foi salvo", async () => {
    server.use(http.post("*/api/vendor/stock/vendor-codes/import", () =>
      HttpResponse.json({ message: "Não foi possível gravar os códigos. Nenhuma alteração foi salva." }, { status: 500 }),
    ));
    const { onImported, user } = renderModal();
    await openPreview(user);

    await user.click(screen.getByRole("button", { name: "Aplicar 4 alterações" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Erro na gravação dos códigos");
    expect(alert).toHaveTextContent("Nenhuma alteração foi salva.");
    expect(screen.getByRole("button", { name: "Aplicar 4 alterações" })).toBeEnabled();
    expect(onImported).not.toHaveBeenCalled();
  });

  it("falha de leitura do arquivo volta para o envio com o motivo do WordPress", async () => {
    server.use(http.post(SKU_IMPORT_UPLOAD_URL, () =>
      HttpResponse.json({ code: "papelito_vendor_code_import_missing_columns", message: "A planilha precisa das colunas \"cod produto\" e \"descricao\"." }, { status: 422 }),
    ));
    const { user } = renderModal();
    await user.click(screen.getByRole("tab", { name: "Importar" }));
    await user.upload(fileInput(), new File(["a;b"], "erp.csv"));
    await user.click(screen.getByRole("button", { name: "Ver prévia" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Erro na leitura da planilha"));
    expect(screen.getByRole("alert")).toHaveTextContent("cod produto");
    expect(screen.getByTestId("sku-import-dropzone")).toBeInTheDocument();
  });
});
