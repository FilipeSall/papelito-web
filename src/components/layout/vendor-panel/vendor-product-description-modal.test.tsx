import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../../../../test/msw/server";
import { itemSettingsResponse } from "../../../../test/msw/handlers/vendor-item-settings";
import { customizationResponse } from "../../../../test/msw/handlers/vendor-product-customization";
import type { VendorCodeTarget } from "@/features/vendor-item-settings/types/vendor-item-settings";
import { VendorProductDescriptionModal } from "./vendor-product-description-modal";

const ENDPOINT = "*/api/vendor/products/:productId/customization";
const FIELD_LABEL = "Descrição personalizada";
const RESTORE_LABEL = "Restaurar original";
const SWITCH_LABEL = "Mostrar a descrição personalizada na loja";

function modal(productId = 123) {
  const onClose = vi.fn();
  const onUpdated = vi.fn();
  const view = render(
    <VendorProductDescriptionModal productId={productId} productName="Seda" onClose={onClose} onUpdated={onUpdated} />,
  );
  return { ...view, onClose, onUpdated };
}

describe("VendorProductDescriptionModal", () => {
  it("conta caracteres Unicode do texto, aceita o limite e bloqueia excesso sem truncar", async () => {
    modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "😀".repeat(20000) } });
    expect(screen.getByText("20.000 / 20.000 caracteres")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
    fireEvent.change(editor, { target: { value: "😀".repeat(20001) } });
    expect(editor).toHaveValue("😀".repeat(20001));
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(screen.getByText(/limite excedido/)).toBeInTheDocument();
    expect(editor).toHaveAttribute("aria-invalid", "true");
  });
  it("preserva especificações fora dos parágrafos na referência e no editor", async () => {
    const canonical = "<p>Intro</p><ul><li>Specification</li></ul><p>Fim</p>";
    server.use(http.get(ENDPOINT, () => HttpResponse.json({
      ...customizationResponse(), canonical_description: canonical, effective_description: canonical,
    })));
    modal();
    expect(await screen.findByLabelText(FIELD_LABEL)).toHaveValue("Intro\n\nSpecification\n\nFim");
    expect(screen.getByText("Intro Specification Fim", { selector: "p" })).toBeInTheDocument();
  });

  it("copia a descrição da Papelito e avisa abaixo da referência", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    modal();
    await screen.findByLabelText(FIELD_LABEL);
    fireEvent.click(screen.getByRole("button", { name: /Ver original/ }));
    fireEvent.click(screen.getByRole("button", { name: "Copiar descrição da Papelito" }));
    await waitFor(() => expect(screen.getByText("Texto copiado")).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith("Descrição Papelito.");
  });

  it("preserva texto permitido fora de p e quebras simples depois de salvar", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "Before<p>Paragraph</p>After"))));
    const { onUpdated } = modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    expect(editor).toHaveValue("Before\n\nParagraph\n\nAfter");
    fireEvent.change(editor, { target: { value: "Line one\nLine two\n\nOutro parágrafo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledOnce());
    expect(editor).toHaveValue("Line one\nLine two\n\nOutro parágrafo");
  });

  it("mostra o loading padrão antes do formulário e foca o campo ao carregar", async () => {
    server.use(http.get(ENDPOINT, async () => {
      await delay(30);
      return HttpResponse.json(customizationResponse());
    }));
    modal();
    expect(screen.getByRole("status")).toHaveTextContent("Carregando descrição");
    expect(screen.queryByLabelText(FIELD_LABEL)).not.toBeInTheDocument();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    expect(editor).toHaveFocus();
    expect(screen.getByRole("switch", { name: SWITCH_LABEL })).not.toBeChecked();
  });

  it("abrir e cancelar não cria cópia; texto igual ao da Papelito não habilita salvar", async () => {
    const put = vi.fn();
    server.use(http.put(ENDPOINT, () => { put(); return HttpResponse.json(customizationResponse()); }));
    const { onClose } = modal();
    expect(await screen.findByLabelText(FIELD_LABEL)).toHaveValue("Descrição Papelito.");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: RESTORE_LABEL })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(put).not.toHaveBeenCalled();
  });

  it("voltar ao texto original desabilita salvar de novo", async () => {
    modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "Outro texto" } });
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
    fireEvent.change(editor, { target: { value: "Descrição Papelito." } });
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("a primeira edição liga a personalizada e desfazer desliga", async () => {
    modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "Minha versão" } });
    expect(screen.getByRole("switch", { name: SWITCH_LABEL })).toBeChecked();
    fireEvent.change(editor, { target: { value: "Descrição Papelito." } });
    expect(screen.getByRole("switch", { name: SWITCH_LABEL })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("ligar a personalizada sem mudar o texto habilita salvar", async () => {
    let received: unknown;
    server.use(http.put(ENDPOINT, async ({ request }) => {
      received = await request.json();
      return HttpResponse.json(customizationResponse(123, "<p>Descrição Papelito.</p>"));
    }));
    const { onUpdated } = modal();
    await screen.findByLabelText(FIELD_LABEL);
    fireEvent.click(screen.getByRole("switch", { name: SWITCH_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledOnce());
    expect(received).toEqual({ description: "<p>Descrição Papelito.</p>", use_vendor_description: true });
  });

  it("desligar a personalizada guarda o texto", async () => {
    let received: unknown;
    server.use(
      http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "<p>Minha versão.</p>"))),
      http.put(ENDPOINT, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(customizationResponse(123, "<p>Minha versão.</p>", false));
      }),
    );
    const { onUpdated } = modal();
    expect(await screen.findByLabelText(FIELD_LABEL)).toHaveValue("Minha versão.");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    fireEvent.click(screen.getByRole("switch", { name: SWITCH_LABEL }));
    expect(screen.getByText(/Este texto fica guardado/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
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
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "Rascunho" } });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/Descartar/)).not.toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  it("salva parágrafos escapados e aplica resposta sanitizada", async () => {
    let received: unknown;
    server.use(http.put(ENDPOINT, async ({ request }) => {
      received = await request.json();
      return HttpResponse.json(customizationResponse(123, "<p>Resposta sanitizada.</p>"));
    }));
    const { onUpdated } = modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "Texto & seguro\n\nOutro parágrafo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(editor).toHaveValue("Resposta sanitizada."));
    expect(received).toEqual({ description: "<p>Texto &amp; seguro</p>\n<p>Outro parágrafo</p>", use_vendor_description: true });
    expect(onUpdated).toHaveBeenCalledOnce();
  });

  it("com texto guardado não oferece mais restaurar o original", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "<p>Personalizada.</p>"))));
    modal();
    expect(await screen.findByLabelText(FIELD_LABEL)).toHaveValue("Personalizada.");
    expect(screen.queryByRole("button", { name: RESTORE_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Confirmar restauração/ })).not.toBeInTheDocument();
  });

  it("erro preserva rascunho e impede duplo envio e fechamento em voo", async () => {
    const put = vi.fn();
    server.use(http.put(ENDPOINT, async () => {
      put();
      await delay(60);
      return HttpResponse.json({ message: "Falha ao gravar." }, { status: 500 });
    }));
    const { onClose } = modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "Meu rascunho" } });
    const save = screen.getByRole("button", { name: "Salvar" });
    fireEvent.click(save);
    fireEvent.click(save);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao gravar.");
    expect(editor).toHaveValue("Meu rascunho");
    expect(put).toHaveBeenCalledOnce();
  });

  it("produto anterior não sobrescreve outro produto", async () => {
    server.use(http.get(ENDPOINT, async ({ params }) => {
      if (params.productId === "123") await delay(80);
      return HttpResponse.json(customizationResponse(Number(params.productId), "<p>Produto " + params.productId + "</p>"));
    }));
    const { rerender, onClose, onUpdated } = modal();
    rerender(<VendorProductDescriptionModal productId={456} productName="Kit" onClose={onClose} onUpdated={onUpdated} />);
    await waitFor(() => expect(screen.getByLabelText(FIELD_LABEL)).toHaveValue("Produto 456"));
    await delay(100);
    expect(screen.getByLabelText(FIELD_LABEL)).toHaveValue("Produto 456");
  });

  it("seller suspenso lê referência, mas não pode salvar", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ ...customizationResponse(123, "Existente"), can_edit: false })));
    modal();
    expect(await screen.findByLabelText(FIELD_LABEL)).toBeDisabled();
    expect(screen.getByText("Sua conta não pode alterar descrições no momento.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: RESTORE_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Fechar" })).toHaveLength(2);
  });
});

const SETTINGS_ENDPOINT = "*/api/vendor/products/:productId/settings";
const CODE_LABEL = "Seu código";
const CODE_TEST_SKU = "PPL-000123";
const CODE_TEST_VALUE = "000419";

function codeTarget(overrides: Partial<VendorCodeTarget> = {}): VendorCodeTarget {
  return { available: true, initialCode: null, isVariation: false, itemId: 11, sku: CODE_TEST_SKU, ...overrides };
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

describe("VendorProductDescriptionModal — seu código", () => {
  it("grava só o código no item da linha, aparado e com zeros à esquerda", async () => {
    let received: { productId: unknown; body: unknown } | null = null;
    const put = vi.fn();
    server.use(
      http.patch(SETTINGS_ENDPOINT, async ({ params, request }) => {
        received = { productId: params.productId, body: await request.json() };
        return HttpResponse.json(itemSettingsResponse(11, CODE_TEST_VALUE));
      }),
      http.put(ENDPOINT, () => { put(); return HttpResponse.json(customizationResponse(10)); }),
    );
    const { onUpdated } = codeModal(codeTarget({ isVariation: true }));
    expect(screen.getByText(`SKU Papelito: ${CODE_TEST_SKU}`)).toBeInTheDocument();
    expect(screen.getByText(/Vale só para esta variação/)).toBeInTheDocument();
    await screen.findByLabelText(FIELD_LABEL);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(CODE_LABEL), { target: { value: `  ${CODE_TEST_VALUE}  ` } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith({
      complete: true,
      description: null,
      vendorCode: expect.objectContaining({ productId: 11, vendorCode: CODE_TEST_VALUE }),
    }));
    expect(received).toEqual({ productId: "11", body: { vendor_code: CODE_TEST_VALUE } });
    expect(put).not.toHaveBeenCalled();
  });

  it("apagar o código envia null para remover a associação", async () => {
    let received: unknown;
    server.use(http.patch(SETTINGS_ENDPOINT, async ({ request }) => {
      received = await request.json();
      return HttpResponse.json(itemSettingsResponse(11, null));
    }));
    const { onUpdated } = codeModal(codeTarget({ initialCode: "MAT-8810" }));
    const field = screen.getByLabelText(CODE_LABEL);
    expect(field).toHaveValue("MAT-8810");
    fireEvent.change(field, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({
      vendorCode: expect.objectContaining({ vendorCode: null }),
    })));
    expect(received).toEqual({ vendor_code: null });
  });

  it("código acima de 60 caracteres bloqueia salvar sem truncar", () => {
    codeModal();
    const field = screen.getByLabelText(CODE_LABEL);
    fireEvent.change(field, { target: { value: "á".repeat(61) } });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("O código deve ter no máximo 60 caracteres.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    fireEvent.change(field, { target: { value: "á".repeat(60) } });
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("falha só no código mantém o editor aberto e entrega a descrição salva", async () => {
    server.use(
      http.patch(SETTINGS_ENDPOINT, () => HttpResponse.json({ message: "Falha no código." }, { status: 500 })),
      http.put(ENDPOINT, () => HttpResponse.json(customizationResponse(10, "<p>Nova.</p>"))),
    );
    const { onUpdated } = codeModal();
    fireEvent.change(await screen.findByLabelText(FIELD_LABEL), { target: { value: "Nova." } });
    fireEvent.change(screen.getByLabelText(CODE_LABEL), { target: { value: CODE_TEST_VALUE } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha no código.");
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ complete: false, vendorCode: null }));
    expect(screen.getByLabelText(CODE_LABEL)).toHaveValue(CODE_TEST_VALUE);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("sem schema do código avisa e continua editando a descrição", async () => {
    codeModal(codeTarget({ available: false }));
    expect(screen.getByText("O código do produto está indisponível no momento.")).toBeInTheDocument();
    expect(screen.queryByLabelText(CODE_LABEL)).not.toBeInTheDocument();
    expect(await screen.findByLabelText(FIELD_LABEL)).toBeEnabled();
  });

  it("descrição fora do ar não impede salvar o código", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ message: "Indisponível." }, { status: 500 })));
    const { onUpdated } = codeModal();
    await screen.findByRole("button", { name: "Tentar novamente" });
    fireEvent.change(screen.getByLabelText(CODE_LABEL), { target: { value: CODE_TEST_VALUE } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ complete: true })));
  });
});
