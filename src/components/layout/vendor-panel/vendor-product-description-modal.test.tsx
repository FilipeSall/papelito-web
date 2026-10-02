import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../../../../test/msw/server";
import { itemSettingsResponse } from "../../../../test/msw/handlers/vendor-item-settings";
import { customizationResponse } from "../../../../test/msw/handlers/vendor-product-customization";
import type { VendorCodeTarget } from "@/features/vendor-item-settings/types/vendor-item-settings";
import { VendorProductDescriptionModal } from "./vendor-product-description-modal";

const ENDPOINT = "*/api/vendor/products/:productId/customization";
const OWN_TEXT_LABEL = "Seu texto para a loja";
const PAPELITO_TAB = "Papelito";
const OWN_TAB = "Meu texto";
const CANONICAL_TEXT = "Descrição Papelito.";

function modal(productId = 123) {
  const onClose = vi.fn();
  const onUpdated = vi.fn();
  const view = render(
    <VendorProductDescriptionModal productId={productId} productName="Seda" onClose={onClose} onUpdated={onUpdated} />,
  );
  return { ...view, onClose, onUpdated };
}

async function openOwnText() {
  fireEvent.click(await screen.findByRole("radio", { name: OWN_TAB }));
  return screen.getByRole("textbox", { name: OWN_TEXT_LABEL });
}

function saveButton() {
  return screen.getByRole("button", { name: "Salvar" });
}

describe("VendorProductDescriptionModal — descrição na loja", () => {
  it("sem texto próprio abre na aba Papelito, com o original só para leitura", async () => {
    modal();
    expect(await screen.findByRole("radio", { name: PAPELITO_TAB })).toBeChecked();
    expect(screen.getByText(CANONICAL_TEXT)).toBeInTheDocument();
    expect(screen.getByText("A loja mostra o texto da Papelito.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: OWN_TEXT_LABEL })).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("conta caracteres Unicode do texto, aceita o limite e bloqueia excesso sem truncar", async () => {
    modal();
    const editor = await openOwnText();
    fireEvent.change(editor, { target: { value: "😀".repeat(20000) } });
    expect(screen.getByText("20.000 / 20.000 caracteres")).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
    fireEvent.change(editor, { target: { value: "😀".repeat(20001) } });
    expect(editor).toHaveValue("😀".repeat(20001));
    expect(saveButton()).toBeDisabled();
    expect(screen.getByText(/limite excedido/)).toBeInTheDocument();
    expect(editor).toHaveAttribute("aria-invalid", "true");
  });

  it("preserva especificações fora dos parágrafos no original e no editor", async () => {
    const canonical = "<p>Intro</p><ul><li>Specification</li></ul><p>Fim</p>";
    server.use(http.get(ENDPOINT, () => HttpResponse.json({
      ...customizationResponse(), canonical_description: canonical, effective_description: canonical,
    })));
    modal();
    expect(await screen.findByText(/Intro\s+Specification\s+Fim/)).toBeInTheDocument();
    expect(await openOwnText()).toHaveValue("Intro\n\nSpecification\n\nFim");
  });

  it("'Usar como base' leva o original para o editor e passa a loja para o seu texto", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "<p>Antigo.</p>", false))));
    modal();
    expect(await screen.findByText("Seu texto continua guardado para quando você voltar a usá-lo.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Usar como base" }));
    expect(screen.getByRole("radio", { name: OWN_TAB })).toBeChecked();
    expect(screen.getByRole("textbox", { name: OWN_TEXT_LABEL })).toHaveValue(CANONICAL_TEXT);
    expect(screen.getByText("A loja mostra o seu texto.")).toBeInTheDocument();
  });

  it("preserva texto permitido fora de p e quebras simples depois de salvar", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "Before<p>Paragraph</p>After"))));
    const { onUpdated } = modal();
    const editor = await screen.findByRole("textbox", { name: OWN_TEXT_LABEL });
    expect(editor).toHaveValue("Before\n\nParagraph\n\nAfter");
    fireEvent.change(editor, { target: { value: "Line one\nLine two\n\nOutro parágrafo" } });
    fireEvent.click(saveButton());
    await waitFor(() => expect(onUpdated).toHaveBeenCalledOnce());
    expect(editor).toHaveValue("Line one\nLine two\n\nOutro parágrafo");
  });

  it("mostra um loading só para o produto inteiro e foca a escolha ao carregar", async () => {
    server.use(http.get(ENDPOINT, async () => {
      await delay(30);
      return HttpResponse.json(customizationResponse());
    }));
    modal();
    expect(screen.getByRole("status")).toHaveTextContent("Carregando produto");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    const papelito = await screen.findByRole("radio", { name: PAPELITO_TAB });
    await waitFor(() => expect(papelito).toHaveFocus());
  });

  it("abrir e cancelar não cria cópia", async () => {
    const put = vi.fn();
    server.use(http.put(ENDPOINT, () => { put(); return HttpResponse.json(customizationResponse()); }));
    const { onClose } = modal();
    await screen.findByRole("radio", { name: PAPELITO_TAB });
    expect(saveButton()).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(put).not.toHaveBeenCalled();
  });

  it("escolher Meu texto sem editar habilita salvar, e voltar para Papelito desabilita", async () => {
    let received: unknown;
    server.use(http.put(ENDPOINT, async ({ request }) => {
      received = await request.json();
      return HttpResponse.json(customizationResponse(123, "<p>Descrição Papelito.</p>"));
    }));
    const { onUpdated } = modal();
    await openOwnText();
    expect(saveButton()).toBeEnabled();
    fireEvent.click(screen.getByRole("radio", { name: PAPELITO_TAB }));
    expect(saveButton()).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: OWN_TAB }));
    fireEvent.click(saveButton());
    await waitFor(() => expect(onUpdated).toHaveBeenCalledOnce());
    expect(received).toEqual({ description: "<p>Descrição Papelito.</p>", use_vendor_description: true });
  });

  it("escolher Papelito guarda o texto próprio", async () => {
    let received: unknown;
    server.use(
      http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "<p>Minha versão.</p>"))),
      http.put(ENDPOINT, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(customizationResponse(123, "<p>Minha versão.</p>", false));
      }),
    );
    const { onUpdated } = modal();
    expect(await screen.findByRole("textbox", { name: OWN_TEXT_LABEL })).toHaveValue("Minha versão.");
    expect(saveButton()).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: PAPELITO_TAB }));
    expect(screen.getByText("Seu texto continua guardado para quando você voltar a usá-lo.")).toBeInTheDocument();
    fireEvent.click(saveButton());
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith({
      complete: true,
      description: expect.objectContaining({
        descriptionSource: "papelito", vendorDescription: "<p>Minha versão.</p>", vendorDescriptionEnabled: false,
      }),
      vendorCode: null,
    }));
    expect(received).toEqual({ description: "<p>Minha versão.</p>", use_vendor_description: false });
  });

  it("Cancelar e Esc fecham na hora, mesmo com alterações", async () => {
    const put = vi.fn();
    server.use(http.put(ENDPOINT, () => { put(); return HttpResponse.json(customizationResponse()); }));
    const { onClose } = modal();
    fireEvent.change(await openOwnText(), { target: { value: "Rascunho" } });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(put).not.toHaveBeenCalled();
  });

  it("salva parágrafos escapados e aplica resposta sanitizada", async () => {
    let received: unknown;
    server.use(http.put(ENDPOINT, async ({ request }) => {
      received = await request.json();
      return HttpResponse.json(customizationResponse(123, "<p>Resposta sanitizada.</p>"));
    }));
    const { onUpdated } = modal();
    const editor = await openOwnText();
    fireEvent.change(editor, { target: { value: "Texto & seguro\n\nOutro parágrafo" } });
    fireEvent.click(saveButton());
    await waitFor(() => expect(screen.getByRole("textbox", { name: OWN_TEXT_LABEL })).toHaveValue("Resposta sanitizada."));
    expect(received).toEqual({ description: "<p>Texto &amp; seguro</p>\n<p>Outro parágrafo</p>", use_vendor_description: true });
    expect(onUpdated).toHaveBeenCalledOnce();
  });

  it("erro preserva rascunho e impede duplo envio e fechamento em voo", async () => {
    const put = vi.fn();
    server.use(http.put(ENDPOINT, async () => {
      put();
      await delay(60);
      return HttpResponse.json({ message: "Falha ao gravar." }, { status: 500 });
    }));
    const { onClose } = modal();
    const editor = await openOwnText();
    fireEvent.change(editor, { target: { value: "Meu rascunho" } });
    const save = saveButton();
    fireEvent.click(save);
    fireEvent.click(save);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao gravar.");
    expect(screen.getByRole("textbox", { name: OWN_TEXT_LABEL })).toHaveValue("Meu rascunho");
    expect(put).toHaveBeenCalledOnce();
  });

  it("produto anterior não sobrescreve outro produto", async () => {
    server.use(http.get(ENDPOINT, async ({ params }) => {
      if (params.productId === "123") await delay(80);
      return HttpResponse.json(customizationResponse(Number(params.productId), "<p>Produto " + params.productId + "</p>"));
    }));
    const { rerender, onClose, onUpdated } = modal();
    rerender(<VendorProductDescriptionModal productId={456} productName="Kit" onClose={onClose} onUpdated={onUpdated} />);
    await waitFor(() => expect(screen.getByRole("textbox", { name: OWN_TEXT_LABEL })).toHaveValue("Produto 456"));
    await delay(100);
    expect(screen.getByRole("textbox", { name: OWN_TEXT_LABEL })).toHaveValue("Produto 456");
  });

  it("seller suspenso lê, mas não pode salvar nem trocar a escolha", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ ...customizationResponse(123, "Existente"), can_edit: false })));
    modal();
    expect(await screen.findByRole("textbox", { name: OWN_TEXT_LABEL })).toBeDisabled();
    expect(screen.getByRole("radio", { name: PAPELITO_TAB })).toBeDisabled();
    expect(screen.getByText("Sua conta não pode alterar produtos no momento.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Fechar" })).toHaveLength(2);
  });
});

const SETTINGS_ENDPOINT = "*/api/vendor/products/:productId/settings";
const SKU_LABEL = "SKU";
const SKU_TEST_FALLBACK = "PPL-000123";
const SKU_TEST_VALUE = "000419";

function codeTarget(overrides: Partial<VendorCodeTarget> = {}): VendorCodeTarget {
  return { available: true, initialCode: null, isVariation: false, itemId: 11, sku: SKU_TEST_FALLBACK, ...overrides };
}

function codeModal(target: VendorCodeTarget = codeTarget()) {
  const onClose = vi.fn();
  const onUpdated = vi.fn();
  render(
    <VendorProductDescriptionModal
      productId={10}
      productName="Seda"
      vendorCode={target}
      onClose={onClose}
      onUpdated={onUpdated}
    />,
  );
  return { onClose, onUpdated };
}

describe("VendorProductDescriptionModal — SKU", () => {
  it("abre com o SKU que vale, sem distinguir de onde ele vem", async () => {
    codeModal(codeTarget({ isVariation: true }));
    const field = await screen.findByLabelText(SKU_LABEL);
    expect(field).toHaveValue(SKU_TEST_FALLBACK);
    expect(screen.queryByText(/Papelito:/)).not.toBeInTheDocument();
    expect(screen.getByText("Vale só para esta variação")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("grava só o SKU no item da linha, aparado e com zeros à esquerda", async () => {
    let received: { productId: unknown; body: unknown } | null = null;
    const put = vi.fn();
    server.use(
      http.patch(SETTINGS_ENDPOINT, async ({ params, request }) => {
        received = { productId: params.productId, body: await request.json() };
        return HttpResponse.json(itemSettingsResponse(11, SKU_TEST_VALUE));
      }),
      http.put(ENDPOINT, () => { put(); return HttpResponse.json(customizationResponse(10)); }),
    );
    const { onUpdated } = codeModal();
    fireEvent.change(await screen.findByLabelText(SKU_LABEL), { target: { value: `  ${SKU_TEST_VALUE}  ` } });
    fireEvent.click(saveButton());
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith({
      complete: true,
      description: null,
      vendorCode: expect.objectContaining({ productId: 11, vendorCode: SKU_TEST_VALUE }),
    }));
    expect(received).toEqual({ productId: "11", body: { vendor_code: SKU_TEST_VALUE } });
    expect(put).not.toHaveBeenCalled();
  });

  it("voltar a digitar o SKU de reserva não conta como alteração", async () => {
    codeModal();
    const field = await screen.findByLabelText(SKU_LABEL);
    fireEvent.change(field, { target: { value: "X-1" } });
    expect(saveButton()).toBeEnabled();
    fireEvent.change(field, { target: { value: SKU_TEST_FALLBACK } });
    expect(saveButton()).toBeDisabled();
  });

  it("apagar o SKU próprio grava null e o campo volta ao de reserva", async () => {
    let received: unknown;
    server.use(http.patch(SETTINGS_ENDPOINT, async ({ request }) => {
      received = await request.json();
      return HttpResponse.json(itemSettingsResponse(11, null));
    }));
    const { onUpdated } = codeModal(codeTarget({ initialCode: "MAT-8810" }));
    const field = await screen.findByLabelText(SKU_LABEL);
    expect(field).toHaveValue("MAT-8810");
    fireEvent.click(screen.getByRole("button", { name: "Limpar SKU" }));
    expect(field).toHaveValue("");
    expect(field).toHaveAttribute("placeholder", SKU_TEST_FALLBACK);
    fireEvent.click(saveButton());
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({
      vendorCode: expect.objectContaining({ vendorCode: null }),
    })));
    expect(received).toEqual({ vendor_code: null });
    expect(field).toHaveValue(SKU_TEST_FALLBACK);
  });

  it("SKU acima de 60 caracteres bloqueia salvar sem truncar", async () => {
    codeModal();
    const field = await screen.findByLabelText(SKU_LABEL);
    fireEvent.change(field, { target: { value: "á".repeat(61) } });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("O SKU deve ter no máximo 60 caracteres.")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    fireEvent.change(field, { target: { value: "á".repeat(60) } });
    expect(saveButton()).toBeEnabled();
  });

  it("falha só no SKU mantém o editor aberto e entrega a descrição salva", async () => {
    server.use(
      http.patch(SETTINGS_ENDPOINT, () => HttpResponse.json({ message: "Falha no SKU." }, { status: 500 })),
      http.put(ENDPOINT, () => HttpResponse.json(customizationResponse(10, "<p>Nova.</p>"))),
    );
    const { onUpdated } = codeModal();
    fireEvent.change(await openOwnText(), { target: { value: "Nova." } });
    fireEvent.change(screen.getByLabelText(SKU_LABEL), { target: { value: SKU_TEST_VALUE } });
    fireEvent.click(saveButton());
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha no SKU.");
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ complete: false, vendorCode: null }));
    expect(screen.getByLabelText(SKU_LABEL)).toHaveValue(SKU_TEST_VALUE);
    expect(saveButton()).toBeEnabled();
  });

  it("sem schema do SKU avisa e continua editando a descrição", async () => {
    codeModal(codeTarget({ available: false }));
    expect(await screen.findByRole("radio", { name: PAPELITO_TAB })).toBeEnabled();
    expect(screen.getByText("O SKU do produto está indisponível no momento.")).toBeInTheDocument();
    expect(screen.queryByLabelText(SKU_LABEL)).not.toBeInTheDocument();
  });

  it("só mostra o SKU junto com a descrição carregada", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ message: "Indisponível." }, { status: 500 })));
    codeModal();
    expect(screen.queryByLabelText(SKU_LABEL)).not.toBeInTheDocument();
    await screen.findByRole("button", { name: "Tentar novamente" });
    expect(screen.queryByLabelText(SKU_LABEL)).not.toBeInTheDocument();
  });

  it("abre com o foco no SKU depois que o produto carrega", async () => {
    codeModal();
    await waitFor(() => expect(screen.getByLabelText(SKU_LABEL)).toHaveFocus());
  });
});
