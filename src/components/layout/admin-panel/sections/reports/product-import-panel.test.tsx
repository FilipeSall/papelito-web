import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../../../../../../test/msw/server";
import { PRODUCT_IMPORT_UPLOAD_URL, productImportPreviewResponse } from "../../../../../../test/msw/handlers/admin-product-import";
import { ProductImportPanel } from "./product-import-panel";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const IMPORT_TEST_FILE = "produtos-teste.csv";
const FLOW_TIMEOUT = 20_000;

function setup() {
  render(<ProductImportPanel lastLot={null} />);
  return userEvent.setup({ applyAccept: false });
}

async function openReview(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByTestId("product-import-dropzone").querySelector("input");
  if (!input) throw new Error("input de arquivo ausente");
  await user.upload(input, new File(["nome;categoria;preco_regular\n"], IMPORT_TEST_FILE, { type: "text/csv" }));
  return screen.findByRole("dialog");
}

describe("ProductImportPanel", () => {
  it("confere a planilha, cadastra o duplicado escolhido e mostra o lote", async () => {
    const user = setup();
    const dialog = await openReview(user);

    expect(await within(dialog).findAllByText("Seda Teste Brown Slim", { selector: "p" })).toHaveLength(2);
    expect(within(dialog).getByRole("button", { name: "Cadastrar 2 produtos" })).toBeEnabled();

    await user.click(within(dialog).getByRole("checkbox", { name: /cadastrar mesmo assim/ }));
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar 3 produtos" }));
    expect(within(dialog).getByText(/Cadastrar 3 produtos como rascunho\? 1 sem peso ou medidas/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Confirmar cadastro" }));
    expect(await within(dialog).findByText(/Lote L-0001 cadastrado/)).toBeInTheDocument();
    expect(within(dialog).getByText("PPL-015194")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Importar outra planilha" }));
    expect(refreshMock).toHaveBeenCalled();
  }, FLOW_TIMEOUT);

  it("exige o aceite para reimportar um arquivo que já gerou lote", async () => {
    server.use(
      http.post(PRODUCT_IMPORT_UPLOAD_URL, () =>
        HttpResponse.json({ ...productImportPreviewResponse(), alreadyImported: { lot: "L-0001", at: "2026-10-25T13:00:00Z", created: 3 } }, { status: 201 }),
      ),
    );
    const user = setup();
    const dialog = await openReview(user);

    expect(await within(dialog).findByText("Este arquivo já foi importado.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Cadastrar 2 produtos" })).toBeDisabled();
    await user.click(within(dialog).getByRole("checkbox", { name: /importar este arquivo de novo/ }));
    expect(within(dialog).getByRole("button", { name: "Cadastrar 2 produtos" })).toBeEnabled();
  });

  it("sem colunas obrigatórias mostra o cabeçalho lido e não abre a conferência", async () => {
    server.use(
      http.post(PRODUCT_IMPORT_UPLOAD_URL, () =>
        HttpResponse.json(
          {
            code: "papelito_product_import_missing_columns",
            message: "A planilha precisa das colunas nome, categoria e preco_regular.",
            data: { status: 422, stage: "read", missing: ["categoria", "preco_regular"], columns: [{ header: "Produto", field: "nome" }, { header: "Grupo", field: null }] },
          },
          { status: 422 },
        ),
      ),
    );
    const user = setup();
    const dialog = await openReview(user);

    expect(await within(dialog).findByText(/precisa das colunas nome, categoria e preco_regular/)).toBeInTheDocument();
    expect(within(dialog).getByText("Grupo")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Trocar arquivo" })).toBeInTheDocument();
  });

  it("falha do lote volta à conferência com a mensagem do WordPress", async () => {
    server.use(
      http.post("*/api/admin/products/import", () =>
        HttpResponse.json({ code: "papelito_product_import_failed", message: "Nenhum produto foi criado: linha 3 — Categoria não encontrada." }, { status: 500 }),
      ),
    );
    const user = setup();
    const dialog = await openReview(user);

    await user.click(await within(dialog).findByRole("button", { name: "Cadastrar 2 produtos" }));
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cadastro" }));
    expect(await within(dialog).findByText(/Nenhum produto foi criado/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Cadastrar 2 produtos" })).toBeInTheDocument();
  }, FLOW_TIMEOUT);

  it("recusa formato não suportado antes de enviar", async () => {
    const user = setup();
    const input = screen.getByTestId("product-import-dropzone").querySelector("input");
    if (!input) throw new Error("input de arquivo ausente");
    await user.upload(input, new File(["x"], "produtos.pdf"));
    expect(screen.getByRole("alert")).toHaveTextContent("Formato não suportado");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
